// config.mjs
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const URLS     = Object.freeze({
    BASE_URL: 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont1.html',
    ZIP_URL : 'https://ww3.sunat.gob.pe/descarga/BueCont/BueCont_TXT.zip',
});
export const PATHS    = Object.freeze({
    ZIP_FILE  : path.join('downloads', 'BueCont_TXT.zip'),
    UNZIP_FILE: path.join('downloads'),
    TXT_FILE  : path.join('downloads', 'BueCont_TXT.txt'),
    CSV_FILE  : path.join('downloads', 'data.csv'),
});
export const CONFIG   = Object.freeze({
    CSV_HEADER: 'ruc|company_name|date|resolution_number|state|'
});
export const PAGE     = Object.freeze({
    TITLE: 'Relación de Buenos Contribuyentes'
});
export const LOCAL_DB = Object.freeze({
    DB_USER : process.env.DB_USER,
    DB_PASS : process.env.DB_PASS,
    DB_NAME : process.env.DB_NAME,
    DB_PORT : process.env.DB_PORT,
    DB_TABLE: process.env.DB_TABLE,
    DB_FIELD: process.env.DB_FIELD
});
export const MESSAGE  = Object.freeze({
    DB_CONNECT_SUCCESS      : '✅ La conexión con la base de datos fue exitosa.',
    DB_MODEL_SYNC           : '✅ Las tablas fueron creadas (si no existían) y sincronizadas con el modelo.',
    DB_CONNECT_FAIL         : '⚠️ Error al conectar a la base de datos:',
    PAGE_NOT_LOAD           : '⚠️ Error retrieving HTML. The page has not loaded correctly or has been updated',
    PAGE_NOT_GET_LAST_UPDATE: '⚠️ Error retrieving last update. The page has not loaded correctly or has been updated',
    UNZIP_FILE_ERROR        : 'File extracted successfully'});

