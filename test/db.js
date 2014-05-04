/* ========================================================================
 * DBH-PG: test
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var assert = require("assert");
var DBH = require('../');

describe('DBH', function() {
    describe('Instantiate BDH', function() {
        
        it('instantiate DBH to db', function() {
            var db = new BDH({
                host: process.argv[2] || 'localhost',
                port: process.argv[3] || '5432',
                user: process.argv[4] || 'postgres',
                password: process.argv[5] || null,
                database: process.argv[6] || 'db2test'
            });
        });
        
        it('db is instance of DBH', function() {
            assert.equal(db instanceof DBH, true);
        });
    });
});
