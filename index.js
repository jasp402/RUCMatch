const cheerio         = require('cheerio');
const AdmZip          = require('adm-zip');
const axios           = require('axios');
const path            = require('path');
const csv             = require('csv-parser');
const fs              = require('fs');
const {Sequelize, Op} = require('sequelize');

//Local settings
const sequelize = require('./db/init.db.js');
const {
    MESSAGE,
    URLS,
    PATHS,
    CONFIG,
    LOCAL_DB
} = require('./utils/constants.js');

//Models
const dataRaw  = sequelize.models.data;
const settings = sequelize.models.settings;

//init db
(async () => {
    try {
        await sequelize.authenticate();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
        await sequelize.sync();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
    } catch (error) {
        console.error(MESSAGE.DB_CONNECT_FAIL, error);
    }
})();

async function _getPageHtml() {
    const response = await axios.get(URLS.BASE_URL);
    return response.data;
}

async function _getLastUpdate() {
    const html        = await _getPageHtml();
    const $           = cheerio.load(html);
    const last_update = $('body > div:eq(0) table:first tbody tr td:eq(0)')
        .html()
        .match(/(\d{2})\/(\d{2})\/(\d{4})/)[0]
        .split('/')
        .reverse()
        .join('-');
    return last_update;
}

async function _unZip() {
    const zip = new AdmZip(PATHS.ZIP_FILE, true);
    zip.extractAllTo(PATHS.UNZIP_FILE, true, false, stderr => {
        console.log(stderr);
    });
    console.log('Archivo descomprimido');
}

async function _insertData(data) {
    await sequelize.sync();
    return await dataRaw.bulkCreate(data, {
        ignoreDuplicates: true,
    });
}

async function _formattingCSV(settings) {
    const inputFilePath  = PATHS.TXT_FILE;
    const outputFilePath = PATHS.CSV_FILE;
    const fileContent    = fs.readFileSync(inputFilePath, 'utf-8');
    const lines          = fileContent.split('\r');
    lines.shift();
    const newFileContent = lines.join('\n');
    fs.writeFileSync(outputFilePath, `${CONFIG.CSV_HEADER}\n${newFileContent}`);
}

async function _updateData() {
    const resultados = [];
    await _formattingCSV(settings);
    fs.createReadStream(PATHS.CSV_FILE)
        .pipe(csv({separator: '|'}))
        .on('data', (data) => {
            resultados.push(data);
        })
        .on('end', () => {
            _insertData(resultados);
        });
}

async function updateFromSunat() {
    const lastUpdate = await _getLastUpdate();
    const settingRow = await settings.findOne();
    let download     = false;
    if (!settingRow) {
        //ejecutar la sincronización por primera vez
        download = true;
    } else {
        console.log(settingRow.current_sync, lastUpdate);
        if (new Date(settingRow.current_sync) !== new Date(lastUpdate)) {
            //generar una nueva sincronización
            download = true;
        }
    }
    if (download) {
        axios({
            url         : URLS.ZIP_URL,
            method      : 'GET',
            responseType: 'arraybuffer'
        })
            .then((response) => {
                if (!fs.existsSync(path.dirname(PATHS.ZIP_FILE))) {
                    fs.mkdirSync(path.dirname(PATHS.ZIP_FILE), {recursive: true});
                }
                fs.writeFileSync(PATHS.ZIP_FILE, response.data);
                console.log('Descarga completa');
                _unZip();
                _updateData();
            })
            .catch((error) => {
                console.error('Error al descargar el archivo:', error);
                fs.unlinkSync(PATHS.ZIP_FILE);
                console.log('Archivo eliminado');
            });
    }
}

async function matchFromLocalDB() {
    const sequelize = new Sequelize(LOCAL_DB.DB_NAME, LOCAL_DB.DB_USER, LOCAL_DB.DB_PASS, {
        dialect: 'mysql',
        host: 'localhost',
        port: LOCAL_DB.DB_PORT
    });

    sequelize.query("SELECT identificador_tributario FROM comercio c WHERE identificador_tributario != ''", {type: Sequelize.QueryTypes.SELECT})
        .then(result => {
            let countRuc = 0;
            console.log(`Total RUC found: ${result.length}`)
            result.forEach(async (row, i) => {
                console.log(`RUC #${i}`);

                let rowUpdated = await dataRaw.update(
                    {state: 'used'},
                    {where: {ruc: row.identificador_tributario}}
                );
                if (rowUpdated[0]) {
                    countRuc++;
                    console.log(`Total Update: ${countRuc}`);
                } else {
                    console.log(row)
                }


            })
        })
        .catch(err => {
            console.error(err);
        });
}

async function getRuc(searchRuc = null) {
    let opt = {where: {state: ''}};
    if (searchRuc) {
        //Hacer match para sincronizar ruc usados
        opt = {where: {state: null, resolution_number: {[Op.not]: null}, ruc: searchRuc}};
    }
    const result = await dataRaw.findOne(opt);
    if (result) {
        let rowUpdated = await dataRaw.update(
            {state: 'reserved'},
            {where: {ruc: result.dataValues.ruc}}
        );
        return result.dataValues;
    } else {
        return null;
    }
}

// main(true).then(r => console.log('result:', r));
// updateFromSunat();
matchFromLocalDB();

// getRuc().then(result => {
//     console.log(result);
// });