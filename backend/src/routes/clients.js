const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de clientes a todas las rutas
router.use(protect);
router.use(hasPermission('clients'));

// @desc    Obtener todos los clientes
// @route   GET /api/clients
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, phone, address, tax_id, is_active, created_at, updated_at
      FROM clients
      WHERE is_active = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM clients WHERE is_active = true';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR tax_id ILIKE $${paramCount})`;
      countQuery += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR tax_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const [clientsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        clients: clientsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener cliente por ID
// @route   GET /api/clients/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, phone, address, tax_id, is_active, created_at, updated_at FROM clients WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        client: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear cliente
// @route   POST /api/clients
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('tax_id').optional().notEmpty().withMessage('El ID fiscal no puede estar vacío')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, phone, address, tax_id } = req.body;

    const result = await pool.query(
      'INSERT INTO clients (name, email, phone, address, tax_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, address, tax_id, is_active, created_at, updated_at',
      [name, email, phone, address, tax_id]
    );

    res.status(201).json({
      success: true,
      data: {
        client: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar cliente
// @route   PUT /api/clients/:id
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('tax_id').optional().notEmpty().withMessage('El ID fiscal no puede estar vacío')
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
    const { name, email, phone, address, tax_id } = req.body;

    // Verificar si el cliente existe
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente no encontrado' 
      });
    }

    const result = await pool.query(
      'UPDATE clients SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), address = COALESCE($4, address), tax_id = COALESCE($5, tax_id) WHERE id = $6 RETURNING id, name, email, phone, address, tax_id, is_active, created_at, updated_at',
      [name, email, phone, address, tax_id, id]
    );

    res.json({
      success: true,
      data: {
        client: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar cliente (soft delete)
// @route   DELETE /api/clients/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el cliente existe
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente no encontrado' 
      });
    }

    // Verificar si tiene facturas asociadas
    const invoicesResult = await pool.query(
      'SELECT id FROM invoices WHERE client_id = $1',
      [id]
    );

    if (invoicesResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el cliente porque tiene facturas asociadas' 
      });
    }

    await pool.query(
      'UPDATE clients SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Cliente eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 