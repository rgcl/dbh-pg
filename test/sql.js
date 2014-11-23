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

    describe('sql.js', function () {

        it('require("dbh-pg/lib/sql") equals DBH.sql', function () {
            assert.deepEqual(sqlReq, sqlProx);
        });

    });

    describe('.limit', function () {

        it('exists', function () {
            assert.equal(typeof sql.limit, 'function');
        });

        it('.limit() -> " "', function () {
            assert.equal(sql.limit(), ' ');
        });

        it('.limit(null) -> " "', function () {
            assert.equal(sql.limit(null), ' ');
        });

        it('.limit(undefined) -> " "', function () {
            assert.equal(sql.limit(undefined), ' ');
        });

        it('.limit(NaN) -> " "', function () {
            assert.equal(sql.limit(NaN), ' ');
        });

        it('.limit(Infinity) -> " "', function () {
            assert.equal(sql.limit(Infinity), ' ');
        });

        it('.limit(-Infinity) -> " "', function () {
            assert.equal(sql.limit(-Infinity), ' ');
        });

        it('.limit("los pollos hermanos") -> " "', function () {
            assert.equal(sql.limit('los pollos hermanos'), ' ');
        });

        it('.limit(true) -> " "', function () {
            assert.equal(sql.limit(true), ' ');
        });

        it('.limit(false) -> " "', function () {
            assert.equal(sql.limit(false), ' ');
        });

        it('.limit([]) -> " "', function () {
            assert.equal(sql.limit([]), ' ');
        });

        it('.limit({}) -> " "', function () {
            assert.equal(sql.limit({}), ' ');
        });
        
        it('.limit("3.2") -> " LIMIT 3 "', function () {
            assert.equal(sql.limit('3.2'), ' LIMIT 3 ');
        });
        
        it('.limit("3") -> " LIMIT 3 "', function () {
            assert.equal(sql.limit('3'), ' LIMIT 3 ');
        });

        it('.limit(3.2) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3.2), ' LIMIT 3 ');
        });

        it('.limit(-3) -> " "', function () {
            assert.equal(sql.limit(-3), ' ');
        });

        it('.limit(-3.2) -> " "', function () {
            assert.equal(sql.limit(-3.2), ' ');
        });

        it('.limit(3) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3), ' LIMIT 3 ');
        });

        it('.limit(3, null) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, null), ' LIMIT 3 ');
        });

        it('.limit(3, undefined) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, undefined), ' LIMIT 3 ');
        });

        it('.limit(3, NaN) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, NaN), ' LIMIT 3 ');
        });

        it('.limit(3, Infinity) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, Infinity), ' LIMIT 3 ');
        });

        it('.limit(3, -Infinity) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, -Infinity), ' LIMIT 3 ');
        });

        it('.limit(3, "los pollos hermanos") -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, 'los pollos hermanos'), ' LIMIT 3 ');
        });

        it('.limit(3, true) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, true), ' LIMIT 3 ');
        });

        it('.limit(3, false) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, false), ' LIMIT 3 ');
        });

        it('.limit(3, []) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, []), ' LIMIT 3 ');
        });

        it('.limit(3, {}) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, {}), ' LIMIT 3 ');
        });

        it('.limit(3, 5.2) -> " LIMIT 3 OFFSET 5 "', function () {
            assert.equal(sql.limit(3, 5.2), ' LIMIT 3 OFFSET 5 ');
        });

        it('.limit(3, -5) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, 5), ' LIMIT 3 ');
        });

        it('.limit(3, -5.2) -> " LIMIT 3 "', function () {
            assert.equal(sql.limit(3, -5.2), ' LIMIT 3 ');
        });

        it('.limit(3, "5") -> " LIMIT 3 OFFSET 5 "', function () {
            assert.equal(sql.limit(3, '5'), ' LIMIT 3 OFFSET 5 ');
        });

        it('.limit(3, "5.2") -> " LIMIT 3 OFFSET 5 "', function () {
            assert.equal(sql.limit(3, '5.2'), ' LIMIT 3 OFFSET 5 ');
        });

        it('.limit(3, 5) -> " LIMIT 3 OFFSET 5 "', function () {
            assert.equal(sql.limit(3, 5), ' LIMIT 3 OFFSET 5 ');
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
