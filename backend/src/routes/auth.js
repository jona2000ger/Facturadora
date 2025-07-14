const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');
const auditService = require('../services/auditService');

const router = express.Router();

// @desc    Prueba de endpoint
// @route   GET /api/auth/test
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de prueba funcionando correctamente'
  });
});

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name').notEmpty().withMessage('El apellido es requerido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, first_name, last_name } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El usuario ya existe' 
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role',
      [email, passwordHash, first_name, last_name]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Login con OTP
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role_id FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const user = userResult.rows[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Registrar intento fallido
      await auditService.logLoginAttempt(user.id, email, req, false, 'Contraseña incorrecta');
      
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar OTP
    const otp = otpService.generateOTP();
    
    // Guardar OTP en base de datos
    await otpService.saveOTP(user.id, otp);

    // Registrar intento exitoso de login
    await auditService.logLoginAttempt(user.id, email, req, true, null);

    // En desarrollo, mostrar OTP en la respuesta en lugar de enviar email
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP para ${user.email}: ${otp}`);
      
      res.json({
        success: true,
        message: 'Código de verificación generado (modo desarrollo)',
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          otp: otp // Solo en desarrollo
        }
      });
    } else {
      // Enviar OTP por email
      await emailService.sendOTPEmail(user.email, otp);

      res.json({
        success: true,
        message: 'Código de verificación enviado a su correo electrónico',
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Verificar OTP y completar login
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', [
  body('userId').isUUID().withMessage('ID de usuario inválido'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Código OTP inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { userId, otp } = req.body;

    // Verificar OTP
    const isValidOTP = await otpService.verifyStoredOTP(userId, otp);
    if (!isValidOTP) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código de verificación inválido o expirado' 
      });
    }

    // Obtener información completa del usuario
    const userResult = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role_id,
        r.name as role_name,
        ARRAY_AGG(p.name) as permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.role_id, r.name`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role_name,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    console.error('Error verificando OTP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Reenviar OTP
// @route   POST /api/auth/resend-otp
// @access  Public
router.post('/resend-otp', [
  body('userId').isUUID().withMessage('ID de usuario inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { userId } = req.body;

    // Obtener información del usuario
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = userResult.rows[0];

    // Generar nuevo OTP
    const otp = otpService.generateOTP();
    
    // Guardar OTP en base de datos
    await otpService.saveOTP(user.id, otp);

    // En desarrollo, mostrar OTP en la respuesta en lugar de enviar email
    if (process.env.NODE_ENV === 'development') {
      console.log(`Nuevo OTP para ${user.email}: ${otp}`);
      
      res.json({
        success: true,
        message: 'Nuevo código de verificación generado (modo desarrollo)',
        data: {
          otp: otp // Solo en desarrollo
        }
      });
    } else {
      // Enviar OTP por email
      await emailService.sendOTPEmail(user.email, otp);

      res.json({
        success: true,
        message: 'Nuevo código de verificación enviado a su correo electrónico'
      });
    }
  } catch (error) {
    console.error('Error reenviando OTP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Solicitar cambio de contraseña (enviar OTP)
// @route   POST /api/auth/request-password-change
// @access  Public
router.post('/request-password-change', [
  body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    // Buscar usuario por email
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Registrar intento fallido
      await auditService.logPasswordChangeEvent(
        null, 
        'request_otp', 
        req, 
        false, 
        'Usuario no encontrado',
        { email }
      );

      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = userResult.rows[0];

    // Generar OTP
    const otp = otpService.generateOTP();
    
    // Guardar OTP en base de datos
    await otpService.saveOTP(user.id, otp);

    // Registrar evento exitoso
    await auditService.logPasswordChangeEvent(
      user.id, 
      'request_otp', 
      req, 
      true, 
      null,
      { email, otpGenerated: true }
    );

    // En desarrollo, mostrar OTP en la respuesta
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP para cambio de contraseña - ${user.email}: ${otp}`);
      
      res.json({
        success: true,
        message: 'Código de verificación generado (modo desarrollo)',
        data: {
          userId: user.id,
          otp: otp // Solo en desarrollo
        }
      });
    } else {
      // Enviar OTP por email
      await emailService.sendOTPEmail(user.email, otp);

      res.json({
        success: true,
        message: 'Código de verificación enviado a tu correo electrónico',
        data: {
          userId: user.id
        }
      });
    }
  } catch (error) {
    console.error('Error solicitando cambio de contraseña:', error);
    
    // Registrar error
    await auditService.logPasswordChangeEvent(
      null, 
      'request_otp', 
      req, 
      false, 
      error.message,
      { email: req.body.email }
    );

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Verificar OTP para cambio de contraseña
// @route   POST /api/auth/verify-password-change-otp
// @access  Public
router.post('/verify-password-change-otp', [
  body('userId').isUUID().withMessage('ID de usuario inválido'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Código OTP inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { userId, otp } = req.body;

    // Verificar OTP
    const isValidOTP = await otpService.verifyStoredOTP(userId, otp);
    if (!isValidOTP) {
      // Registrar intento fallido
      await auditService.logPasswordChangeEvent(
        userId, 
        'verify_otp', 
        req, 
        false, 
        'Código OTP inválido o expirado',
        { otpProvided: otp }
      );

      return res.status(400).json({ 
        success: false, 
        error: 'Código de verificación inválido o expirado' 
      });
    }

    // Registrar verificación exitosa
    await auditService.logPasswordChangeEvent(
      userId, 
      'verify_otp', 
      req, 
      true, 
      null,
      { otpVerified: true }
    );

    res.json({
      success: true,
      message: 'Código verificado correctamente'
    });
  } catch (error) {
    console.error('Error verificando OTP para cambio de contraseña:', error);
    
    // Registrar error
    await auditService.logPasswordChangeEvent(
      req.body.userId, 
      'verify_otp', 
      req, 
      false, 
      error.message
    );

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Cambiar contraseña
// @route   POST /api/auth/change-password
// @access  Public
router.post('/change-password', [
  body('userId').isUUID().withMessage('ID de usuario inválido'),
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { userId, currentPassword, newPassword } = req.body;

    // Obtener usuario y verificar contraseña actual
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      // Registrar intento fallido
      await auditService.logPasswordChangeEvent(
        userId, 
        'password_changed', 
        req, 
        false, 
        'Usuario no encontrado'
      );

      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      // Registrar intento fallido
      await auditService.logPasswordChangeEvent(
        userId, 
        'password_changed', 
        req, 
        false, 
        'Contraseña actual incorrecta'
      );

      return res.status(400).json({ 
        success: false, 
        error: 'La contraseña actual es incorrecta' 
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña en base de datos
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Registrar cambio exitoso
    await auditService.logPasswordChangeEvent(
      userId, 
      'password_changed', 
      req, 
      true, 
      null,
      { passwordChanged: true, passwordLength: newPassword.length }
    );

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    
    // Registrar error
    await auditService.logPasswordChangeEvent(
      req.body.userId, 
      'password_changed', 
      req, 
      false, 
      error.message
    );

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener perfil del usuario
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.role_id, u.created_at,
        r.name as role_name,
        ARRAY_AGG(p.name) as permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.role_id, u.created_at, r.name`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role_name,
          created_at: user.created_at,
          permissions: user.permissions
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener historial de auditoría del usuario
// @route   GET /api/auth/audit-history
// @access  Private
router.get('/audit-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener historial de cambio de contraseña
    const passwordHistory = await auditService.getPasswordChangeHistory(userId, 20);
    
    // Obtener historial de login
    const loginHistory = await auditService.getLoginHistory(userId, 20);

    res.json({
      success: true,
      data: {
        passwordChangeHistory: passwordHistory,
        loginHistory: loginHistory
      }
    });
  } catch (error) {
    console.error('Error obteniendo historial de auditoría:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 