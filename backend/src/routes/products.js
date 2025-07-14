const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de productos a todas las rutas
router.use(protect);
router.use(hasPermission('products'));

// @desc    Obtener todos los productos
// @route   GET /api/products
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, description, price, cost, sku, stock_quantity, is_active, created_at, updated_at
      FROM products
      WHERE is_active = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = true';
    let params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
      countQuery += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const [productsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products: productsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener producto por ID
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, description, price, cost, sku, stock_quantity, is_active, created_at, updated_at FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear producto
// @route   POST /api/products
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('La cantidad de stock debe ser un número entero positivo'),
  body('sku').optional().notEmpty().withMessage('El SKU no puede estar vacío')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description, price, cost, sku, stock_quantity } = req.body;

    const result = await pool.query(
      'INSERT INTO products (name, description, price, cost, sku, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, description, price, cost, sku, stock_quantity, is_active, created_at, updated_at',
      [name, description, price, cost, sku, stock_quantity || 0]
    );

    res.status(201).json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar producto
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('price').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('La cantidad de stock debe ser un número entero positivo'),
  body('sku').optional().notEmpty().withMessage('El SKU no puede estar vacío')
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
    const { name, description, price, cost, sku, stock_quantity } = req.body;

    // Verificar si el producto existe
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado' 
      });
    }

    const result = await pool.query(
      'UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), cost = COALESCE($4, cost), sku = COALESCE($5, sku), stock_quantity = COALESCE($6, stock_quantity) WHERE id = $7 RETURNING id, name, description, price, cost, sku, stock_quantity, is_active, created_at, updated_at',
      [name, description, price, cost, sku, stock_quantity, id]
    );

    res.json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar producto (soft delete)
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el producto existe
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Producto no encontrado' 
      });
    }

    // Verificar si tiene items de factura asociados
    const invoiceItemsResult = await pool.query(
      'SELECT id FROM invoice_items WHERE product_id = $1',
      [id]
    );

    if (invoiceItemsResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el producto porque está asociado a facturas' 
      });
    }

    await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 