// ==========================================
// FORMULARIO PROPIEDADES - GOOGLE APPS SCRIPT
// ==========================================
// Este script recibe datos del formulario, los guarda en Sheets
// y organiza imágenes en carpetas de Google Drive automáticamente

// CONFIGURACIÓN INICIAL - CAMBIAR ESTO
const SPREADSHEET_ID = '1KV69f214W9C7na_t6gHqHcOXnYdYM23ZgQBCIsFoqZU';
const CARPETA_DRIVE_ID = '1GbZMvFKJ7q5CU6VzxsfGovdkVij0tHDu';

// Función principal que recibe los datos del formulario
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const params = payload;

    // Obtener la hoja de Sheets
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Propiedades') || ss.getSheets()[0];

    // Crear nombre de la propiedad para la carpeta
    const nombrePropiedad = `${params.tipoPropiedad}_${params.colonia}_${new Date().getTime()}`;

    // Crear carpeta en Drive
    const carpetaPrincipal = DriveApp.getFolderById(CARPETA_DRIVE_ID);
    const carpetaPropiedad = carpetaPrincipal.createFolder(nombrePropiedad);
    const carpetaImagenes = carpetaPropiedad.createFolder('imagenes');

    // Variables para URLs de imágenes
    const imageUrls = [];

    // Procesar imágenes (base64)
    const imagenes = payload.imagenes || [];
    imagenes.forEach((img, i) => {
      const decoded = Utilities.base64Decode(img.data);
      const blob = Utilities.newBlob(decoded, img.type, img.name || `imagen_${i + 1}.jpg`);
      const file = carpetaImagenes.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrls.push(file.getUrl());
    });

    // Preparar datos para la fila
    const timestamp = new Date();
    const fila = [
      timestamp,
      params.tipoPropiedad || '',
      params.operacion || '',
      params.precio || '',
      params.area || '',
      params.direccion || '',
      params.colonia || '',
      params.municipio || '',
      params.estado || '',
      params.habitaciones || '',
      params.banos || '',
      params.estacionamientos || '',
      params.anio || '',
      params.piso || '',
      params.estadoPropiedad || '',
      params.descripcion || '',
      params.amenidades || '',
      imageUrls.length,
      imageUrls.join('; '),
      carpetaPropiedad.getUrl(),
      nombrePropiedad
    ];

    // Crear headers si es la primera fila
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Tipo de Propiedad',
        'Operación',
        'Precio',
        'Área (m²)',
        'Dirección',
        'Colonia',
        'Municipio',
        'Estado',
        'Habitaciones',
        'Baños',
        'Estacionamientos',
        'Año',
        'Piso',
        'Estado de Propiedad',
        'Descripción',
        'Amenidades',
        'Num. Imágenes',
        'URLs Imágenes',
        'Carpeta Drive',
        'Nombre Carpeta'
      ];
      sheet.appendRow(headers);
    }

    // Añadir fila de datos
    sheet.appendRow(fila);

    // Crear archivo de datos en la carpeta (texto)
    const datosTexto = `
=== PROPIEDAD: ${params.colonia} ===
Fecha: ${timestamp}

TIPO: ${params.tipoPropiedad}
OPERACIÓN: ${params.operacion}
PRECIO: $${params.precio}
ÁREA: ${params.area} m²

UBICACIÓN:
${params.direccion}
${params.colonia}
${params.municipio}, ${params.estado}

CARACTERÍSTICAS:
Habitaciones: ${params.habitaciones}
Baños: ${params.banos}
Estacionamientos: ${params.estacionamientos}
Año: ${params.anio}
Piso: ${params.piso}

ESTADO: ${params.estadoPropiedad}

DESCRIPCIÓN:
${params.descripcion}

AMENIDADES:
${params.amenidades}

IMÁGENES: ${imageUrls.length}
${imageUrls.map((url, i) => `${i+1}. ${url}`).join('\n')}

CARPETA: ${carpetaPropiedad.getUrl()}
    `;

    const archivoTexto = carpetaPropiedad.createFile('DATOS.txt', datosTexto, MimeType.PLAIN_TEXT);
    archivoTexto.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Retornar respuesta exitosa
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      carpeta: carpetaPropiedad.getUrl(),
      mensaje: 'Propiedad guardada correctamente'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      mensaje: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getData') {
    try {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName('Propiedades') || ss.getSheets()[0];
      const data = sheet.getDataRange().getValues();

      if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'success', data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const headers = data[0];
      const rows = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => { obj[header] = row[i]; });
        return obj;
      });

      return ContentService.createTextOutput(JSON.stringify({ result: 'success', data: rows }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({ result: 'error', mensaje: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput('Script activo y funcionando');
}
