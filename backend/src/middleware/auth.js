const { pool } = require('../config/database');

// Middleware simplificado sin JWT - simula autenticación basada en roles
const protect = async (req, res, next) => {
  try {
    // Por ahora, simular diferentes usuarios según el header o parámetro
    // En un sistema real, esto vendría del token JWT
    const userRole = req.headers['x-user-role'] || req.query.role || 'admin';
    
    // Obtener un usuario con el rol especificado
    const result = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, r.id as role_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = $1 AND u.is_active = true 
      LIMIT 1
    `, [userRole]);
    
    if (result.rows.length > 0) {
      req.user = result.rows[0];
    } else {
      // Fallback: usar un usuario admin por defecto
      const adminResult = await pool.query(`
        SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, r.id as role_id
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'admin' AND u.is_active = true 
        LIMIT 1
      `);
      
      if (adminResult.rows.length > 0) {
        req.user = adminResult.rows[0];
      } else {
        // Fallback final
        req.user = { 
          id: '550e8400-e29b-41d4-a716-446655440000', 
          role: 'admin',
          role_id: 1,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User'
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    // Fallback en caso de error
    req.user = { 
      id: '550e8400-e29b-41d4-a716-446655440000', 
      role: 'admin',
      role_id: 1,
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User'
    };
    next();
  }
};

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Middleware para verificar permisos específicos
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'No autorizado' });
      }

      // Verificar si el usuario tiene el permiso específico
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1 AND p.name = $2
      `, [req.user.role_id, permission]);

      if (parseInt(result.rows[0].count) === 0) {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permisos para realizar esta acción' 
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor' 
      });
    }
  };
};

module.exports = { protect, authorize, hasPermission }; 