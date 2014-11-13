/* ========================================================================
 * DBH-PG: utilities for creating SQL chunks.
 * ========================================================================
 * Copyright 2014 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE
 * ======================================================================== */
'use strict';

exports.orderBy = function orderBy(sort) {
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

exports.limit = function limit(limit, offset) {
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
