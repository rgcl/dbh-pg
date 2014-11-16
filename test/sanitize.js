/* ========================================================================
 * DBH-PG: sanitize.js
 * ========================================================================
 * Copyright 2014 Sapienlab, Rodrigo González and Contributors.
 * Licensed under MIT LICENSE (SEE LICENSE)
 * ======================================================================== */
'use strict';

describe('DBH', function () {

    var assert = require('assert'),
        DBH = require('../'),
        sanitizeReq = require('../sanitize'),
        sanitizeProx = DBH.sanitize,
        sanitize = sanitizeReq;

    before(function () {
        
    });

    describe('sanitize.js', function () {

        it('require("dbh-pg/lib/sanitize") equals DBH.sanitize', function () {
            assert.deepEqual(sanitizeReq, sanitizeProx);
        });

    });

    describe('.escape', function () {

        it('exists', function () {
            assert.ok(typeof sanitize.escape === 'function');
        });

        it(".escape('Super') -> 'Super'", function () {
            assert:equal(sanitize.escape('Super'), 'Super');
        });
        
        it('\0 gets escaped'), function() {
            assert.equal(sanitize.escape('Sup\0er'), "Sup\\0er");
        });

        it('\b gets escaped', function() {
            assert.equal(sanitize.escape('Sup\ber'), "Sup\\ber");
        });

        it('\n gets escaped', function() {
            assert.equal(sanitize.escape('Sup\ner'), "'Sup\\ner'");
        });

        it('\r gets escaped', function() {
            assert.equal(sanitize.escape('Sup\rer'), "'Sup\\rer'");
        });

        it('\t gets escaped', function() {
            assert.equal(sanitize.escape('Sup\ter'), "'Sup\\ter'");
        });

        it('\\ gets escaped', function() {
            assert.equal(sanitize.escape('Sup\\er'), "'Sup\\\\er'");
        });

        it('\u001a (ascii 26) gets replaced with \\Z', function() {
            assert.equal(sanitize.escape('Sup\u001aer'), "'Sup\\Zer'");
        });

        it('single quotes get escaped', function() {
            assert.equal(sanitize.escape('Sup\'er'), "'Sup\\'er'");
        });

        it('double quotes get escaped': function() {
            assert.equal(sanitize.escape('Sup"er'), "'Sup\\\"er'");
        });

    });
    
    describe('.array', function () {

        it('exists', function() {
            assert.ok(typeof sanitize.array === 'function');
        });

    });

});
