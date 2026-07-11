// netlify/functions/register.js
// Proxy seguro para Google Sheets — el token y URL viven en Netlify env vars

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SHEETS_URL = process.env.SHEETS_URL;
  const SHEETS_SECRET_TOKEN = process.env.SHEETS_SECRET_TOKEN;

  if (!SHEETS_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SHEETS_URL no configurada' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  // Inyectar el token secreto
  if (SHEETS_SECRET_TOKEN) {
    payload.token = SHEETS_SECRET_TOKEN;
  }

  try {
    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al conectar con Sheets: ' + e.message })
    };
  }
};
