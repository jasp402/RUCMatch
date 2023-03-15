import {expect} from 'chai';
import {
    isValidRuc,
    updateFromSunat,
    matchFromLocalDB,
    getRandomRuc,
    rucDisable,
    rucEnable,
    searchRuc,
} from '../index.js';
const ruc = '10077920787';

describe('RUC Functions', () => {
    describe('isValidRuc', () => {
        it('should return true for valid RUCs', () => {
            expect(isValidRuc('20100066603')).to.be.true;
            expect(isValidRuc('10467793549')).to.be.true;
        });

        it('should return false for invalid RUCs', () => {
            expect(isValidRuc('00000000000')).to.be.false;
            expect(isValidRuc('12345678901')).to.be.false;
        });
    });

    // Estas pruebas son solo ejemplos y pueden no funcionar dependiendo de cómo esté configurado tu entorno y base de datos.
    describe('rucDisable', () => {
        it('should disable a RUC if it exists', async () => {
            await rucDisable(ruc);
            const rucData = await searchRuc(ruc);
            expect(rucData.state).to.equal('disabled');
        });
    });

    describe('rucEnable', () => {
        it('should enable a RUC if it exists', async () => {
            await rucEnable(ruc);
            const rucData = await searchRuc(ruc);
            expect(rucData.state).to.equal('');
        });
    });

    describe('searchRuc', () => {
        it('should return data for a valid RUC', async () => {
            const rucData = await searchRuc(ruc);
            expect(rucData).to.not.be.null;
        });
    });

    describe('RandomRUC', () => {
        it('should return a random data for a valid RUC', async () => {
            const rucData = await getRandomRuc(ruc);
            expect(rucData).to.not.be.null;
        });
    });
});