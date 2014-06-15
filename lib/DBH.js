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
        exposedClient = {
            scope : scope
        };
    
    this.driver.connect(this.setting, function(err, client, done) {
        if (err) {
            done();
            dfd.reject(err);
        } else {
            
            exposedClient.nativeClient = client;
            exposedClient.done = done;
            exposedClient.exec = clientExtras.exec.bind(client);
            exposedClient.begin = clientExtras.begin.bind(client);
            exposedClient.commit = clientExtras.commit.bind(client);
            exposedClient.rollback = clientExtras.rollback.bind(client);
            exposedClient.insert = clientExtras.insert.bind(client);
            exposedClient.update = clientExtras.update.bind(client);
            exposedClient.delete = clientExtras.delete.bind(client);
            exposedClient.count = clientExtras.count.bind(client);
            
            dfd.resolve(exposedClient);
        }
    });
    
    return dfd.promise.bind(exposedClient);
};

// Define 'static' methods
[
    'exec',
    'insert',
    'update',
    'delete',
    'count'
].forEach(function(fnName) {
    DBH[fnName] = function() {
        return function() {
            return this[fnName].apply(this, arguments);
        }
    }
});

// Other 'static' methods
[
    'begin',
    'commit',
    'rollback',
    'done'
].forEach(function(fnName) {
    DBH[fnName] = function() {
        return this[fnName].call(this);
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