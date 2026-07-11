// ============================================================
// GOOGLE APPS SCRIPT — Mudanzas Express · Registro de Contratos
// ============================================================
// SEGURIDAD — DOS CAPAS:
// 1. Token secreto: solo escrituras con el token correcto son aceptadas
// 2. El Sheet solo es visible para cuentas de Google autorizadas
//
// SETUP:
// 1. Extensions → Apps Script → pega este código
// 2. En el editor: Project Settings → Script Properties → Add property:
//      SHEETS_SECRET_TOKEN  =  un-token-largo-que-tu-inventes
// 3. Deploy → New deployment → Web app
//      Execute as: Me
//      Who has access: Only myself   ← NO "Anyone"
// 4. Copia la URL y ponla en Netlify → Environment variables:
//      SHEETS_URL = https://script.google.com/macros/s/.../exec
//      SHEETS_SECRET_TOKEN = el-mismo-token-que-pusiste-arriba
// 5. El Sheet: Share → solo con cuentas de tu equipo (Andrea, Salvador)
// ============================================================

const SHEET_NAME = 'Contratos';

const HEADERS = [
  'ID', 'Fecha Generado', 'Cliente', 'Representante Cliente',
  'Tipo Contrato', 'Proveedor Firmante', 'Origen', 'Destino',
  'Fecha Servicio', 'Hora', 'Viajes', 'Equipo/Vehículo',
  'Total MXN', 'Anticipo MXN', 'Liquidación MXN', 'Notas Precio'
];

function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const payload = JSON.parse(e.postData.contents);

    // ── CAPA 1: Validar token secreto ──────────────────────────
    const expectedToken = PropertiesService.getScriptProperties().getProperty('SHEETS_SECRET_TOKEN');
    if (!expectedToken || payload.token !== expectedToken) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'No autorizado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = payload.data;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Crear hoja con encabezados si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const hRow = sheet.getRange(1, 1, 1, HEADERS.length);
      hRow.setValues([HEADERS]);
      hRow.setBackground('#1A1A1A');
      hRow.setFontColor('#FFFFFF');
      hRow.setFontWeight('bold');
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, HEADERS.length, 140);
    }

    const newId = sheet.getLastRow(); // ID autoincremental
    const now = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    sheet.appendRow([
      newId,
      now,
      data.cliente || '',
      data.representante || '',
      data.tipo || '',
      data.proveedor || '',
      data.origen || '',
      data.destino || '',
      data.fechaServicio || '',
      data.hora || '',
      data.viajes || 1,
      data.equipo || '',
      data.total || 0,
      data.anticipo || 0,
      data.liquidacion || 0,
      data.notas || '',
    ]);

    // Formato moneda en columnas Total, Anticipo, Liquidación
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 13, 1, 3).setNumberFormat('"$"#,##0.00');

    // Zebra
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground('#FFF5F2');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, id: newId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Mudanzas Express Sheets API activa' }))
    .setMimeType(ContentService.MimeType.JSON);
}
