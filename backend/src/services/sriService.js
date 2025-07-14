const axios = require('axios');
const xml2js = require('xml2js');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SRIService {
  constructor() {
    // URLs del SRI (ambiente de pruebas y producción)
    this.sriUrls = {
      test: {
        recepcion: 'https://celcer.sri.gob.ec/ws/recepcionComprobantesOffline?wsdl',
        autorizacion: 'https://celcer.sri.gob.ec/ws/autorizacionComprobantesOffline?wsdl'
      },
      production: {
        recepcion: 'https://cel.sri.gob.ec/ws/recepcionComprobantesOffline?wsdl',
        autorizacion: 'https://cel.sri.gob.ec/ws/autorizacionComprobantesOffline?wsdl'
      }
    };
    
    this.environment = process.env.SRI_ENVIRONMENT || 'test';
    this.currentUrls = this.sriUrls[this.environment];
  }

  /**
   * Genera el XML de una factura según la especificación del SRI
   */
  async generateInvoiceXML(invoice, client, items) {
    const invoiceNumber = this.formatInvoiceNumber(invoice.id);
    const accessKey = await this.generateAccessKey(invoice, client);
    
    const xmlData = {
      factura: {
        $: {
          id: 'comprobante',
          version: '1.1.0'
        },
        infoTributaria: {
          ambiente: this.environment === 'production' ? '1' : '2',
          tipoEmision: '1',
          razonSocial: process.env.COMPANY_NAME || 'EMPRESA DEMO',
          ruc: process.env.COMPANY_RUC || '1234567890001',
          claveAcceso: accessKey,
          codDoc: '01', // Factura
          estab: process.env.COMPANY_ESTAB || '001',
          ptoEmi: process.env.COMPANY_PTOEMI || '001',
          secuencial: invoiceNumber,
          dirMatriz: process.env.COMPANY_ADDRESS || 'DIRECCION DEMO'
        },
        infoFactura: {
          fechaEmision: this.formatDate(invoice.created_at),
          totalSinImpuestos: this.calculateSubtotal(items),
          totalDescuento: '0.00',
          totalImpuesto: this.calculateTotalTax(items),
          importeTotal: invoice.total_amount,
          moneda: 'DOLAR'
        },
        detalles: {
          detalle: items.map(item => ({
            codigoPrincipal: item.product_id,
            descripcion: item.description,
            cantidad: item.quantity,
            precioUnitario: item.unit_price,
            descuento: '0.00',
            precioTotalSinImpuesto: (item.quantity * item.unit_price).toFixed(2),
            impuestos: {
              impuesto: {
                codigo: '2', // IVA
                codigoPorcentaje: '2', // 12%
                baseImponible: (item.quantity * item.unit_price).toFixed(2),
                valor: ((item.quantity * item.unit_price) * 0.12).toFixed(2)
              }
            }
          }))
        },
        infoAdicional: {
          campoAdicional: [
            {
              $: { nombre: 'Email' },
              _: client.email || ''
            },
            {
              $: { nombre: 'Telefono' },
              _: client.phone || ''
            }
          ]
        }
      }
    };

    const builder = new xml2js.Builder({
      rootName: 'factura',
      headless: true,
      renderOpts: { pretty: true, indent: '  ', newline: '\n' }
    });

    return builder.buildObject(xmlData);
  }

  /**
   * Genera la clave de acceso según la especificación del SRI
   */
  async generateAccessKey(invoice, client) {
    const date = this.formatDate(invoice.created_at);
    const ruc = process.env.COMPANY_RUC || '1234567890001';
    const environment = this.environment === 'production' ? '1' : '2';
    const documentType = '01'; // Factura
    const establishment = process.env.COMPANY_ESTAB || '001';
    const emissionPoint = process.env.COMPANY_PTOEMI || '001';
    const sequential = this.formatInvoiceNumber(invoice.id);
    const documentTypeCode = '01';
    const clientId = client.tax_id || '9999999999999';
    
    // Construir clave de acceso
    const accessKeyComponents = [
      date,
      documentType,
      ruc,
      environment,
      establishment,
      emissionPoint,
      sequential,
      documentTypeCode,
      clientId
    ].join('');
    
    // Agregar dígito verificador
    const verifier = this.calculateVerifierDigit(accessKeyComponents);
    return accessKeyComponents + verifier;
  }

  /**
   * Calcula el dígito verificador para la clave de acceso
   */
  calculateVerifierDigit(accessKey) {
    const weights = [7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < accessKey.length; i++) {
      sum += parseInt(accessKey[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const verifier = remainder === 0 ? 0 : 11 - remainder;
    
    return verifier === 10 ? 1 : verifier;
  }

  /**
   * Firma electrónicamente el XML
   */
  async signXML(xmlContent) {
    try {
      // En un entorno real, aquí se usaría una librería de firma electrónica
      // como node-xades o similar para firmar con certificado digital
      
      // Por ahora, simulamos la firma
      const signature = crypto.createHash('sha256').update(xmlContent).digest('hex');
      
      // Agregar la firma al XML
      const signedXML = xmlContent.replace(
        '</factura>',
        `<firmaDigital>${signature}</firmaDigital>\n</factura>`
      );
      
      return signedXML;
    } catch (error) {
      throw new Error(`Error firmando XML: ${error.message}`);
    }
  }

  /**
   * Envía el documento al SRI para autorización
   */
  async sendToSRI(xmlContent, accessKey) {
    try {
      // En un entorno real, aquí se haría la llamada SOAP al web service del SRI
      // Por ahora, simulamos la respuesta
      
      const soapEnvelope = this.createSOAPEnvelope(xmlContent);
      
      // Simular respuesta del SRI
      const response = {
        estado: 'AUTORIZADO',
        numeroAutorizacion: this.generateAuthorizationNumber(),
        fechaAutorizacion: new Date().toISOString(),
        ambiente: this.environment,
        mensajes: []
      };
      
      return response;
    } catch (error) {
      throw new Error(`Error enviando al SRI: ${error.message}`);
    }
  }

  /**
   * Crea el sobre SOAP para enviar al SRI
   */
  createSOAPEnvelope(xmlContent) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${this.escapeXML(xmlContent)}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Escapa caracteres especiales en XML
   */
  escapeXML(xml) {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Genera número de autorización simulado
   */
  generateAuthorizationNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `AUT${timestamp}${random}`;
  }

  /**
   * Formatea el número de factura
   */
  formatInvoiceNumber(id) {
    return id.toString().padStart(9, '0');
  }

  /**
   * Formatea la fecha para el SRI
   */
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Calcula el subtotal sin impuestos
   */
  calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2);
  }

  /**
   * Calcula el total de impuestos
   */
  calculateTotalTax(items) {
    return items.reduce((sum, item) => sum + ((item.quantity * item.unit_price) * 0.12), 0).toFixed(2);
  }

  /**
   * Proceso completo de generación y autorización de factura electrónica
   */
  async processElectronicInvoice(invoice, client, items) {
    try {
      console.log('=== SRI: Iniciando proceso de facturación electrónica ===');
      
      // 1. Generar XML
      const xmlContent = await this.generateInvoiceXML(invoice, client, items);
      console.log('=== SRI: XML generado ===');
      
      // 2. Firmar XML
      const signedXML = await this.signXML(xmlContent);
      console.log('=== SRI: XML firmado ===');
      
      // 3. Enviar al SRI
      const accessKey = await this.generateAccessKey(invoice, client);
      const sriResponse = await this.sendToSRI(signedXML, accessKey);
      console.log('=== SRI: Respuesta recibida ===', sriResponse);
      
      // 4. Guardar documento autorizado
      const documentData = {
        invoice_id: invoice.id,
        access_key: accessKey,
        xml_content: signedXML,
        sri_response: sriResponse,
        status: sriResponse.estado,
        authorization_number: sriResponse.numeroAutorizacion,
        authorization_date: sriResponse.fechaAutorizacion,
        created_at: new Date()
      };
      
      return documentData;
    } catch (error) {
      console.error('=== SRI: Error en proceso ===', error);
      throw new Error(`Error en facturación electrónica: ${error.message}`);
    }
  }
}

module.exports = new SRIService(); 