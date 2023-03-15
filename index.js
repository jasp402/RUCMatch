import cheerio from 'cheerio';
import AdmZip from 'adm-zip';
import axios from 'axios';
import path from 'path';
import csv from 'csv-parser';
import fs from 'fs';
import {Sequelize, Op} from 'sequelize';

// Local settings
import sequelize from './db/init.db.js';
import {
    MESSAGE,
    URLS,
    PATHS,
    CONFIG,
    LOCAL_DB,
    PAGE
} from './utils/constants.mjs';

// Models
const rawData  = sequelize.models.data;
const settings = sequelize.models.settings;
let lastUpdate;

// Connect to the internal database
const connectToInternalDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
        await sequelize.sync();
        console.log(MESSAGE.DB_CONNECT_SUCCESS);
    } catch (error) {
        console.error(MESSAGE.DB_CONNECT_FAIL, error);
    }
};

const getLastUpdate = async () => {
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

const unzipFile = async () => {
    const zipFile = new AdmZip(PATHS.ZIP_FILE, true);
    zipFile.extractAllTo(PATHS.UNZIP_FILE, true, false, (error) => {
        if (error) {
            console.error(error);
        } else {
            console.log(MESSAGE.UNZIP_FILE_ERROR);
        }
    });
}

const insertData = async (data) => {
    await sequelize.sync();
    await rawData.bulkCreate(data, {
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

const formatCSV = async () => {
    const fileContent = fs.readFileSync(PATHS.TXT_FILE, 'utf-8');
    const lines       = fileContent.split('\r');
    lines.shift();
    const newFileContent = lines.join('\n');
    fs.writeFileSync(PATHS.CSV_FILE, `${CONFIG.CSV_HEADER}\n${newFileContent}`);
}

const updateData = async () => {
    const results = [];
    await formatCSV();
    fs.createReadStream(PATHS.CSV_FILE)
        .pipe(csv({separator: '|'}))
        .on('data', (data) => {
            results.push(data);
        })
        .on('end', () => {
            insertData(results);
        });
}

const shouldDownload = (settingRow, lastUpdate) => {
    if (!settingRow) return true;
    const currentSync = settingRow.current_sync.toISOString().substring(0, 10);
    console.log(currentSync, lastUpdate);
    return currentSync !== lastUpdate;
};

const downloadAndSaveZip = async () => {
    try {
        const response = await axios({
            url         : URLS.ZIP_URL,
            method      : 'GET',
            responseType: 'arraybuffer'
        });
        if (!fs.existsSync(path.dirname(PATHS.ZIP_FILE))) {
            fs.mkdirSync(path.dirname(PATHS.ZIP_FILE), {recursive: true});
        }
        fs.writeFileSync(PATHS.ZIP_FILE, response.data);
        console.log('Descarga completa');
        return true;
    } catch (error) {
        console.error('Error al descargar el archivo:', error);
        fs.unlinkSync(PATHS.ZIP_FILE);
        console.log('Archivo eliminado');
        return false;
    }
};

async function updateFromSunat() {
    lastUpdate       = await getLastUpdate();
    const settingRow = await settings.findOne({
        where: {
            state: 'active'
        }
    });
    const download   = shouldDownload(settingRow, lastUpdate);

    if (download) {
        const downloaded = await downloadAndSaveZip();
        if (downloaded) {
            await unzipFile();
            await updateData();
        }
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

                let rowUpdated = await rawData.update(
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

async function getRandomRuc() {
    await connectToInternalDatabase();
    const result = await rawData.findOne({where: {state: ''}});
    if (result) {
        await rawData.update(
            {state: 'reserved'},
            {where: {ruc: result.dataValues.ruc}}
        );
        return result.dataValues;
    } else {
        return null;
    }
}

export const isValidRuc = (ruc) => {
    ruc = ruc.toString();
    ruc = ruc.replace(/\s+/g, '');
    if (ruc === '00000000000' || ruc === '12345678901') {
        return false;
    }
    if (!isNaN(ruc)) {
        const factors = ruc.length === 8 ? [2, 3, 4, 5, 6, 7] : [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        const checkDigit = parseInt(ruc[ruc.length - 1]);
        let sum = 0;
        for (let i = 0; i < factors.length; i++) {
            sum += factors[i] * parseInt(ruc[i]);
        }
        const remainder = sum % 11;
        const verificationDigit = (remainder < 2) ? 0 : 11 - remainder;
        return verificationDigit === checkDigit;
    }
    return false;
}

async function rucDisable(ruc) {
    try {
        await connectToInternalDatabase();
        const updatedRows = await rawData.update(
            { state: 'disabled' },
            { where: { ruc: ruc } }
        );

        if (updatedRows[0] > 0) {
            console.log(`RUC ${ruc} has been disabled successfully.`);
        } else {
            console.log(`RUC ${ruc} not found or already disabled.`);
        }
    } catch (error) {
        console.error(`Error disabling RUC ${ruc}:`, error);
    }
}

async function rucEnable(ruc) {
    try {
        await connectToInternalDatabase();
        const updatedRows = await rawData.update(
            { state: '' },
            { where: { ruc: ruc } }
        );

        if (updatedRows[0] > 0) {
            console.log(`RUC ${ruc} has been enabled successfully.`);
        } else {
            console.log(`RUC ${ruc} not found or already enabled.`);
        }
    } catch (error) {
        console.error(`Error enabling RUC ${ruc}:`, error);
    }
}

async function searchRuc(ruc) {
    if (!isValidRuc(ruc)) {
        console.log(`Invalid RUC: ${ruc}`);
        return null;
    }

    try {
        await connectToInternalDatabase();
        const rucData = await rawData.findOne({ where: { ruc: ruc } });

        if (rucData) {
            console.log(`RUC ${ruc} found.`);
            return rucData;
        } else {
            console.log(`RUC ${ruc} not found.`);
            return null;
        }
    } catch (error) {
        console.error(`Error searching for RUC ${ruc}:`, error);
        return null;
    }
}


export {
    updateFromSunat,
    matchFromLocalDB,
    getRandomRuc,
    rucDisable,
    rucEnable,
    searchRuc
};