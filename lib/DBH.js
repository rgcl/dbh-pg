/* ========================================================================
 * DBH-PG: main Class.
 * ========================================================================
 * Copyright 2014 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE (SEE LICENSE)
 * ======================================================================== */
'use strict';

var util = require('util'),
    pg = require('pg'),
    Promise = require('bluebird'),
    Connection = require('./Connection'),
    sanitize = require('./sanitize'),
    sql = require('./sql');

function DBH(setting, driver) {
    if (!(this instanceof DBH)) {
        console.warn('need \'new\' to instantiate DBH');
        return new DBH(setting, driver);
    }
    this.driver = driver || pg;
    this.setting = setting || this.driver.defaults;
    this.verbose = !!setting.verbose;
}

DBH.prototype.constructor = DBH;

DBH.prototype.conn = function conn(scope) {
    var me = this,
        connection = new Connection(null, scope || {}, me.verbose);

    return new Promise(function (resolve, reject) {
        me.driver.connect(me.setting, function (err, client, done) {
            me.verbose && console.log('get connection from the pool');
            if (err) {
                reject(err);
            } else {
                connection.nativeClient = client;
                connection.done = done;
                resolve(connection);
            }
        });
    })
    .bind(connection)
    .disposer(function disposerConn(connection, promise) {
        if (connection.scope.__openTransaction) {
            me.verbose && console.log('appy rollback');
            connection.rollback()
                .then(function () {
                    me.verbose && console.log('release connection to the pool');
                    this.done();
                }, function () {
                    me.verbose && console.log('release connection to the pool');
                    this.done();
                });
        } else {
            // important! release the connection to the pool
            me.verbose && console.log('release connection to the pool');
            connection.done();
        }
    });
    
};

// Define the 'static' .one
DBH.one = function one(index) {
    return function oneClausure(result) {
        return result.rows[index || 0];
    }
}

// Define the rest of 'static' methods
[
    'exec',
    'fetchOne',
    'fetchAll',
    'fetchColumn',
    'fetchScalar',
    'insert',
    'update',
    'delete',
    'count',
    'begin',
    'commit',
    'rollback',
    'done'
].forEach(function (fnName) {
    DBH[fnName] = function() {
        var args = arguments;
        return function () {
            return this[fnName].apply(this, args);
        }
    }
});

DBH.prepare = function prepare(sql) {
    var name = sql.trim(),
        text = sql;
    return function(values) {
        if (!(values instanceof Array)) {
            values = arguments;
        }
        return {
            name : name,
            text : sql,
            values : values
        };
    }
}

// Add proxy to sanitize.js
DBH.sanitize = sanitize;

// Add proxy to sql.js
DBH.sql = sql;

module.exports = DBH;

