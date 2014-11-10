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
    this.verbose = !!setting.verbose;
}
DBH.constructor = DBH;

DBH.prototype.conn = function(scope) {
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
    .disposer(function (connection, promise) {
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
].forEach(function(fnName) {
    DBH[fnName] = function() {
        var args = arguments;
        return function() {
            return this[fnName].apply(this, args);
        }
    }
});

DBH.sqlEscape = function(sql) {
    // thanks:
    // https://github.com/felixge/node-mysql/blob/master/lib/protocol/SqlString.js#L46-L58
    // Copyright (c) 2012 Felix Geisendörfer (felix@debuggable.com) and contributors
    // MIT License
    return sql.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
        switch(s) {
            case "\0": return "\\0";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\b": return "\\b";
            case "\t": return "\\t";
            case "\x1a": return "\\Z";
            default: return "\\" + s;
        }
    });
}

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

DBH.sqlLimit = function(limit, offset) {
    if (typeof(limit) === 'object') {
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
