// config.js — Mudanzas Express Contract Generator
// ================================================
// El Claude API Key y las credenciales de la base de datos NO van aquí —
// viven en variables de ambiente de Netlify (Site settings → Environment variables):
//   CLAUDE_API_KEY, DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
// El registro de contratos usa Azure SQL Server (netlify/functions/register.js),
// ya no Google Sheets. Ver sql/schema.sql para el esquema de la tabla.

// GOOGLE MAPS AUTOCOMPLETE (opcional)
window.GOOGLE_MAPS_KEY = '';
// Ejemplo: 'AIzaSyB...'
