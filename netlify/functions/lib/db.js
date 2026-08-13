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

// Auto-provisiona dbo.Servicios si no existe todavía (idempotente).
// Se corre una sola vez por contenedor Lambda "caliente".
let servicioTableEnsured = false;
async function ensureServiciosTable() {
  if (servicioTableEnsured) return;
  const pool = await getPool();
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Servicios' AND schema_id = SCHEMA_ID('dbo'))
    BEGIN
      CREATE TABLE dbo.Servicios (
        id              NVARCHAR(50)   PRIMARY KEY,
        creado          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        vendedor        NVARCHAR(20)   NULL,
        nombre          NVARCHAR(200)  NOT NULL,
        tel             NVARCHAR(30)   NULL,
        origen          NVARCHAR(500)  NULL,
        destino         NVARCHAR(500)  NULL,
        fecha           NVARCHAR(20)   NULL,
        hora            NVARCHAR(20)   NULL,
        estatus         NVARCHAR(20)   NOT NULL DEFAULT 'cotizacion',
        cuota           NVARCHAR(50)   NULL,
        anticipo        NVARCHAR(50)   NULL,
        notas           NVARCHAR(MAX)  NULL,
        detalle         NVARCHAR(MAX)  NULL
      );
      CREATE INDEX IX_Servicios_estatus ON dbo.Servicios(estatus);
      CREATE INDEX IX_Servicios_vendedor ON dbo.Servicios(vendedor);
    END
  `);
  servicioTableEnsured = true;
}

module.exports = { sql, getPool, dbConfigured, ensureServiciosTable };
