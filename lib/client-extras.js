/* ========================================================================
 * DBH-PG: extra methods for client instance
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var Promise = require('bluebird');

module.exports = {
    
    // client.exec(
    //     'SELECT * FROM Foo WHERE x=$1', // The SQL
    //     3 // [Optional] Params
    // );
    exec : function(sql, values) {
        var dfd = Promise.defer();
        
        if (sql.text) {
            sql = sql.text;
            values = sql.values
        } else if (!values) {
            values = [];
        } else if (!(values instanceof Array)) {
            values = arguments.slice(1);
        }
        
        this.query(sql, values, function(err, results) {
            if (err) {
                dfd.reject(err);
                return;
            }
            
            dfd.resolve(results);
        });
        
        return dfd.promise.bind(this);
        
    },
    
    // Start transaction, then commit or rollback
    begin : function() { return this.exec('BEGIN'); },
    commit : function() { return this.exec('COMMIT'); },
    rollback : function() { return this.exec('ROLLBACK'); },
    
    insert : function(table, data) {
        var keys = Object.keys(data),
            values = [],
            sql = 'INSERT INTO '
                + table
                + ' ('
                + keys.split(',')
                + ') VALUES ('
                + keys.map(function(key, i) {
                    values.push(data[key]);
                    return '$' + (i + 1);
                }).split(',')
                + ')';
        
        return this.exec(sql, values);
    },
    
    update : function(table, data, whereData) {
        var keys = Object.keys(data),
            values = [],
            sql = 'UPDATE '
                + table
                + ' SET '
                + keys.map(function(key, i) {
                    values.push(data[key]);
                    return key + ' = $' + (i + 1);
                }).split(','),
                whereKey,
                whereCount = 1;
            
            if (whereData) {
                sql += ' WHERE true';
                for(whereKey in whereData) {
                    if (whereData.hasOwnProperty(whereKey)) {
                        sql += ' AND ' + whereKey + ' = $' + whereCount;
                        ++whereCount;
                        values.push(whereData[whereKey]);
                    }
                }
            }
        
        return this.exec(sql, values);
    },
    
    delete : function(table, whereData) {
        var values = [],
            sql = 'DELETE FROM '
                + table,
            whereKey,
            whereCount = 1;
            
            if (whereData) {
                sql += ' WHERE true';
                for(whereKey in whereData) {
                    if (whereData.hasOwnProperty(whereKey)) {
                        sql += ' AND ' + whereKey + ' = $' + whereCount;
                        ++whereCount;
                        values.push(whereData[whereKey]);
                    }
                }
            }
        
        return this.exec(sql, values);
    }
    
}