// netlify/functions/register.js
// Registro de contratos en Azure SQL Server (reemplaza Google Sheets)
//
// Variables de ambiente requeridas en Netlify (Site settings → Environment variables):
//   DB_SERVER    = tu-servidor.database.windows.net
//   DB_NAME      = MudanzasExpress
//   DB_USER      = usuario_sql
//   DB_PASSWORD  = contraseña_sql
//   DB_PORT      = 1433 (opcional, es el default)
//
// Esquema de la tabla: ver mudanzas-v3/sql/schema.sql

const { sql, getPool, dbConfigured } = require('./lib/db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!dbConfigured()) {
    console.error('Faltan variables de ambiente de la base de datos (DB_SERVER/DB_NAME/DB_USER/DB_PASSWORD)');
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'Base de datos no configurada. Ve a Netlify → Site settings → Environment variables.' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('servicio_id', sql.NVarChar(100), data.servicio_id || '');
    request.input('vendedor', sql.NVarChar(100), data.vendedor || '');
    request.input('cliente', sql.NVarChar(200), data.cliente || '');
    request.input('representante', sql.NVarChar(200), data.representante || '');
    request.input('tipo', sql.NVarChar(100), data.tipo || '');
    request.input('origen', sql.NVarChar(500), data.origen || '');
    request.input('destino', sql.NVarChar(500), data.destino || '');
    request.input('fecha_servicio', sql.NVarChar(20), data.fechaServicio || '');
    request.input('hora', sql.NVarChar(20), data.hora || '');
    request.input('viajes', sql.Int, data.viajes || 1);
    request.input('equipo', sql.NVarChar(200), data.equipo || '');
    request.input('total', sql.Decimal(10, 2), data.total || 0);
    request.input('anticipo', sql.Decimal(10, 2), data.anticipo || 0);
    request.input('liquidacion', sql.Decimal(10, 2), data.liquidacion || 0);
    request.input('notas', sql.NVarChar(sql.MAX), data.notas || '');

    const result = await request.query(`
      INSERT INTO dbo.Contratos
        (servicio_id, vendedor, cliente, representante, tipo, origen, destino,
         fecha_servicio, hora, viajes, equipo, total, anticipo, liquidacion, notas)
      OUTPUT INSERTED.id
      VALUES
        (@servicio_id, @vendedor, @cliente, @representante, @tipo, @origen, @destino,
         @fecha_servicio, @hora, @viajes, @equipo, @total, @anticipo, @liquidacion, @notas)
    `);

    const newId = result.recordset[0].id;

    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ success: true, id: newId }),
    };
  } catch (e) {
    console.error('Error al insertar en SQL Server:', e.message);
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ success: false, error: 'Error de base de datos: ' + e.message }),
    };
  }
};
