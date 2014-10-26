/* ========================================================================
 * DBH-PG: test
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

describe('DBH', function() {
    
    var assert = require('assert'),
        DBH = require('../'),
        Promise = require('bluebird'),
        using = Promise.using,
        db = new DBH('postgres://postgres@localhost/db2test'),
        people = [
            {name: 'Aaron',    age: 10},
            {name: 'Brian',    age: 20},
            {name: 'Chris',    age: 30},
            {name: 'David',    age: 40},
            {name: 'Elvis',    age: 50},
            {name: 'Frank',    age: 60},
            {name: 'Grace',    age: 70},
            {name: 'Haley',    age: 80},
            {name: 'Irma',     age: 90},
            {name: 'Jenny',    age: 100},
            {name: 'Kevin',    age: 110},
            {name: 'Larry',    age: 120},
            {name: 'Michelle', age: 130},
            {name: 'Nancy',    age: 140},
            {name: 'Olivia',   age: 150},
            {name: 'Peter',    age: 160},
            {name: 'Quinn',    age: 170},
            {name: 'Ronda',    age: 180},
            {name: 'Shelley',  age: 190},
            {name: 'Tobias',   age: 200},
            {name: 'Uma',      age: 210},
            {name: 'Veena',    age: 220},
            {name: 'Wanda',    age: 230},
            {name: 'Xavier',   age: 240},
            {name: 'Yoyo',     age: 250},
            {name: 'Zanzabar', age: 260}
        ];
    
    before(function() {
        
        Promise.longStackTraces();
        
        db.verbose = true;
        
        return using(db.conn(), function (conn) {
            return conn.exec(
                'create table person(\
                    id serial primary key,\
                    name varchar(10),\
                    age integer\
                )'
            ).then(function () {
                var me = this,
                prepared = DBH.prepare('insert into person(name, age) values ($name, $age)');
                return Promise.all(people.map(function (person) {
                    return me.exec(prepared(person));
                }));
            })
        });
        
    });
    
    describe('elemental', function() {
        
        it('db is instance of DBH', function() {
            assert.equal(db instanceof DBH, true);
        });
        
    });
    
    describe('#conn', function() {
        
        it('create connection', function() {
            return using(db.conn(), function (conn) {
                return true;
            });
        });
        
        it('exec "select count(age) from person" whith conn.exec', function() {
            return using(db.conn(), function (conn) {
                return conn.exec('select count(age) from person')
                    .then(function (result) {
                        assert.equal(result.rows[0].count, 26);
                    });
            });
        });
        
        it('exec "select count(age) from person" whith conn.count', function() {
            return using(db.conn(), function (conn) {
                return conn.count('person')
                    .then(function (count) {
                        assert.equal(count, 26);
                    });
            });
        });
        
        it('exec "select count(age) from person" whith conn.fetchScalar', function() {
            return using(db.conn(), function (conn) {
                return conn.fetchScalar('select count(age) from person')
                    .then(function (count) {
                        assert.equal(count, 26);
                    });
            });
        });
        
    });
    
});
