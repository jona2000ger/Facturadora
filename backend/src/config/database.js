const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'facturadora',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que una conexión puede estar inactiva
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer una conexión
});

// Evento cuando se conecta un cliente
pool.on('connect', () => {
  console.log('🔌 Nueva conexión a la base de datos establecida');
});

// Evento cuando se libera un cliente
pool.on('release', () => {
  console.log('🔓 Conexión a la base de datos liberada');
});

// Evento de error
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
  process.exit(-1);
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a la base de datos exitosa');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

// Función para cerrar el pool
const closePool = async () => {
  await pool.end();
  console.log('🔒 Pool de conexiones cerrado');
};

module.exports = {
  pool,
  testConnection,
  closePool
}; 