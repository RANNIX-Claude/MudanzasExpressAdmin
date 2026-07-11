// netlify/functions/extract.js
// Proxy seguro para la API de Claude — el API Key vive en Netlify env vars

const https = require('https');

exports.handler = async function(event) {
  // CORS headers
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Verificar API key
  const API_KEY = process.env.CLAUDE_API_KEY;
  if (!API_KEY) {
    console.error('CLAUDE_API_KEY no está configurada en las variables de ambiente de Netlify');
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ error: 'CLAUDE_API_KEY no configurada. Ve a Netlify → Site settings → Environment variables y agrégala.' })
    };
  }

  // Leer body
  let texto = '';
  try {
    const parsed = JSON.parse(event.body || '{}');
    texto = parsed.texto || parsed.text || '';
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body JSON inválido' }) };
  }

  if (!texto.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'El campo texto está vacío' }) };
  }

  const prompt = `Eres un asistente que extrae datos de conversaciones de WhatsApp para servicios de mudanza.

Del siguiente chat extrae ÚNICAMENTE estos datos en formato JSON puro (sin markdown, sin backticks, sin explicaciones):

{
  "nombre": "nombre completo del cliente",
  "telefono": "10 dígitos del teléfono del cliente, sin espacios ni guiones",
  "origen": "dirección completa de origen donde se recoge la mudanza",
  "destino": "dirección completa de destino donde se entrega",
  "fecha": "fecha del servicio en formato YYYY-MM-DD",
  "hora": "hora de inicio en formato HH:MM",
  "cuota": "monto total acordado, ej: $4,500",
  "anticipo": "anticipo acordado, ej: $2,000 o 50%",
  "notas": "condiciones especiales: embalaje, desmontaje, acceso, volados, etc.",
  "detalle": [
    {"cantidad": "1", "descripcion": "descripción del artículo"},
    {"cantidad": "2", "descripcion": "otro artículo"}
  ]
}

REGLAS IMPORTANTES:
- Si algún dato no aparece en el chat, deja el campo como cadena vacía "" o arreglo vacío [].
- Para "detalle": lista CADA artículo a transportar con su cantidad. Ej: camas, refrigerador, cajas, sillones, tv, lavadora, etc.
- Para "fecha": usa formato YYYY-MM-DD. Año actual: 2026.
- No inventes información que no esté en el chat.
- Responde SOLO con el JSON, sin texto adicional.

CHAT DE WHATSAPP:
${texto}`;

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Llamada HTTP nativa a la API de Claude
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody),
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const apiResp = JSON.parse(raw);

          // Error de la API de Claude (auth, rate limit, etc.)
          if (apiResp.error) {
            console.error('Error de Claude API:', JSON.stringify(apiResp.error));
            resolve({
              statusCode: 500, headers: CORS,
              body: JSON.stringify({ error: 'Error de Claude API: ' + (apiResp.error.message || JSON.stringify(apiResp.error)) })
            });
            return;
          }

          const text = apiResp.content?.[0]?.text || '{}';
          // Limpiar markdown si Claude lo incluye de todas formas
          const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
          const data = JSON.parse(clean);

          resolve({
            statusCode: 200, headers: CORS,
            body: JSON.stringify(data)
          });
        } catch (e) {
          console.error('Error parseando respuesta de Claude:', e.message, '| Raw:', raw.slice(0, 300));
          resolve({
            statusCode: 500, headers: CORS,
            body: JSON.stringify({ error: 'Error al parsear respuesta: ' + e.message, raw: raw.slice(0, 200) })
          });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Error de red llamando a Claude:', e.message);
      resolve({
        statusCode: 500, headers: CORS,
        body: JSON.stringify({ error: 'Error de red: ' + e.message })
      });
    });

    req.write(requestBody);
    req.end();
  });
};
