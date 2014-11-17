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

        it('.array([], {}) -> []', function() {
            assert.equal(sanitize.array([], {}), []);
        });

        it('.array([], { name: 1 }) -> []', function() {
            assert.equal(sanitize.array([], { name: 1}), []);
        });

        it(".array(['name'], { name: 1 }) -> ['name']", function() {
            assert.equal(sanitize.array(['name'], { name: 1 }), ['name']);
        });

        it(".array(['name'], { name: 0 }) -> ['name']", function() {
            assert.equal(sanitize.array(['name'], { name: 0 }), []);
        });

        it(".array(['name', 'color'], { name: 0, color: 1 }) -> ['color']", function() {
            assert.equal(sanitize.array(['name', 'color'], { name: 0, color: 1 }), ['color']);
        });

        it(".array(['name'], { name: '\"u\".\"name\"' }) -> ['\"u\".\"name\"']", function() {
            assert.equal(sanitize.array(['name'], { name: '"u"."name"' }), ['"u"."name"']);
        });

        it(".array(['name'], { name: fn(val) -> 1 }) -> ['name']", function() {
            assert.equal(
                sanitize.array(['name'], { name: function (val) { return true; } })
                , ['name']
            );
        });

        it(".array(['name'], { name: fn(val) -> 0 }) -> []", function() {
            assert.equal(
                sanitize.array(['name'], { name: function (val) { return false; } })
                , []
            );
        });

        it(".array(['name'], { name: fn(val) -> 'prefix_' + val }) -> ['prefix_name']", function() {
            assert.equal(
                sanitize.array(['name'], { name: function (val) { return 'prefix_' + val; } })
                , ['prefix_name']
            );
        });

    });
    
    describe('.object', function () {

        it('exists', function() {
            assert.ok(typeof sanitize.object === 'function');
        });

        it('.object({} {}) -> []', function() {
            assert.equal(sanitize.object({}, {}), {});
        });

        it('.object({} { name: 1 }) -> {}', function() {
            assert.equal(sanitize.object({}, { name: 1}), {});
        });

        it(".object({ name: 'pepe' }, { name: 1 }) -> { name: 'pepe' }", function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: 1 })
                , { name: 'pepe' }
            );
        });

        it(".object({ name: 'pepe' }, { name: 0 }) -> {}", function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: 0 })
                , {}
            );
        });

        it(".object({ name: 'pepe', color: 'red' }, { name: 0, color: 1 }) -> { color: 'red' }", function() {
            assert.equal(
                sanitize.object({ name: 'pepe', color: 'red' } , { name: 0, color: 1 })
                , { color: 'red' }
            );
        });

        it(".object({ name: 'pepe' }, { name: '\"u\".\"name\"' }) -> { '\"u\".\"name\"': 'pepe' }", function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: '"u"."name"' })
                , { '"u"."name"': 'pepe' }
            );
        });

        it(".object({ name: 'pepe' }, { name: fn(val) -> 1 }) -> { name: 'pepe' }", function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: function (val) { return true; } })
                , { name: 'pepe' }
            );
        });

        it(".object({ name: 'pepe' }, { name: fn(val) -> 0 }) -> {}, function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: function (val) { return false; } })
                , {}
            );
        });

        it(".object({ name: 'pepe }, { name: fn(val) -> 'prefix_' + val }) -> { prefix_name: 'pepe' }", function() {
            assert.equal(
                sanitize.object({ name: 'pepe' }, { name: function (val) { return 'prefix_' + val; } })
                , { prefix_name: 'pepe' }
            );
        });

    });

    describe('.sort', function () {

        it('exists', function() {
            assert.ok(typeof sanitize.sort === 'function');
        });

        it('.sort([], {}) -> []', function() {
            assert.equal(sanitize.sort([], {}), []);
        });

        it('.sort([], { name: 0 }) -> []', function() {
            assert.equal(sanitize.sort([], { name: false }), []);
        });

        it('.sort([], { name: 1 }) -> []', function() {
            assert.equal(sanitize.sort([], { name: true }), []);
        });

        it(".sort([{ attr: 'name' }], { name: 1 }) -> [{ attr: 'name', asc: undefined }]", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }], { name: 1 })
                , [{ attr: 'name', asc: undefined }]
            );
        });

        it(".sort([{ attr: 'name' }], { name: 0 }) -> []", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }], { name: 0 })
                , []
            );
        });

        it(".sort([{ attr: 'name' }, { attr: 'color', asc: false }], { name: 0, color: 1 }) -> \
            [{ attr: 'color', asc: false }]", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }, { attr: 'color', asc: false }] , { name: 0, color: 1 })
                , [{ attr: 'color', asc: false }]
            );
        });

        it(".sort([{ attr: 'name' }, { name: '\"u\".\"name\"' }) -> [{ attr: '\"u\".\"name\"' }]", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }], { name: '"u"."name"' })
                , [{ attr: '"u"."name"', asc: undefined }]
            );
        });

        it(".sort([{ attr: 'name' }], { name: fn(val) -> 1 }) -> [{ name: 'pepe' }]", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }], { name: function (val) { return true; } })
                , [{ attr: 'name', asc: undefined }]
            );
        });

        it(".sort([{ attr: name: 'pepe' }], { name: fn(val) -> 0 }) -> []", function() {
            assert.equal(
                sanitize.sort([{ attr: 'name' }], { name: function (val) { return false; } })
                , []
            );
        });

        it(".sort([{ attr: 'name' }], { name: fn(val) -> 'prefix_' + val }) -> [{ attr: 'prefix_name' }]", function() {
            assert.equal(
                sanitize.object([{ attr: 'name' }], { name: function (val) { return 'prefix_' + val; } })
                , [{ attr: 'prefix_name', asc: undefined }
            );
        });

    });

});
