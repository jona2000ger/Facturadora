const { pool } = require('../config/database');

class AuditService {
  /**
   * Registrar evento de cambio de contraseña
   */
  async logPasswordChangeEvent(userId, eventType, req, success = true, errorMessage = null, metadata = {}) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      await pool.query(
        `INSERT INTO password_change_events 
         (user_id, event_type, ip_address, user_agent, success, error_message, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, eventType, ipAddress, userAgent, success, errorMessage, JSON.stringify(metadata)]
      );

      console.log(`Audit: Password change event logged - User: ${userId}, Event: ${eventType}, Success: ${success}`);
    } catch (error) {
      console.error('Error logging password change event:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Registrar intento de login
   */
  async logLoginAttempt(userId, email, req, success = false, failureReason = null) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      const userAgent = req.headers['user-agent'];

      await pool.query(
        `INSERT INTO login_attempts 
         (user_id, email, ip_address, user_agent, success, failure_reason) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email, ipAddress, userAgent, success, failureReason]
      );

      console.log(`Audit: Login attempt logged - Email: ${email}, Success: ${success}`);
    } catch (error) {
      console.error('Error logging login attempt:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtener historial de eventos de cambio de contraseña para un usuario
   */
  async getPasswordChangeHistory(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT event_type, ip_address, success, error_message, created_at, metadata
         FROM password_change_events 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting password change history:', error);
      return [];
    }
  }

  /**
   * Obtener historial de intentos de login para un usuario
   */
  async getLoginHistory(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT email, ip_address, success, failure_reason, created_at
         FROM login_attempts 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }

  /**
   * Verificar si hay demasiados intentos fallidos recientes
   */
  async checkFailedAttempts(email, timeWindowMinutes = 15, maxAttempts = 5) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as failed_count
         FROM login_attempts 
         WHERE email = $1 
         AND success = false 
         AND created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'`,
        [email]
      );

      const failedCount = parseInt(result.rows[0].failed_count);
      return {
        tooManyAttempts: failedCount >= maxAttempts,
        failedCount,
        maxAttempts
      };
    } catch (error) {
      console.error('Error checking failed attempts:', error);
      return { tooManyAttempts: false, failedCount: 0, maxAttempts };
    }
  }

  /**
   * Limpiar registros antiguos (mantener solo los últimos 30 días)
   */
  async cleanupOldRecords() {
    try {
      // Limpiar eventos de cambio de contraseña antiguos
      await pool.query(
        `DELETE FROM password_change_events 
         WHERE created_at < NOW() - INTERVAL '30 days'`
      );

      // Limpiar intentos de login antiguos
      await pool.query(
        `DELETE FROM login_attempts 
         WHERE created_at < NOW() - INTERVAL '30 days'`
      );

      console.log('Audit: Old records cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up old audit records:', error);
    }
  }
}

module.exports = new AuditService(); 