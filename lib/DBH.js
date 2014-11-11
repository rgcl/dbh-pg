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
    sanitize = require('./sanitize'),
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
    this.verbose = !!setting.verbose;
}
DBH.constructor = DBH;

DBH.prototype.conn = function conn(scope) {
    var me = this,
        connection = new Connection(null, scope || {}, me.verbose);

    return new Promise(function (resolve, reject) {
        me.driver.connect(me.setting, function (err, client, done) {
            me.verbose && console.log('get connection from the poll');
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
                    me.verbose && console.log('release connection to the poll');
                    this.done();
                }, function () {
                    me.verbose && console.log('release connection to the poll');
                    this.done();
                });
        } else {
            // important! release the connection to the poll
            me.verbose && console.log('release connection to the poll');
            connection.done();
        }
    });
    
};

// Add sanitize
DBH.sanitize = sanitize;

// Define 'static' methods
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

DBH.sqlOrderBy = function sqlOrderBy(sort) {
    if (!(sort instanceof Array)) {
        sort = sort.orderBy || sort.sort;
    }
    if (!sort || sort.length === 0) {
        return ' ';
    }
    var sql = ' order by ';
    
    sort.forEach(function(sortRule) {
        sql += sortRule.attr
            + ' '
            + (sortRule.asc !== undefined && !sortRule.asc ? 'desc' : 'asc')
            + ', ';
    });
    return sql.slice(0, -2) + ' ';
}

DBH.sqlLimit = function sqlLimit(limit, offset) {
    if (typeof limit === 'object') {
        offset = limit.offset;
        limit = limit.limit;
    }
    if ((offset === undefined || offset === null)
        && (limit === undefined || limit === null)) {
        return ' ';
    } else if (offset === undefined || offset === null) {
        return ' limit ' + parseInt(limit, 10) + ' ';
    } else {
        return ' limit ' + parseInt(limit, 10) +
            ' offset ' + parseInt(offset, 10) + ' ';
    }
}

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

module.exports = DBH;
