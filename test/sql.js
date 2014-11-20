/* ========================================================================
 * DBH-PG: test sql.js
 * ========================================================================
 * Copyright 2014 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE (SEE LICENSE)
 * ======================================================================== */
'use strict';

describe('DBH', function () {

    var assert = require('assert'),
        DBH = require('../'),
        sqlReq = require('../lib/sql'),
        sqlProx = DBH.sql,
        sql = sqlReq;

    before(function () {
        
    });

    describe('sql.js', function () {

        it('require("dbh-pg/lib/sql") equals DBH.sql', function () {
            assert.deepEqual(sqlReq, sqlProx);
        });

    });

    describe('.limit', function () {

        it('exists', function () {
            assert.equal(typeof sql.limit, 'function');
        });

        it('.limit(3) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3), ' LIMIT 3 ');
        });

        it('.limit(3, 5) -> " LIMIT 3 OFFSET 5 "', function () {
            assert.equal(sql.limit(3, 5), ' LIMIT 3 OFFSET 5 ');
        });

        it('.limit({}) -> " "', function () {
            assert.equal(sql.limit({}), ' ');
        });

        it('.limit({ limit: 1 }) -> " LIMIT 1 "', function () {
            assert.equal(sql.limit({ limit: 1 }), ' LIMIT 1 ');
        });

        it('.limit({ limit: 1, offset: 3 }) -> " LIMIT 1 OFFSET 3 "', function () {
            assert.equal(sql.limit({ limit: 1, offset: 3 }), ' LIMIT 1 OFFSET 3 ');
        });

        it('.limit({ offset: 3 }) -> " "', function () {
            assert.equal(sql.limit({ offset: 3 }), ' ');
        });

    });

});
