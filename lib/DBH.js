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
    var dfd = Promise.defer();
    
    this.driver.connect(this.setting, function(err, client, done) {
        
        if (err) {
            done();
            dfd.reject(err);
        } else {
            
            client.scope = scope;
            dfd.promise.bind(client);
            
            client.done = done;
            client.exec = clientExtras.exec.bind(client);
            client.begin = clientExtras.begin.bind(client);
            client.commit = clientExtras.commit.bind(client);
            client.rollback = clientExtras.rollback.bind(client);
            client.insert = clientExtras.insert.bind(client);
            client.update = clientExtras.update.bind(client);
            client.delete = clientExtras.delete.bind(client);
            client.count = clientExtras.count.bind(client);
            
            dfd.resolve(client);
        }
    });
    
    return dfd.promise;
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
            this[fnName].apply(this, arguments);
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