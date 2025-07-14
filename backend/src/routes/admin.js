const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de administración a todas las rutas
router.use(protect);
router.use(hasPermission('admin'));

// @desc    Obtener todas las facturas para administración
// @route   GET /api/admin/invoices
// @access  Private/Admin
router.get('/invoices', async (req, res) => {
  try {
    const { page = 1, limit = 10, admin_status = '', status = '', client_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, 
        i.tax_amount, i.total_amount, i.status, i.admin_status, i.admin_notes,
        i.admin_reviewed_at, i.notes, i.created_at, i.updated_at,
        c.name as client_name, c.email as client_email,
        u.first_name, u.last_name,
        admin_reviewer.first_name as admin_reviewer_first_name,
        admin_reviewer.last_name as admin_reviewer_last_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN users admin_reviewer ON i.admin_reviewed_by = admin_reviewer.id
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM invoices i WHERE 1=1';
    let params = [];
    let paramCount = 0;

    if (admin_status) {
      paramCount++;
      query += ` AND i.admin_status = $${paramCount}`;
      countQuery += ` AND i.admin_status = $${paramCount}`;
      params.push(admin_status);
    }

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
      pool.query(countQuery, admin_status || status || client_id ? params.slice(0, -2) : [])
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
    console.error('Error obteniendo facturas para admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener factura por ID para administración
// @route   GET /api/admin/invoices/:id
// @access  Private/Admin
router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener factura con información completa
    const invoiceResult = await pool.query(
      `SELECT 
        i.id, i.invoice_number, i.issue_date, i.due_date, i.subtotal, 
        i.tax_amount, i.total_amount, i.status, i.admin_status, i.admin_notes,
        i.admin_reviewed_at, i.notes, i.created_at, i.updated_at,
        c.id as client_id, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address, c.tax_id as client_tax_id,
        u.first_name, u.last_name,
        admin_reviewer.first_name as admin_reviewer_first_name,
        admin_reviewer.last_name as admin_reviewer_last_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN users admin_reviewer ON i.admin_reviewed_by = admin_reviewer.id
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

    // Obtener pagos de la factura
    const paymentsResult = await pool.query(
      `SELECT id, amount, payment_date, payment_method, reference_number, notes, created_at
       FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;
    invoice.payments = paymentsResult.rows;

    res.json({
      success: true,
      data: {
        invoice
      }
    });
  } catch (error) {
    console.error('Error obteniendo factura para admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar estado administrativo de factura
// @route   PUT /api/admin/invoices/:id/status
// @access  Private/Admin
router.put('/invoices/:id/status', [
  body('admin_status').isIn(['pending', 'approved', 'rejected', 'expired']).withMessage('Estado administrativo inválido'),
  body('admin_notes').optional().isString().withMessage('Notas administrativas deben ser texto')
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
    const { admin_status, admin_notes } = req.body;

    // Verificar si la factura existe
    const existingInvoice = await pool.query(
      'SELECT id, admin_status FROM invoices WHERE id = $1',
      [id]
    );

    if (existingInvoice.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    // Obtener el estado anterior para comparar
    const previousStatus = existingInvoice.rows[0].admin_status;
    
    // Actualizar estado administrativo
    const result = await pool.query(
      `UPDATE invoices 
       SET admin_status = $1, admin_notes = $2, admin_reviewed_by = $3, admin_reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, invoice_number, admin_status, admin_notes, admin_reviewed_at, updated_at`,
      [admin_status, admin_notes, req.user.id, id]
    );

    // Manejar cambios de stock según el estado administrativo
    console.log(`Cambiando estado de factura ${id} de ${previousStatus} a ${admin_status}`);
    
    if (admin_status === 'rejected' && previousStatus !== 'rejected') {
      console.log('Rechazando factura - restableciendo stock');
      // Si se rechaza la factura, restablecer el stock
      const itemsResult = await pool.query(
        'SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1 AND product_id IS NOT NULL',
        [id]
      );
      
      console.log(`Items encontrados para restablecer stock:`, itemsResult.rows);
      
              for (const item of itemsResult.rows) {
          const quantity = parseFloat(item.quantity);
          console.log(`Restableciendo stock: producto ${item.product_id}, cantidad ${quantity}`);
          const updateResult = await pool.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING id, stock_quantity',
            [quantity, item.product_id]
          );
          console.log(`Stock actualizado para producto ${item.product_id}:`, updateResult.rows[0]);
        }
    } else if (admin_status === 'approved' && previousStatus === 'rejected') {
      console.log('Aprobando factura rechazada - reduciendo stock');
      // Si se aprueba después de estar rechazada, reducir el stock nuevamente
      const itemsResult = await pool.query(
        'SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1 AND product_id IS NOT NULL',
        [id]
      );
      
      for (const item of itemsResult.rows) {
        const quantity = parseFloat(item.quantity);
        await pool.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1',
          [quantity, item.product_id]
        );
      }
    } else {
      console.log('No se requiere cambio de stock');
    }

    res.json({
      success: true,
      data: {
        invoice: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error actualizando estado administrativo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener estadísticas para el dashboard de admin
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    // Estadísticas de facturas por estado administrativo
    const adminStatusStats = await pool.query(`
      SELECT 
        admin_status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM invoices 
      GROUP BY admin_status
    `);

    // Estadísticas de facturas por estado general
    const statusStats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM invoices 
      GROUP BY status
    `);

    // Facturas recientes
    const recentInvoices = await pool.query(`
      SELECT 
        i.id, i.invoice_number, i.total_amount, i.admin_status, i.status, i.created_at,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    // Total de facturas y montos
    const totals = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_amount,
        COUNT(CASE WHEN admin_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN admin_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN admin_status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN admin_status = 'expired' THEN 1 END) as expired_count
      FROM invoices
    `);

    res.json({
      success: true,
      data: {
        adminStatusStats: adminStatusStats.rows,
        statusStats: statusStats.rows,
        recentInvoices: recentInvoices.rows,
        totals: totals.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener reporte de facturas por período
// @route   GET /api/admin/reports
// @access  Private/Admin
router.get('/reports', async (req, res) => {
  try {
    const { start_date, end_date, admin_status } = req.query;
    
    let query = `
      SELECT 
        i.id, i.invoice_number, i.issue_date, i.due_date, i.total_amount, 
        i.admin_status, i.status, i.created_at,
        c.name as client_name, c.email as client_email,
        u.first_name, u.last_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      query += ` AND i.created_at >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND i.created_at <= $${paramCount}`;
      params.push(end_date);
    }

    if (admin_status) {
      paramCount++;
      query += ` AND i.admin_status = $${paramCount}`;
      params.push(admin_status);
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        invoices: result.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 