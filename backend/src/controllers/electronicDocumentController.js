const pool = require('../config/database');
const sriService = require('../services/sriService');

class ElectronicDocumentController {
  /**
   * Generar documento electrónico para una factura
   */
  async generateElectronicDocument(req, res) {
    try {
      const { invoiceId } = req.params;
      
      // Obtener factura con cliente e items
      const invoiceQuery = `
        SELECT i.*, c.*, 
               c.id as client_id, c.name as client_name, c.email as client_email, 
               c.phone as client_phone, c.tax_id as client_tax_id
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = $1
      `;
      
      const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);
      if (invoiceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Obtener items de la factura
      const itemsQuery = `
        SELECT ii.*, p.name as product_name, p.description as product_description
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = $1
      `;
      
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);
      const items = itemsResult.rows;
      
      if (items.length === 0) {
        return res.status(400).json({ error: 'La factura no tiene items' });
      }
      
      // Verificar si ya existe un documento electrónico
      const existingDocQuery = 'SELECT * FROM electronic_documents WHERE invoice_id = $1';
      const existingDocResult = await pool.query(existingDocQuery, [invoiceId]);
      
      if (existingDocResult.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un documento electrónico para esta factura' });
      }
      
      // Preparar datos del cliente
      const client = {
        id: invoice.client_id,
        name: invoice.client_name,
        email: invoice.client_email,
        phone: invoice.client_phone,
        tax_id: invoice.client_tax_id
      };
      
      // Procesar documento electrónico
      const documentData = await sriService.processElectronicInvoice(invoice, client, items);
      
      // Guardar en base de datos
      const insertQuery = `
        INSERT INTO electronic_documents (
          invoice_id, access_key, xml_content, sri_response, status,
          authorization_number, authorization_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [
        invoiceId,
        documentData.access_key,
        documentData.xml_content,
        JSON.stringify(documentData.sri_response),
        documentData.status,
        documentData.authorization_number,
        documentData.authorization_date
      ]);
      
      // Actualizar estado de la factura
      const updateInvoiceQuery = `
        UPDATE invoices 
        SET status = 'sent', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      await pool.query(updateInvoiceQuery, [invoiceId]);
      
      res.json({
        success: true,
        message: 'Documento electrónico generado exitosamente',
        data: {
          document: insertResult.rows[0],
          access_key: documentData.access_key,
          authorization_number: documentData.authorization_number,
          status: documentData.status
        }
      });
      
    } catch (error) {
      console.error('Error generando documento electrónico:', error);
      res.status(500).json({ error: 'Error generando documento electrónico' });
    }
  }

  /**
   * Obtener documento electrónico por ID de factura
   */
  async getElectronicDocument(req, res) {
    try {
      const { invoiceId } = req.params;
      
      const query = `
        SELECT * FROM electronic_documents 
        WHERE invoice_id = $1
      `;
      
      const result = await pool.query(query, [invoiceId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento electrónico no encontrado' });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error obteniendo documento electrónico:', error);
      res.status(500).json({ error: 'Error obteniendo documento electrónico' });
    }
  }

  /**
   * Obtener todos los documentos electrónicos
   */
  async getAllElectronicDocuments(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT ed.*, i.invoice_number, i.total_amount, i.status as invoice_status,
               c.name as client_name, c.tax_id as client_tax_id
        FROM electronic_documents ed
        JOIN invoices i ON ed.invoice_id = i.id
        JOIN clients c ON i.client_id = c.id
      `;
      
      const queryParams = [];
      let whereClause = '';
      
      if (status) {
        whereClause = 'WHERE ed.status = $1';
        queryParams.push(status);
      }
      
      query += whereClause + ' ORDER BY ed.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
      queryParams.push(limit, offset);
      
      const result = await pool.query(query, queryParams);
      
      // Contar total
      const countQuery = `
        SELECT COUNT(*) FROM electronic_documents ed
        JOIN invoices i ON ed.invoice_id = i.id
        JOIN clients c ON i.client_id = c.id
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, status ? [status] : []);
      const total = parseInt(countResult.rows[0].count);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo documentos electrónicos:', error);
      res.status(500).json({ error: 'Error obteniendo documentos electrónicos' });
    }
  }

  /**
   * Descargar XML del documento electrónico
   */
  async downloadXML(req, res) {
    try {
      const { invoiceId } = req.params;
      
      const query = `
        SELECT xml_content, access_key, authorization_number
        FROM electronic_documents 
        WHERE invoice_id = $1
      `;
      
      const result = await pool.query(query, [invoiceId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento electrónico no encontrado' });
      }
      
      const document = result.rows[0];
      
      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="factura-${document.access_key}.xml"`);
      
      res.send(document.xml_content);
      
    } catch (error) {
      console.error('Error descargando XML:', error);
      res.status(500).json({ error: 'Error descargando XML' });
    }
  }

  /**
   * Reenviar documento al SRI (para documentos rechazados)
   */
  async resendToSRI(req, res) {
    try {
      const { invoiceId } = req.params;
      
      // Obtener documento existente
      const docQuery = 'SELECT * FROM electronic_documents WHERE invoice_id = $1';
      const docResult = await pool.query(docQuery, [invoiceId]);
      
      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: 'Documento electrónico no encontrado' });
      }
      
      const document = docResult.rows[0];
      
      // Obtener factura y datos relacionados
      const invoiceQuery = `
        SELECT i.*, c.*, 
               c.id as client_id, c.name as client_name, c.email as client_email, 
               c.phone as client_phone, c.tax_id as client_tax_id
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = $1
      `;
      
      const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);
      const invoice = invoiceResult.rows[0];
      
      // Obtener items
      const itemsQuery = `
        SELECT ii.*, p.name as product_name, p.description as product_description
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        WHERE ii.invoice_id = $1
      `;
      
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);
      const items = itemsResult.rows;
      
      // Preparar cliente
      const client = {
        id: invoice.client_id,
        name: invoice.client_name,
        email: invoice.client_email,
        phone: invoice.client_phone,
        tax_id: invoice.client_tax_id
      };
      
      // Reenviar al SRI
      const accessKey = await sriService.generateAccessKey(invoice, client);
      const sriResponse = await sriService.sendToSRI(document.xml_content, accessKey);
      
      // Actualizar documento
      const updateQuery = `
        UPDATE electronic_documents 
        SET sri_response = $1, status = $2, authorization_number = $3, 
            authorization_date = $4, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_id = $5
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [
        JSON.stringify(sriResponse),
        sriResponse.estado,
        sriResponse.numeroAutorizacion,
        sriResponse.fechaAutorizacion,
        invoiceId
      ]);
      
      res.json({
        success: true,
        message: 'Documento reenviado al SRI exitosamente',
        data: updateResult.rows[0]
      });
      
    } catch (error) {
      console.error('Error reenviando documento al SRI:', error);
      res.status(500).json({ error: 'Error reenviando documento al SRI' });
    }
  }
}

module.exports = new ElectronicDocumentController(); 