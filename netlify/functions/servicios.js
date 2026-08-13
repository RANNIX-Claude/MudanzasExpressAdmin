// netlify/functions/servicios.js
// CRUD del listado de servicios (pantalla principal), en Azure/MSSQL SQL Server.
// Reemplaza el localStorage por navegador para que todo el equipo vea los
// mismos casos sin importar la computadora.
//
// Variables de ambiente: ver netlify/functions/lib/db.js
// Esquema de la tabla: ver mudanzas-v3/sql/schema.sql (dbo.Servicios)

const { sql, getPool, dbConfigured } = require('./lib/db');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function rowToServicio(row) {
  let detalle = [];
  try { detalle = row.detalle ? JSON.parse(row.detalle) : []; } catch { detalle = []; }
  return {
    id: row.id,
    creado: row.creado instanceof Date ? row.creado.toISOString() : row.creado,
    vendedor: row.vendedor || '',
    nombre: row.nombre || '',
    tel: row.tel || '',
    origen: row.origen || '',
    destino: row.destino || '',
    fecha: row.fecha || '',
    hora: row.hora || '',
    estatus: row.estatus || 'cotizacion',
    cuota: row.cuota || '',
    anticipo: row.anticipo || '',
    notas: row.notas || '',
    detalle,
  };
}

function bindServicioInputs(request, s) {
  request.input('vendedor', sql.NVarChar(20), s.vendedor || '');
  request.input('nombre', sql.NVarChar(200), s.nombre || '');
  request.input('tel', sql.NVarChar(30), s.tel || '');
  request.input('origen', sql.NVarChar(500), s.origen || '');
  request.input('destino', sql.NVarChar(500), s.destino || '');
  request.input('fecha', sql.NVarChar(20), s.fecha || '');
  request.input('hora', sql.NVarChar(20), s.hora || '');
  request.input('estatus', sql.NVarChar(20), s.estatus || 'cotizacion');
  request.input('cuota', sql.NVarChar(50), s.cuota || '');
  request.input('anticipo', sql.NVarChar(50), s.anticipo || '');
  request.input('notas', sql.NVarChar(sql.MAX), s.notas || '');
  request.input('detalle', sql.NVarChar(sql.MAX), JSON.stringify(s.detalle || []));
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (!dbConfigured()) {
    console.error('Faltan variables de ambiente de la base de datos (DB_SERVER/DB_NAME/DB_USER/DB_PASSWORD)');
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'Base de datos no configurada. Ve a Netlify → Site settings → Environment variables.' }),
    };
  }

  try {
    const pool = await getPool();

    if (event.httpMethod === 'GET') {
      const result = await pool.request().query('SELECT * FROM dbo.Servicios ORDER BY creado DESC');
      return { statusCode: 200, headers: CORS, body: JSON.stringify(result.recordset.map(rowToServicio)) };
    }

    if (event.httpMethod === 'POST') {
      let s;
      try { s = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body inválido' }) }; }
      if (!s.id || !s.nombre) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id y nombre son requeridos' }) };
      }
      const request = pool.request();
      request.input('id', sql.NVarChar(50), s.id);
      request.input('creado', sql.DateTime2, s.creado ? new Date(s.creado) : new Date());
      bindServicioInputs(request, s);
      await request.query(`
        INSERT INTO dbo.Servicios (id, creado, vendedor, nombre, tel, origen, destino, fecha, hora, estatus, cuota, anticipo, notas, detalle)
        VALUES (@id, @creado, @vendedor, @nombre, @tel, @origen, @destino, @fecha, @hora, @estatus, @cuota, @anticipo, @notas, @detalle)
      `);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id: s.id }) };
    }

    if (event.httpMethod === 'PUT') {
      let s;
      try { s = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body inválido' }) }; }
      if (!s.id) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id es requerido' }) };
      }
      const request = pool.request();
      request.input('id', sql.NVarChar(50), s.id);
      bindServicioInputs(request, s);
      const result = await request.query(`
        UPDATE dbo.Servicios SET
          vendedor=@vendedor, nombre=@nombre, tel=@tel, origen=@origen, destino=@destino,
          fecha=@fecha, hora=@hora, estatus=@estatus, cuota=@cuota, anticipo=@anticipo,
          notas=@notas, detalle=@detalle
        WHERE id=@id
      `);
      if (result.rowsAffected[0] === 0) {
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Servicio no encontrado' }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    if (event.httpMethod === 'DELETE') {
      let id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) {
        try { id = JSON.parse(event.body || '{}').id; } catch { /* noop */ }
      }
      if (!id) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id es requerido' }) };
      }
      const request = pool.request();
      request.input('id', sql.NVarChar(50), id);
      await request.query('DELETE FROM dbo.Servicios WHERE id=@id');
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (e) {
    console.error('Error en servicios:', e.message);
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'Error de base de datos: ' + e.message }),
    };
  }
};
