const speakeasy = require('speakeasy');
const { pool } = require('../config/database');

class OTPService {
  generateOTP() {
    return speakeasy.totp({
      secret: process.env.OTP_SECRET,
      digits: 6,
      step: 300, // 5 minutos
      window: 1
    });
  }

  verifyOTP(token) {
    return speakeasy.totp.verify({
      secret: process.env.OTP_SECRET,
      token: token,
      digits: 6,
      step: 300, // 5 minutos
      window: 1
    });
  }

  async saveOTP(userId, otp) {
    try {
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      
      await pool.query(
        'INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET otp_code = $2, expires_at = $3',
        [userId, otp, expiresAt]
      );
    } catch (error) {
      console.error('Error guardando OTP:', error);
      throw new Error('Error al guardar el código de verificación');
    }
  }

  async verifyStoredOTP(userId, otp) {
    try {
      const result = await pool.query(
        'SELECT otp_code, expires_at FROM user_otps WHERE user_id = $1 AND expires_at > NOW()',
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const storedOTP = result.rows[0];
      
      if (storedOTP.otp_code === otp) {
        // Eliminar el OTP usado
        await pool.query('DELETE FROM user_otps WHERE user_id = $1', [userId]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verificando OTP:', error);
      throw new Error('Error al verificar el código');
    }
  }

  async cleanupExpiredOTPs() {
    try {
      await pool.query('DELETE FROM user_otps WHERE expires_at < NOW()');
    } catch (error) {
      console.error('Error limpiando OTPs expirados:', error);
    }
  }
}

module.exports = new OTPService(); 