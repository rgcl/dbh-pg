/* ========================================================================
 * DBH-PG: Connection 'class'
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var Promise = require('bluebird');

var PARAM_REGEX = /\$[\w\d]+/g;

function get(object, key) {
    var pascalKey,
        getterKey,
        isKey;
    if (object[key] !== undefined) {
        return object[key];
    } else if(object.get instanceof Function) {
        return object.get(key);
    } else {
        pascalKey = + key[0].toUpperCase() + key.slice(1);
        getterKey = 'get' + pascalKey;
        if (object.getterKey instanceof Function) {
            return object.getterKey(key);
        } else {
                isKey = 'is' + pascalKey;
                if (object.isKey instanceof Function) {
                return object.isKey(key);
            }
            return null;
        }
    }
}

function Connection(nativeClient, scope, verbose) {
    this.nativeClient = nativeClient;
    this.scope = scope || {};
    this.verbose = !!verbose;
}

Connection.prototype = {
    
    PARAM_REGEX : PARAM_REGEX,
    
    get : get,
    
    // client.exec(
    //     'SELECT * FROM Foo WHERE x=$1', // The SQL
    //     [3] // [Optional] Params
    // ); // or
    // client.exec(
    //     'SELECT * FROM Foo WHERE x=$x', // The SQL
    //     { x : 3 } // [Optional] Params
    // );
    exec : function(text, values) {
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
                        arrayValues.push(get(values, key));
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
    begin : function() {
        this.scope.__openTransaction = true;
        return this.exec('BEGIN');
    },
    commit : function() {
        this.scope.__openTransaction = false;
        return this.exec('COMMIT');
    },
    rollback : function() {
        this.scope.__openTransaction = false;
        return this.exec('ROLLBACK');
    },
    
    fetchOne : function(query, data) {
        return this.exec(query, data)
            .then(function(result) {
                return result.rows[0];
            });
    },
    
    fetchAll : function(query, data) {
        return this.exec(query, data)
            .then(function(result) {
                return result.rows;
            });
    },
    
    fetchColumn : function(query, data, columnName) {
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
    
    fetchScalar : function(query, data, columnName) {
        return this.fetchColumn(query, data, columnName)
            .then(function(list) {
                return list[0];
            });
    },
    
    insert : function(table, data, columns) {
        columns = columns || Object.keys(data);
        var values = [],
            sql = 'INSERT INTO "'
                + table
                + '" ("'
                + columns.join('", "')
                + '") VALUES ('
                + columns.map(function(key, i) {
                    values.push(get(data, key));
                    return '$' + (i + 1);
                }).join(', ')
                + ')';
        
        return this.exec(sql, values);
    },
    
    update : function(table, data, whereData, columnsData, columnsWhereData) {
        columnsData = columnsData || Object.keys(data);
        columnsWhereData = columnsWhereData
            || (whereData && Object.keys(whereData));
        var values = [],
            valuesCount = 0,
            sql = 'UPDATE "'
                + table
                + '" SET '
                + columnsData.map(function(key) {
                    ++valuesCount;
                    values.push(get(data, key));
                    return '"' + key + '" = $' + valuesCount;
                }).join(', ');
            
        if (columnsWhereData) {
            sql += ' WHERE '
                + columnsWhereData.map(function(key) {
                    ++valuesCount;
                    values.push(get(whereData, key));
                    return '"' + key + '" = $' + valuesCount;
                }).join(' AND ');
        }
        
        return this.exec(sql, values);
    },
    
    delete : function(table, whereData, columnsWhereData) {
        columnsWhereData = columnsWhereData
            || (whereData && Object.keys(whereData));
        var values = [],
            sql = 'DELETE FROM "'
                + table
                + '"';
            
        if (columnsWhereData) {
            sql += ' WHERE '
                + columnsWhereData.map(function(key, i) {
                    values.push(get(whereData, key));
                    return '"' + key + '" = $' + (i + 1);
                }).join(' AND ');
        }
        
        return this.exec(sql, values);
    },
    
    count : function(table, whereData, columnsWhereData) {
        columnsWhereData = columnsWhereData
            || (whereData && Object.keys(whereData));
        var values = [],
            sql = 'SELECT COUNT(*) FROM "'
                + table
                + '"';
            
        if (columnsWhereData) {
            sql += ' WHERE '
                + columnsWhereData.map(function(key, i) {
                    values.push(get(whereData, key));
                    return '"' + key + '" = $' + (i + 1);
                }).join(' AND ');
        }
        
        return this.exec(sql, values).then(function(results) {
            return results.rows[0].count;
        });
    }
    
}

module.exports = Connection;
