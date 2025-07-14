const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // Error de duplicado
  if (err.code === '23505') {
    const message = 'Campo duplicado';
    error = { message, statusCode: 400 };
  }

  // Error de clave foránea
  if (err.code === '23503') {
    const message = 'Referencia inválida';
    error = { message, statusCode: 400 };
  }

  // Error de sintaxis SQL
  if (err.code === '42601') {
    const message = 'Error de sintaxis en la consulta';
    error = { message, statusCode: 400 };
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = { message, statusCode: 401 };
  }

  // Error de expiración de JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = { message, statusCode: 401 };
  }

  // Error de cast (ID inválido)
  if (err.name === 'CastError') {
    const message = 'ID inválido';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler }; 