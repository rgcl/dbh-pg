
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
        return checkWhitelist(value, whiteValue(value));
    }
    return value;
}
