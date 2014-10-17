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
    'fetchOne',
    'fetchAll',
    'fetchColumn',
    'fetchScalar',
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

DBH.escape = function(sql) {
    // thanks:
    // https://github.com/felixge/node-mysql/blob/master/lib/protocol/SqlString.js#L46-L58
    // Copyright (c) 2012 Felix Geisendörfer (felix@debuggable.com) and contributors
    // MIT License
    sql = sql.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
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
    return sql;
}

DBH.sqlOrderBy = function(orderBy) {
    if (!(orderBy instanceof Array)) {
        orderBy = orderBy.orderBy;
    }
    if (!orderBy || orderBy.length === 0) {
        return ' ';
    }
    var sql = ' order by ';
    orderBy.forEach(function(item) {
        sql += '"'
            + DBH.escape(item.attribute || item.attr)
            + '" '
            + ((item.descending || item.desc) ? 'desc' : 'asc')
            + ', ';
    });
    return sql.slice(0, -2) + ' ';
}

DBH.sqlLimit = function(limit, offset) {
    if (typeof(limit) === 'object') {
        offset = limit.offset || limit.start;
        limit = limit.limit || limit.count;
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
