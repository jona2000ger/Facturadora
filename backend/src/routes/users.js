const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de usuarios a todas las rutas
router.use(protect);
router.use(hasPermission('users'));

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.is_active, 
        u.created_at, 
        u.updated_at,
        r.name as role,
        r.display_name as role_display_name,
        r.color as role_color
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      countQuery += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear nuevo usuario (solo admin)
// @route   POST /api/users
// @access  Private/Admin
router.post('/', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name').notEmpty().withMessage('El apellido es requerido'),
  body('role').optional().isIn(['user', 'admin', 'manager']).withMessage('Rol inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, first_name, last_name, role = 'user' } = req.body;

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

    // Obtener el role_id
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rol no encontrado' 
      });
    }

    const roleId = roleResult.rows[0].id;

    // Encriptar contraseña
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email, first_name, last_name, role_id, is_active, created_at',
      [email, passwordHash, first_name, last_name, roleId]
    );

    // Obtener el rol para la respuesta
    const userRoleResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [roleId]
    );

    const user = {
      ...result.rows[0],
      role: userRoleResult.rows[0].name
    };

    res.status(201).json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Solo permitir ver el propio perfil o ser admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para ver este usuario' 
      });
    }

    const result = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.is_active, 
        u.created_at, 
        u.updated_at,
        r.name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', [
  body('first_name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('last_name').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('role').optional().isIn(['user', 'admin', 'manager']).withMessage('Rol inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { first_name, last_name, role, password } = req.body;

    // Solo permitir actualizar el propio perfil o ser admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para actualizar este usuario' 
      });
    }

    // Solo admin puede cambiar roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para cambiar roles' 
      });
    }

    // Verificar si el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    // Construir la consulta de actualización
    let updateFields = [];
    let updateValues = [];
    let paramCount = 0;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${++paramCount}`);
      updateValues.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${++paramCount}`);
      updateValues.push(last_name);
    }

    if (password !== undefined) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      updateFields.push(`password_hash = $${++paramCount}`);
      updateValues.push(passwordHash);
    }

    if (role !== undefined) {
      // Obtener el role_id
      const roleResult = await pool.query(
        'SELECT id FROM roles WHERE name = $1',
        [role]
      );

      if (roleResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rol no encontrado' 
        });
      }

      updateFields.push(`role_id = $${++paramCount}`);
      updateValues.push(roleResult.rows[0].id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se proporcionaron campos para actualizar' 
      });
    }

    updateValues.push(id);
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = NOW() 
      WHERE id = $${paramCount + 1} 
      RETURNING id, email, first_name, last_name, role_id, is_active, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);

    // Obtener el rol para la respuesta
    const userRoleResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [result.rows[0].role_id]
    );

    const user = {
      ...result.rows[0],
      role: userRoleResult.rows[0].name
    };

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Cambiar estado de usuario (solo admin)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
router.put('/:id/status', [
  body('is_active').isBoolean().withMessage('Estado inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    // Verificar si el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    const result = await pool.query(`
      UPDATE users 
      SET is_active = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, email, first_name, last_name, role_id, is_active, updated_at
    `, [is_active, id]);

    // Obtener el rol para la respuesta
    const userRoleResult = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [result.rows[0].role_id]
    );

    const user = {
      ...result.rows[0],
      role: userRoleResult.rows[0].name
    };

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('Error cambiando estado de usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar usuario (solo admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    // No permitir eliminar el propio usuario
    if (req.user.id === id) {
      return res.status(400).json({ 
        success: false, 
        error: 'No puedes eliminar tu propia cuenta' 
      });
    }

    // Eliminar usuario
    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 