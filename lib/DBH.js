/* ========================================================================
 * DBH-PG: DBH 'Class'
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var util = require('util'),
    pg = require('pg'),
    Promise = require('bluebird'),
    clientExtras = require('./client-extras');

/**
 * @param {Object|null} setting
 * @param {Object|null} driver the pg instance
 */
function DBH(setting, driver) {
    if (!(this instanceof DBH)) {
        console.warn('need \'new\' to instantiate DBH');
        return new DBH(setting, driver);
    }
    this.driver = driver || pg;
    this.setting = setting || this.driver.defaults;
}
DBH.constructor = DBH;

DBH.prototype.conn = function(scope) {
    var dfd = Promise.defer(),
        exposedClient;
    
    this.driver.connect(this.setting, function(err, client, done) {
        exposedClient = client || {};
        if (err) {
            done();
            dfd.reject(err);
        } else {
            
            exposedClient.scope = scope;
            
            exposedClient.done = done;
            exposedClient.exec = clientExtras.exec.bind(exposedClient);
            exposedClient.begin = clientExtras.begin.bind(exposedClient);
            exposedClient.commit = clientExtras.commit.bind(exposedClient);
            exposedClient.rollback = clientExtras.rollback.bind(exposedClient);
            exposedClient.insert = clientExtras.insert.bind(exposedClient);
            exposedClient.update = clientExtras.update.bind(exposedClient);
            exposedClient.delete = clientExtras.delete.bind(exposedClient);
            exposedClient.count = clientExtras.count.bind(exposedClient);
            
            dfd.resolve(exposedClient);
        }
    });
    
    return dfd.promise.bind(exposedClient);
};

// Define 'static' methods
[
    'exec',
    'done',
    'begin',
    'commit',
    'rollback',
    'insert',
    'update',
    'delete',
    'count'
].forEach(function(fnName) {
    DBH[fnName] = function() {
        return function() {
            this     [fnName].apply(this, arguments);
        }
    }
});

DBH.prepare = function(sql) {
    var cmd = {
        name : sql.trim(),
        text : sql
    }
    return function(values) {
        if (!(values[0] instanceof Array)) {
            values = arguments;
        }
        cmd.values = values;
        return cmd;
    }
}

module.exports = DBH;