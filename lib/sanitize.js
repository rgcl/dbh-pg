/* ========================================================================
 * DBH-PG: utilities for sanitize inputs.
 * ========================================================================
 * Copyright 2014 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE
 * ======================================================================== */

exports.escape = function escape(str) {
    // thanks:
    // https://github.com/felixge/node-mysql/blob/1d4cb893a9906890554016c398dccb4271e66808/lib/protocol/SqlString.js#L46-L56
    // Copyright (c) 2012 Felix Geisendörfer (felix@debuggable.com) and contributors
    // MIT License
    return str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
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

exports.array = function sanitizeArray(array, whitelist) {
    var sanitized = [],
        whiteValue;
    array.forEach(function sanitizeArrayForEach(key) {
        whiteValue = sanitizeScalar(key, whitelist[key]);
        if (whiteValue) {
            sanitized.push(whiteValue);
        }
    });
    return sanitized;
}

exports.object = function sanitizeObject(object, whitelist) {
    var sanitized = {},
        whiteValue,
        key;
    for(key in object) {
        if (object.hasOwnProperty(key) && whitelist[key]) {
            whiteValue = sanitizeScalar(key, whitelist[key]);
            if (whiteValue) {
                sanitized[whiteValue] = object[key];
            }
        }
    }
    return sanitized;
}

exports.sort = function sanitizeSort(sort, whitelist) {
    var sanitized = [],
        whiteValue;
    sort.forEach(function sanitizeArrayForEach(sortRule) {
        whiteValue = sanitizeScalar(sortRule.attr, whitelist[sortRule.attr]);
        if (whiteValue) {
            sanitized.push({ attr: whiteValue, asc: sortRule.asc });
        }
    });
    return sanitized;
}

exports.scalar = sanitizeScalar = function sanitizeScalar(value, whiteValue) {
    if (!whiteValue) {
        return false;
    }
    var whiteType = typeof whiteValue;
    if (whiteType === 'string') {
        return whiteValue;
    }
    if (whiteType === 'function') {
        return sanitizeScalar(value, whiteValue(value));
    }
    return value;
}
