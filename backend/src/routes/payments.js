const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// @desc    Obtener pagos por factura
// @route   GET /api/payments/invoice/:invoiceId
// @access  Private
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Verificar que la factura existe
    const invoiceResult = await pool.query(
      'SELECT id, total_amount FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    const paymentsResult = await pool.query(
      'SELECT id, amount, payment_date, payment_method, reference_number, notes, created_at FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
      [invoiceId]
    );

    // Calcular total pagado
    const totalPaid = paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const remainingAmount = parseFloat(invoiceResult.rows[0].total_amount) - totalPaid;

    res.json({
      success: true,
      data: {
        payments: paymentsResult.rows,
        summary: {
          total_amount: parseFloat(invoiceResult.rows[0].total_amount),
          total_paid: totalPaid,
          remaining_amount: remainingAmount,
          is_paid: remainingAmount <= 0
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear pago
// @route   POST /api/payments
// @access  Private
router.post('/', [
  body('invoice_id').isUUID().withMessage('ID de factura inválido'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('payment_date').isDate().withMessage('Fecha de pago inválida'),
  body('payment_method').optional().notEmpty().withMessage('Método de pago no puede estar vacío'),
  body('reference_number').optional().notEmpty().withMessage('Número de referencia no puede estar vacío')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { invoice_id, amount, payment_date, payment_method, reference_number, notes } = req.body;

    // Verificar que la factura existe
    const invoiceResult = await pool.query(
      'SELECT id, total_amount, status FROM invoices WHERE id = $1',
      [invoice_id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Factura no encontrada' 
      });
    }

    // Verificar que la factura no esté cancelada
    if (invoiceResult.rows[0].status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        error: 'No se pueden registrar pagos en facturas canceladas' 
      });
    }

    // Obtener total pagado hasta ahora
    const existingPaymentsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [invoice_id]
    );

    const totalPaid = parseFloat(existingPaymentsResult.rows[0].total_paid);
    const totalAmount = parseFloat(invoiceResult.rows[0].total_amount);
    const newTotalPaid = totalPaid + parseFloat(amount);

    // Verificar que no se exceda el monto total
    if (newTotalPaid > totalAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto del pago excede el total de la factura' 
      });
    }

    // Crear el pago
    const paymentResult = await pool.query(
      'INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at',
      [invoice_id, amount, payment_date, payment_method, reference_number, notes]
    );

    // Actualizar estado de la factura si está completamente pagada
    if (newTotalPaid >= totalAmount) {
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['paid', invoice_id]
      );
    } else if (invoiceResult.rows[0].status === 'draft') {
      // Cambiar a enviada si es la primera vez que se paga
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['sent', invoice_id]
      );
    }

    res.status(201).json({
      success: true,
      data: {
        payment: paymentResult.rows[0],
        summary: {
          total_amount: totalAmount,
          total_paid: newTotalPaid,
          remaining_amount: totalAmount - newTotalPaid,
          is_paid: newTotalPaid >= totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener pago por ID
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at FROM payments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pago no encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        payment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar pago
// @route   PUT /api/payments/:id
// @access  Private
router.put('/:id', [
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('payment_date').optional().isDate().withMessage('Fecha de pago inválida'),
  body('payment_method').optional().notEmpty().withMessage('Método de pago no puede estar vacío'),
  body('reference_number').optional().notEmpty().withMessage('Número de referencia no puede estar vacío')
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
    const { amount, payment_date, payment_method, reference_number, notes } = req.body;

    // Verificar que el pago existe
    const existingPayment = await pool.query(
      'SELECT id, invoice_id, amount FROM payments WHERE id = $1',
      [id]
    );

    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pago no encontrado' 
      });
    }

    const oldAmount = parseFloat(existingPayment.rows[0].amount);
    const newAmount = amount ? parseFloat(amount) : oldAmount;

    // Si se cambió el monto, verificar que no exceda el total de la factura
    if (amount && newAmount !== oldAmount) {
      const invoiceResult = await pool.query(
        'SELECT total_amount FROM invoices WHERE id = $1',
        [existingPayment.rows[0].invoice_id]
      );

      const totalAmount = parseFloat(invoiceResult.rows[0].total_amount);
      const otherPaymentsResult = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) as other_payments FROM payments WHERE invoice_id = $1 AND id != $2',
        [existingPayment.rows[0].invoice_id, id]
      );

      const otherPayments = parseFloat(otherPaymentsResult.rows[0].other_payments);
      const newTotalPaid = otherPayments + newAmount;

      if (newTotalPaid > totalAmount) {
        return res.status(400).json({ 
          success: false, 
          error: 'El monto del pago excede el total de la factura' 
        });
      }
    }

    const result = await pool.query(
      'UPDATE payments SET amount = COALESCE($1, amount), payment_date = COALESCE($2, payment_date), payment_method = COALESCE($3, payment_method), reference_number = COALESCE($4, reference_number), notes = COALESCE($5, notes) WHERE id = $6 RETURNING id, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_at',
      [amount, payment_date, payment_method, reference_number, notes, id]
    );

    res.json({
      success: true,
      data: {
        payment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error actualizando pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar pago
// @route   DELETE /api/payments/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el pago existe
    const existingPayment = await pool.query(
      'SELECT id, invoice_id FROM payments WHERE id = $1',
      [id]
    );

    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pago no encontrado' 
      });
    }

    // Eliminar el pago
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);

    // Recalcular estado de la factura
    const remainingPaymentsResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id = $1',
      [existingPayment.rows[0].invoice_id]
    );

    const totalPaid = parseFloat(remainingPaymentsResult.rows[0].total_paid);
    const invoiceResult = await pool.query(
      'SELECT total_amount FROM invoices WHERE id = $1',
      [existingPayment.rows[0].invoice_id]
    );

    const totalAmount = parseFloat(invoiceResult.rows[0].total_amount);

    // Actualizar estado de la factura
    if (totalPaid >= totalAmount) {
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['paid', existingPayment.rows[0].invoice_id]
      );
    } else if (totalPaid > 0) {
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['sent', existingPayment.rows[0].invoice_id]
      );
    } else {
      await pool.query(
        'UPDATE invoices SET status = $1 WHERE id = $2',
        ['draft', existingPayment.rows[0].invoice_id]
      );
    }

    res.json({
      success: true,
      message: 'Pago eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando pago:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 