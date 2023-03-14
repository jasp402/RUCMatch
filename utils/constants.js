const path = require('path');
require('dotenv').config();

module.exports = Object.freeze({
    URLS    : {
        BASE_URL: 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont1.html',
        ZIP_URL : 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont_TXT.zip'
    },
    PATHS   : {
        ZIP_FILE  : path.join('downloads', 'BueCont_TXT.zip'),
        UNZIP_FILE: path.join('downloads'),
        TXT_FILE  : path.join('downloads', 'BueCont_TXT.txt'),
        CSV_FILE  : path.join('downloads', 'data.csv'),
    },
    CONFIG  : {
        CSV_HEADER: 'ruc|company_name|date|resolution_number|state|'
    },
    PAGE    : {
        TITLE: 'Relación de Buenos Contribuyentes'
    },
    LOCAL_DB: {
        DB_USER : process.env.DB_USER,
        DB_PASS : process.env.DB_PASS,
        DB_NAME : process.env.DB_NAME,
        DB_PORT : process.env.DB_PORT,
        DB_TABLE: process.env.DB_TABLE,
        DB_FIELD: process.env.DB_FIELD
    },
    MESSAGE : {
        DB_CONNECT_SUCCESS      : '✅ La conexión con la base de datos fue exitosa.',
        DB_MODEL_SYNC           : '✅ Las tablas fueron creadas (si no existían) y sincronizadas con el modelo.',
        DB_CONNECT_FAIL         : '⚠️ Error al conectar a la base de datos:',
        PAGE_NOT_LOAD           : '⚠️ Error retrieving HTML. The page has not loaded correctly or has been updated',
        PAGE_NOT_GET_LAST_UPDATE: '⚠️ Error retrieving last update. The page has not loaded correctly or has been updated',
        UNZIP_FILE_ERROR        : 'File extracted successfully'
    }
});