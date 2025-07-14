const express = require('express');
const router = express.Router();
const electronicDocumentController = require('../controllers/electronicDocumentController');
const { protect } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Generar documento electrónico para una factura
router.post('/generate/:invoiceId', electronicDocumentController.generateElectronicDocument);

// Obtener documento electrónico por ID de factura
router.get('/invoice/:invoiceId', electronicDocumentController.getElectronicDocument);

// Obtener todos los documentos electrónicos
router.get('/', electronicDocumentController.getAllElectronicDocuments);

// Descargar XML del documento electrónico
router.get('/download/:invoiceId/xml', electronicDocumentController.downloadXML);

// Reenviar documento al SRI
router.post('/resend/:invoiceId', electronicDocumentController.resendToSRI);

module.exports = router; 