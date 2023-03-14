const path = require('path');

module.exports = Object.freeze({
    URLS   : {
        BASE_URL: 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont1.html',
        ZIP_URL : 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont_TXT.zip'
    },
    PATHS  : {
        ZIP_FILE  : path.join('downloads', 'BueCont_TXT.zip'),
        UNZIP_FILE: path.join('downloads'),
        TXT_FILE  : path.join('downloads', 'BueCont_TXT.txt'),
        CSV_FILE  : path.join('downloads', 'data.csv'),
    },
    CONFIG: {
        CSV_HEADER: 'ruc|company_name|date|resolution_number|state|'
    },
    MESSAGE: {
        DB_CONNECT_SUCCESS: '✅ La conexión con la base de datos fue exitosa.',
        DB_MODEL_SYNC     : '✅ Las tablas fueron creadas (si no existían) y sincronizadas con el modelo.',
        DB_CONNECT_FAIL   : '⚠️ Error al conectar a la base de datos:',
    }
});