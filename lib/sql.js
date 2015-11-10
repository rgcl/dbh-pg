/* ========================================================================
 * DBH-PG: utilities for creating SQL chunks.
 * ========================================================================
 * Copyright 2014-2015 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE (See LICENSE)
 * ======================================================================== */
'use strict';

exports.orderBy = function orderBy(sort) {
    if (!(sort instanceof Array)) {
        sort = sort.orderBy || sort.sort;
    }
    if (!sort || sort.length === 0) {
        return ' ';
    }
    var sql = ' ORDER BY ';
    
    sort.forEach(function(sortRule) {
        sql += sortRule.attr
            + ' '
            + (sortRule.asc !== undefined && !sortRule.asc ? 'DESC' : 'ASC')
            + ', ';
    });
    return sql.slice(0, -2) + ' ';
}

exports.limit = function limit(limit, offset) {
    if (!limit) {
        return ' ';
    }
    if (typeof limit === 'object') {
        offset = limit.offset;
        limit = limit.limit;
    }
    limit = parseInt(limit, 10);
    offset = parseInt(offset, 10);
    if (isNaN(limit) || limit < 0) {
        return ' ';
    } else if (isNaN(offset) || offset < 0) {
        return ' LIMIT ' + limit + ' ';
    } else {
        return ' LIMIT ' + limit + ' OFFSET ' + offset + ' ';
    }
}

exports.toNamed = function toNamed(object, separator, inSeparator) {
    separator = separator || 'AND';
    inSeparator = inSeparator || '=';
    var buffer = '';
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            buffer += ' '
                + key
                + inSeparator
                + '$'
                + key
                + ' '
                + separator;
        }
    }
    return buffer.slice(0, - separator.length);
}

exports.toIndexed = function toIndexed(object, refArray, separator, inSeparator, startIndex) {
    separator = separator || 'AND';
    inSeparator = inSeparator || '=';
    var index = startIndex || refArray.length + 1,
        buffer = '';
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            buffer += ' '
                + key
                + inSeparator
                + '$'
                + (index++)
                + ' '
                + separator;
            refArray.push(object[key]);
        }
    }
    return buffer.slice(0, - separator.length);
}
