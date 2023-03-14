const {Sequelize, Model, DataTypes, Op} = require('sequelize');
const config                            = require('./config.sequelize.json');
const sequelize                         = new Sequelize(config);

class Data extends Model {
}

class Settings extends Model {
}

Data.init({
    ruc              : {
        type      : DataTypes.STRING,
        primaryKey: true,
    },
    company_name     : DataTypes.STRING,
    date             : DataTypes.DATE,
    resolution_number: DataTypes.NUMBER,
    state            : {
        type        : DataTypes.STRING,
        allowNull   : true,
        defaultValue: null,
    },
}, {sequelize, modelName: 'data'});

Settings.init({
    current_sync: DataTypes.DATE,
    total_update: DataTypes.NUMBER,
    state       : DataTypes.STRING,
}, {sequelize, modelName: 'settings'});

module.exports = sequelize;

