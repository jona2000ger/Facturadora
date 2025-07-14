const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, hasPermission } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticación y permiso de administración a todas las rutas
router.use(protect);
router.use(hasPermission('admin'));

// @desc    Obtener todos los roles
// @route   GET /api/roles
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Primero obtener los roles
    const rolesResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.color,
        r.created_at
      FROM roles r
      ORDER BY r.name
    `);

    // Luego obtener el conteo de usuarios para cada rol
    const usersCountResult = await pool.query(`
      SELECT role_id, COUNT(*) as count
      FROM users 
      WHERE role_id IS NOT NULL
      GROUP BY role_id
    `);

    // Y obtener los permisos para cada rol
    const permissionsResult = await pool.query(`
      SELECT rp.role_id, ARRAY_AGG(p.name) as permissions
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      GROUP BY rp.role_id
    `);

    // Combinar los resultados
    const roles = rolesResult.rows.map(role => {
      const userCount = usersCountResult.rows.find(uc => uc.role_id === role.id);
      const permissions = permissionsResult.rows.find(p => p.role_id === role.id);
      
      return {
        ...role,
        users_count: userCount ? parseInt(userCount.count) : 0,
        permissions: permissions ? permissions.permissions : []
      };
    });

    res.json({
      success: true,
      data: {
        roles: roles
      }
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener un rol específico
// @route   GET /api/roles/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el rol
    const roleResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.color,
        r.created_at
      FROM roles r
      WHERE r.id = $1
    `, [id]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rol no encontrado' 
      });
    }

    // Obtener los permisos del rol
    const permissionsResult = await pool.query(`
      SELECT ARRAY_AGG(p.name) as permissions
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `, [id]);

    const role = {
      ...roleResult.rows[0],
      permissions: permissionsResult.rows[0]?.permissions || []
    };

    res.json({
      success: true,
      data: {
        role: role
      }
    });
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Crear un nuevo rol
// @route   POST /api/roles
// @access  Private
router.post('/', [
  body('name').isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('display_name').isLength({ min: 2, max: 100 }).withMessage('El nombre de visualización debe tener entre 2 y 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('color').optional().isIn(['red', 'blue', 'green', 'yellow', 'purple', 'gray']).withMessage('Color inválido'),
  body('permissions').isArray().withMessage('Los permisos deben ser un array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, display_name, description, color, permissions } = req.body;

    // Verificar si el rol ya existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [name]
    );

    if (existingRole.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya existe un rol con ese nombre' 
      });
    }

    // Crear el rol
    const roleResult = await pool.query(
      'INSERT INTO roles (name, display_name, description, color) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, display_name, description, color || 'blue']
    );

    const roleId = roleResult.rows[0].id;

    // Asignar permisos al rol
    if (permissions && permissions.length > 0) {
      for (const permissionName of permissions) {
        const permissionResult = await pool.query(
          'SELECT id FROM permissions WHERE name = $1',
          [permissionName]
        );

        if (permissionResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, permissionResult.rows[0].id]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        role: { id: roleId, name, display_name, description, color }
      },
      message: 'Rol creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando rol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Actualizar un rol
// @route   PUT /api/roles/:id
// @access  Private
router.put('/:id', [
  body('display_name').optional().isLength({ min: 2, max: 100 }).withMessage('El nombre de visualización debe tener entre 2 y 100 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('color').optional().isIn(['red', 'blue', 'green', 'yellow', 'purple', 'gray']).withMessage('Color inválido'),
  body('permissions').optional().isArray().withMessage('Los permisos deben ser un array')
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
    const { display_name, description, color, permissions } = req.body;

    // Verificar si el rol existe
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE id = $1',
      [id]
    );

    if (existingRole.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rol no encontrado' 
      });
    }

    // Actualizar el rol
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updateFields.push(`display_name = $${paramCount++}`);
      updateValues.push(display_name);
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }

    if (color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      updateValues.push(color);
    }

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      await pool.query(
        `UPDATE roles SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );
    }

    // Actualizar permisos si se proporcionan
    if (permissions !== undefined) {
      // Eliminar permisos existentes
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);

      // Asignar nuevos permisos
      if (permissions.length > 0) {
        for (const permissionName of permissions) {
          const permissionResult = await pool.query(
            'SELECT id FROM permissions WHERE name = $1',
            [permissionName]
          );

          if (permissionResult.rows.length > 0) {
            await pool.query(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
              [id, permissionResult.rows[0].id]
            );
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Eliminar un rol
// @route   DELETE /api/roles/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el rol tiene usuarios asignados
    const usersWithRole = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1',
      [id]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar un rol que tiene usuarios asignados' 
      });
    }

    // Eliminar el rol
    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rol no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando rol:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// @desc    Obtener todos los permisos
// @route   GET /api/roles/permissions
// @access  Private
router.get('/permissions/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, display_name, description FROM permissions ORDER BY name'
    );

    res.json({
      success: true,
      data: {
        permissions: result.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router; 