/* ========================================================================
 * DBH-PG: test
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */
'use strict';

var assert = require('assert'),
    DBH = require('../'),
    Promise = require('bluebird');
    db,
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

describe('DBH', function() {
    
    describe('Instantiate BDH', function() {
        
        it('instantiate DBH to db', function() {
            db = new DBH({
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
        
        it('connecting', function(testDone) {
            db.conn().done(function() {
                testDone();
            }).catch(function(err) {
                throw err;
            }).finally(DBH.done);
        });
        
    });
    
    describe('Creating tables', function() {
        
        it('Creating table person', function(testDone) {
            
            db.conn().then(DBH.exec(
                'create table person(\
                    id serial primary key,\
                    name varchar(10),\
                    age integer\
                )'
            )).done(function() {
                testDone();
            }).catch(function (err) {
                throw err;
            }).finally(DBH.done);
            
        });
        
        it('Adding some data', function(testDone) {
            
            db.conn(this).then(function() {
                var me = this,
                    prepared = DBH.prepare('insert into person(name, age) values ($1, $2)');
                return Promise.all(people.map(function(person) {
                    return me.exec(prepared(person.name, person.age));
                }));
            }).done(function () {
                testDone();
            }).catch(function(err) {
                throw err;
            }).finally(db.done);
        });
        
    });
    
});
