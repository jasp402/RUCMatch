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
          LOCAL_DB,
          PAGE
      }         = require('./utils/constants.js');

//Models
const dataRaw  = sequelize.models.data;
const settings = sequelize.models.settings;
let lastUpdate = undefined;

//init db
const _connectToInternalDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
        await sequelize.sync();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
    } catch (error) {
        console.error(MESSAGE.DB_CONNECT_FAIL, error);
    }
};

const _getLastUpdate = async () => {
    try {
        const response = await axios.get(URLS.BASE_URL);
        const $        = cheerio.load(response.data);

        const pageTitle = $('title').text();
        if (pageTitle !== PAGE.TITLE) throw new Error(MESSAGE.PAGE_NOT_LOAD);

        const lastUpdate = $('body > div:eq(0) table:first tbody tr td:eq(0)')
            .html()
            .match(/(\d{2})\/(\d{2})\/(\d{4})/)[0]
            .split('/')
            .reverse()
            .join('-');
        if (lastUpdate) return lastUpdate;
        else return null;
    } catch (error) {
        console.error(PAGE.PAGE_NOT_GET_LAST_UPDATE, error);
    }
};

const _unZipFile = async () => {
    const zipFile = new AdmZip(PATHS.ZIP_FILE, true);
    zipFile.extractAllTo(PATHS.UNZIP_FILE, true, false, (error) => {
        if (error) {
            console.error(error);
        } else {
            console.log(MESSAGE.UNZIP_FILE_ERROR);
        }
    });
}

const _insertData = async (data) => {
    await sequelize.sync();
    await dataRaw.bulkCreate(data, {
        ignoreDuplicates: true,
    });
    await settings.update({
        state: 'inactive'
    }, {
        where: {}
    });
    await settings.create({
        current_sync: new Date(lastUpdate),
        total_update: data.length,
        state       : 'active'
    })
    await sequelize.close();
}

const _formattingCSV = async () => {
    const fileContent = fs.readFileSync(PATHS.TXT_FILE, 'utf-8');
    const lines       = fileContent.split('\r');
    lines.shift();
    const newFileContent = lines.join('\n');
    fs.writeFileSync(PATHS.CSV_FILE, `${CONFIG.CSV_HEADER}\n${newFileContent}`);
}

const _updateData = async () => {
    const resultados = [];
    await _formattingCSV();
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
    lastUpdate       = await _getLastUpdate();
    const settingRow = await settings.findOne({
        where: {
            state: 'active'
        }
    });
    let download     = false;
    if (!settingRow) {
        download = true;
    } else {
        let current_sync = settingRow.current_sync.toISOString().substring(0, 10);
        console.log(current_sync, lastUpdate);
        if (current_sync !== lastUpdate) {
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
                _unZipFile();
                _updateData();
            })
            .catch((error) => {
                console.error('Error al descargar el archivo:', error);
                fs.unlinkSync(PATHS.ZIP_FILE);
                console.log('Archivo eliminado');
            });
    } else {
        console.log('No hay actualizaciones recientes');
    }
}

async function matchFromLocalDB() {
    const sequelize = new Sequelize(LOCAL_DB.DB_NAME, LOCAL_DB.DB_USER, LOCAL_DB.DB_PASS, {
        dialect: 'mysql',
        host   : 'localhost',
        port   : LOCAL_DB.DB_PORT
    });

    sequelize.query(`SELECT ${LOCAL_DB.DB_FIELD} FROM ${LOCAL_DB.DB_TABLE} c WHERE ${LOCAL_DB.DB_FIELD} != ''`, {type: Sequelize.QueryTypes.SELECT})
        .then(result => {
            let countRuc = 0;
            console.log(`Total RUC found: ${result.length}`)
            result.forEach(async (row, i) => {

                let rowUpdated = await dataRaw.update(
                    {state: 'used'},
                    {where: {ruc: row[`${LOCAL_DB.DB_FIELD}`]}}
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

async function getRandomRuc(searchRuc = null) {
    await _connectToInternalDatabase();

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

//Todo: disableRUC
//Todo: freeRUC

module.exports = {
    updateFromSunat,
    matchFromLocalDB,
    getRandomRuc
}