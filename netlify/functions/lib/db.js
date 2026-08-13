// netlify/functions/lib/db.js
// Pool de conexión compartido a SQL Server, reutilizado entre invocaciones
// ("contenedor caliente" de Lambda). No es un endpoint — vive en una
// subcarpeta para que Netlify no lo publique como function.

const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    // Azure SQL requiere encrypt=true; muchos hosts compartidos (site4now, etc.)
    // no lo soportan bien. Configurable vía env var por si tu proveedor lo requiere distinto.
    encrypt: process.env.DB_ENCRYPT ? process.env.DB_ENCRYPT === 'true' : true,
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
  pool: { max: 1, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
};

let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig).catch((err) => {
      poolPromise = null; // permitir reintento en la siguiente invocación
      throw err;
    });
  }
  return poolPromise;
}

function dbConfigured() {
  return !!(process.env.DB_SERVER && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
}

module.exports = { sql, getPool, dbConfigured };
