// scripts/generate-version.js
// Genera version.js con el número de versión = cantidad de commits del repo.
// Se ejecuta en el build de Netlify (ver netlify.toml → [build] command).

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let count = 0;
try {
  count = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10);
} catch (e) {
  console.warn('No se pudo leer el historial de git, usando versión V.000:', e.message);
}

const version = 'V.' + String(count).padStart(3, '0');
const out = `window.APP_VERSION = ${JSON.stringify(version)};\n`;

fs.writeFileSync(path.join(__dirname, '..', 'version.js'), out);
console.log('Generado version.js →', version);
