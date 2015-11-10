/* ========================================================================
 * DBH-PG: Connection 'class'
 * ========================================================================
 * Copyright 2014 Rodrigo Gonzalez, Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var Promise = require('bluebird');

var PARAM_REGEX = /\$[\w\d]+/g;

function Connection(nativeClient, scope, verbose, pseudoSafeUpdates) {
    this.nativeClient = nativeClient;
    this.scope = scope || {};
    this.verbose = !!verbose;
    this.pseudoSafeUpdates = !!pseudoSafeUpdates;
}

Connection.prototype = {
    
    PARAM_REGEX : PARAM_REGEX,
    
    // client.exec(
    //     'SELECT * FROM Foo WHERE x=$1', // The SQL
    //     [3] // [Optional] Params
    // ); // or
    // client.exec(
    //     'SELECT * FROM Foo WHERE x=$x', // The SQL
    //     { x : 3 } // [Optional] Params
    // );
    exec : function exec(text, values) {
        this.verbose && console.log(
            '\nexec \''
            + text
            + '\'\n with values '
            + JSON.stringify(values)
            + '\n'
        );
        var dfd = Promise.defer(),
            dictionary = {},
            key,
            count = 0,
            arrayValues = [],
            onReady = function(err, results) {
                err ?
                    dfd.reject(err)
                    : dfd.resolve(results);
            };
        
        if (!values) {
            // text is a object?
            this.nativeClient.query(text, onReady);
        } else if (values instanceof Array) {
            // array values, so use the pg api
            this.nativeClient.query(text, values, onReady);
        } else if(values instanceof Object) {
            // values in objet, so normalize to pg api
            // TODO: use text.replace(regex, fn) instead
            var matches = text.match(PARAM_REGEX);
            if(matches !== null) {
                matches.forEach(function(element) {
                    if (!dictionary[element]) {
                        ++count;
                        dictionary[element] = true;
                        text = text.replace(
                            new RegExp("\\$" + element.slice(1), 'g'),
                            '$' + count
                        );
                        key = element.slice(1);
                        arrayValues.push(values[key] || null);
                    }
                });
            }
            this.nativeClient.query(text, arrayValues, onReady);
        } else {
            dfd.reject(new Error('Bad type'));
        }
        
        return dfd.promise.bind(this);
    },
    
    // Start transaction, then commit or rollback
    begin : function begin() {
        this.scope.__openTransaction = true;
        return this.exec('BEGIN');
    },
    commit : function commit() {
        this.scope.__openTransaction = false;
        return this.exec('COMMIT');
    },
    rollback : function rollback() {
        this.scope.__openTransaction = false;
        return this.exec('ROLLBACK');
    },
    
    fetchOne : function fetchOne(query, data) {
        return this.exec(query, data)
            .then(function(result) {
                return result.rows[0];
            });
    },
    
    fetchAll : function fetchAll(query, data) {
        return this.exec(query, data)
            .then(function(result) {
                return result.rows;
            });
    },
    
    fetchColumn : function fetchColumn(query, data, columnName) {
        return this.exec(query, data)
            .then(function(result) {
                if (result.rows.length === 0) {
                    return [];
                }
                if(!columnName) {
                    columnName = Object.keys(result.rows[0])[0];
                }
                return result.rows
                    .map(function(row) {
                        return row[columnName];
                    });
            });
    },
    
    fetchScalar : function fetchScalar(query, data, columnName) {
        return this.fetchColumn(query, data, columnName)
            .then(function(list) {
                return list[0];
            });
    },
    
    insert : function insert(table, data, returning) {
        var keys = Object.keys(data),
            values = [],
            sql = 'INSERT INTO '
                + table
                + ' ("'
                + keys.join('", "')
                + '") VALUES ('
                + keys.map(function(key, i) {
                    values.push(data[key]);
                    return '$' + (i + 1);
                }).join(', ')
                + ') ';

        if (returning instanceof Array && returning.length) {
            sql += ' RETURNING ' + returning.join(', ');
        } else if (typeof returning === 'string') {
            sql += ' RETURNING ' + returning;
        }

        return this.exec(sql, values);
    },
    
    update : function update(table, data, whereData, returning) {
        if(this.pseudoSafeUpdates && !!whereData) {
            return Promise.reject(new Error('pseudoSafeUpdates: Missing whereData in update'));
        }
        var keys = Object.keys(data),
            whereKeys = whereData && Object.keys(whereData),
            values = [],
            valuesCount = 0,
            sql = 'UPDATE '
                + table
                + ' SET '
                + keys.map(function (key) {
                    ++valuesCount;
                    values.push(data[key]);
                    return '"' + key + '"=$' + valuesCount;
                }).join(', ');

        if (whereKeys.length) {
            sql += ' WHERE '
                + whereKeys.map(function (key) {
                    ++valuesCount;
                    values.push(whereData[key]);
                    return '"' + key + '"=$' + valuesCount;
                }).join(' AND ');
        }

        if (returning instanceof Array && returning.length) {
            sql += ' RETURNING ' + returning.join(', ');
        } else if (typeof returning === 'string') {
            sql += ' RETURNING ' + returning;
        }

        return this.exec(sql, values);
    },
    
    delete : function delete_(table, whereData, returning) {
        if(this.pseudoSafeUpdates && !!whereData) {
            return Promise.reject(new Error('pseudoSafeUpdates: Missing whereData in update'));
        }
        var whereKeys = whereData && Object.keys(whereData),
            values = [],
            sql = 'DELETE FROM '
                + table;

        if (whereKeys.length) {
            sql += ' WHERE '
                + whereKeys.map(function (key, i) {
                    values.push(whereData[key]);
                    return '"' + key + '" = $' + (i + 1);
                }).join(' AND ');
        }

        if (returning instanceof Array && returning.length) {
            sql += ' RETURNING ' + returning.join(', ');
        } else if (typeof returning === 'string') {
            sql += ' RETURNING ' + returning;
        }

        return this.exec(sql, values);
    },
    
    exists : function exists(table, whereData) {
        var whereKeys = whereData && Object.keys(whereData),
            values = [],
            sql = 'SELECT EXISTS(SELECT 1 FROM '
                + table;
            
        if (whereKeys.length) {
            sql += ' WHERE '
                + whereKeys.map(function (key, i) {
                    values.push(whereData[key]);
                    return '"' + key + '"=$' + (i + 1);
                }).join(' AND ');
        }
        
        sql += ' ) AS "exists"';
        
        return this.exec(sql, values).then(function(results) {
            return results.rows[0].exists;
        });
    },
    
    count : function count(table, whereData) {
        var values = [],
            sql = 'SELECT COUNT(*) FROM '
                + table;
        if (whereData) {
            var whereKeys = whereData && Object.keys(whereData);
            if (whereKeys.length) {
                sql += ' WHERE '
                    + whereKeys.map(function (key, i) {
                        values.push(whereData[key]);
                        return '"' + key + '"=$' + (i + 1);
                    }).join(' AND ');
            }
        }

        return this.exec(sql, values).then(function(results) {
            return results.rows[0].count;
        });
    }

}

module.exports = Connection;
