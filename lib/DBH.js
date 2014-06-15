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
    Connection = require('./Connection');

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
        connection = new Connection(null, scope);
    
    this.driver.connect(this.setting, function(err, client, done) {
        if (err) {
            done();
            dfd.reject(err);
        } else {
            connection.nativeClient = client;
            connection.done = done;
            dfd.resolve(connection);
        }
    });
    
    return dfd.promise.bind(connection);
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
        var args = arguments;
        return function() {
            return this[fnName].apply(this, args);
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
        if (!(values instanceof Array)) {
            values = arguments;
        }
        cmd.values = values;
        return cmd;
    }
}

module.exports = DBH;