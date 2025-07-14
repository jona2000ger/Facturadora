const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');
const emailService = require('../services/emailService');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de facturas a todas las rutas
router.use(protect);
router.use(hasPermission('invoices'));

// @desc    Obtener todas las facturas
// @route   GET /api/invoices
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', client_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, 
        i.tax_amount, i.total_amount, i.status, i.admin_status, i.notes, i.created_at, i.updated_at,
        c.name as client_name, c.email as client_email,
        u.first_name, u.last_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM invoices i WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      countQuery += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    if (client_id) {
      paramCount++;
      query += ` AND i.client_id = $${paramCount}`;
      countQuery += ` AND i.client_id = $${paramCount}`;
      params.push(client_id);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const [invoicesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, status || client_id ? params.slice(0, -2) : [])
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        invoices: invoicesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo facturas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener factura por ID con items
// @route   GET /api/invoices/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener factura con información del cliente y usuario
    const invoiceResult = await pool.query(
      `SELECT 
        i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, 
        i.tax_amount, i.total_amount, i.status, i.notes, i.created_at, i.updated_at,
        c.id as client_id, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address, c.tax_id as client_tax_id,
        u.first_name, u.last_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    // Obtener items de la factura
    const itemsResult = await pool.query(
      `SELECT 
        ii.id, ii.description, ii.quantity, ii.unit_price, ii.total_price, ii.created_at,
        p.id as product_id, p.name as product_name, p.sku
      FROM invoice_items ii
      LEFT JOIN products p ON ii.product_id = p.id
      WHERE ii.invoice_id = $1
      ORDER BY ii.created_at`,
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    res.json({
      success: true,
      data: {
        invoice
      }
    });
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear factura con items
// @route   POST /api/invoices
// @access  Private
router.post('/', [
  body('client_id').isUUID().withMessage('ID de cliente inválido'),
  body('issue_date').isDate().withMessage('Fecha de emisión inválida'),
  body('due_date').isDate().withMessage('Fecha de vencimiento inválida'),
  body('items').isArray({ min: 1 }).withMessage('Debe tener al menos un item'),
  body('items.*.description').notEmpty().withMessage('Descripción del item es requerida'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Cantidad debe ser mayor a 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio unitario debe ser mayor o igual a 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { client_id, issue_date, due_date, items, notes } = req.body;

    // Verificar que el cliente existe
    const clientResult = await pool.query(
      'SELECT id FROM clients WHERE id = $1 AND is_active = true',
      [client_id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cliente no encontrado' 
      });
    }

    // Calcular totales
    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.quantity * item.unit_price;
    });

    const tax_amount = subtotal * 0.16; // 16% IVA
    const total_amount = subtotal + tax_amount;

    // Generar número de factura
    const invoiceNumberResult = await pool.query(
      'SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = CURRENT_DATE'
    );
    const todayCount = parseInt(invoiceNumberResult.rows[0].count) + 1;
    const invoice_number = `FAC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(todayCount).padStart(4, '0')}`;

    // Crear factura (sin user_id por ahora)
    const invoiceResult = await pool.query(
      'INSERT INTO invoices (invoice_number, client_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, invoice_number, issue_date, due_date, subtotal, tax_amount, total_amount, status, notes, created_at, updated_at',
      [invoice_number, client_id, issue_date, due_date, subtotal, tax_amount, total_amount, notes]
    );

    const invoice = invoiceResult.rows[0];

    // Crear items de la factura y reducir stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
        [invoice.id, item.product_id || null, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
      
      // Reducir stock del producto si tiene product_id
      if (item.product_id) {
        const quantity = parseFloat(item.quantity);
        console.log(`Reduciendo stock: producto ${item.product_id}, cantidad ${quantity}`);
        const updateResult = await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1 RETURNING id, stock_quantity',
          [quantity, item.product_id]
        );
        console.log(`Stock actualizado para producto ${item.product_id}:`, updateResult.rows[0]);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        invoice
      }
    });
  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Enviar factura (cambiar estado a sent)
// @route   PUT /api/invoices/:id/send
// @access  Private
router.put('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la factura existe y está en draft
    const existingInvoice = await pool.query(
      `SELECT 
        i.id, i.status, i.admin_status, i.invoice_number, i.total_amount,
        c.name as client_name, c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1`,
      [id]
    );

    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    const invoice = existingInvoice.rows[0];

    if (invoice.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se pueden enviar facturas en estado borrador' 
      });
    }

    // Verificar que la factura esté aprobada administrativamente
    if (invoice.admin_status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'La factura debe estar aprobada por el administrador antes de poder enviarla' 
      });
    }

    // Verificar que el cliente tenga email
    if (!invoice.client_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'El cliente no tiene un email válido para enviar la factura' 
      });
    }

    // Actualizar estado de la factura
    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, invoice_number, status, updated_at',
      ['sent', id]
    );

    // Enviar correo electrónico con la factura
    try {
      await emailService.sendInvoiceEmail(invoice, invoice.client_email, invoice.client_name);
      
      res.json({
        success: true,
        data: {
          invoice: result.rows[0]
        },
        message: 'Factura enviada correctamente por correo electrónico'
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      
      // Si falla el email, revertir el estado de la factura
      await pool.query(
        'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['draft', id]
      );
      
      res.status(500).json({ 
        success: false, 
        error: 'Error al enviar el correo electrónico. La factura no fue enviada.' 
      });
    }
  } catch (error) {
    console.error('Error enviando factura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Registrar pago de factura
// @route   POST /api/invoices/:id/pay
// @access  Private
router.post('/:id/pay', [
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('payment_method').notEmpty().withMessage('El método de pago es requerido'),
  body('payment_date').isDate().withMessage('La fecha de pago es requerida'),
  body('reference_number').optional().notEmpty().withMessage('El número de referencia no puede estar vacío')
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
    const { amount, payment_method, payment_date, reference_number, notes } = req.body;

    // Verificar si la factura existe y está en estado sent
    const existingInvoice = await pool.query(
      'SELECT id, status, admin_status, total_amount FROM invoices WHERE id = $1',
      [id]
    );

    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    if (existingInvoice.rows[0].status !== 'sent') {
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se pueden pagar facturas que han sido enviadas' 
      });
    }

    // Verificar que la factura no esté rechazada administrativamente
    if (existingInvoice.rows[0].admin_status === 'rejected') {
      return res.status(400).json({ 
        success: false, 
        error: 'No se pueden pagar facturas que han sido rechazadas administrativamente' 
      });
    }

    // Registrar el pago
    await pool.query(
      'INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, amount, payment_date, payment_method, reference_number || null, notes || null]
    );

    // Actualizar estado de la factura a paid
    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, invoice_number, status, updated_at',
      ['paid', id]
    );

    res.json({
      success: true,
      data: {
        invoice: result.rows[0]
      },
      message: 'Pago registrado correctamente'
    });
  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar estado de factura
// @route   PUT /api/invoices/:id/status
// @access  Private
router.put('/:id/status', [
  body('status').isIn(['draft', 'sent', 'paid', 'cancelled']).withMessage('Estado inválido')
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
    const { status } = req.body;

    // Verificar si la factura existe
    const existingInvoice = await pool.query(
      'SELECT id, status FROM invoices WHERE id = $1',
      [id]
    );

    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    const result = await pool.query(
      'UPDATE invoices SET status = $1 WHERE id = $2 RETURNING id, invoice_number, status, updated_at',
      [status, id]
    );

    res.json({
      success: true,
      data: {
        invoice: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error actualizando estado de factura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar factura (solo borradores)
// @route   DELETE /api/invoices/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la factura existe y es un borrador
    const existingInvoice = await pool.query(
      'SELECT id, status FROM invoices WHERE id = $1',
      [id]
    );

    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    if (existingInvoice.rows[0].status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se pueden eliminar facturas en estado borrador' 
      });
    }

    // Restablecer stock antes de eliminar
    const itemsResult = await pool.query(
      'SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1 AND product_id IS NOT NULL',
      [id]
    );
    
    for (const item of itemsResult.rows) {
      const quantity = parseFloat(item.quantity);
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
        [quantity, item.product_id]
      );
    }

    // Eliminar items primero (cascade)
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
    
    // Eliminar factura
    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Factura eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando factura:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 