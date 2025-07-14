const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendInvoiceEmail(invoice, clientEmail, clientName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: clientEmail,
        subject: `Factura ${invoice.invoice_number} - ${process.env.OTP_ISSUER}`,
        html: this.generateInvoiceEmailHTML(invoice, clientName),
        attachments: [
          {
            filename: `factura-${invoice.invoice_number}.pdf`,
            path: `./temp/factura-${invoice.invoice_number}.pdf`,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error al enviar el correo electrónico');
    }
  }

  async sendOTPEmail(email, otp) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Código de verificación - ${process.env.OTP_ISSUER}`,
        html: this.generateOTPEmailHTML(otp),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP Email enviado:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error enviando OTP email:', error);
      throw new Error('Error al enviar el código de verificación');
    }
  }

  generateInvoiceEmailHTML(invoice, clientName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Factura ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.OTP_ISSUER}</h1>
            <h2>Factura ${invoice.invoice_number}</h2>
          </div>
          
          <div class="content">
            <p>Estimado/a ${clientName},</p>
            
            <p>Adjunto encontrará la factura <strong>${invoice.invoice_number}</strong> por un monto total de <span class="total">$${invoice.total_amount.toLocaleString()}</span>.</p>
            
            <p><strong>Detalles de la factura:</strong></p>
            <ul>
              <li>Número: ${invoice.invoice_number}</li>
              <li>Fecha de emisión: ${new Date(invoice.issue_date).toLocaleDateString()}</li>
              <li>Fecha de vencimiento: ${new Date(invoice.due_date).toLocaleDateString()}</li>
              <li>Estado: ${invoice.status}</li>
            </ul>
            
            <p>Para realizar el pago, puede utilizar cualquiera de los siguientes métodos:</p>
            <ul>
              <li>Transferencia bancaria</li>
              <li>Pago en línea</li>
              <li>Cheque</li>
            </ul>
            
            <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
            
            <p>Saludos cordiales,<br>
            <strong>${process.env.OTP_ISSUER}</strong></p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOTPEmailHTML(otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Código de Verificación</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.OTP_ISSUER}</h1>
            <h2>Código de Verificación</h2>
          </div>
          
          <div class="content">
            <p>Su código de verificación es:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p>Este código expirará en 5 minutos por razones de seguridad.</p>
            
            <p>Si no solicitó este código, ignore este mensaje.</p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService(); 