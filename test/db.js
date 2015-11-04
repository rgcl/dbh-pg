/* ========================================================================
 * DBH-PG: test
 * ========================================================================
 * Copyright 2014 Sapienlab
 * Licensed under MIT (https://github.com/sapienlab/dbh-pg/blob/master/LICENSE)
 * ======================================================================== */


describe('DBH', function() {
    'use strict';
    
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
                prepared = DBH.prepare('insert into person(name, age) values ($1, $2)');
                return Promise.all(people.map(function (person) {
                    return me.exec(prepared([person.name, person.age]));
                }));
            });
        });
        
    });
    
    describe('elemental', function() {
        
        it('db is instance of DBH', function() {
            assert.equal(db instanceof DBH, true);
        });

        it('DBH.using is strict equals Promise.using', function() {
            assert.equal(DBH.using === Promise.using, true);
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
    
    describe('transactions', function () {

        it('without commit', function() {
            var id = 2,
                oldName = 'Old Name',
                newName = 'New Name',
                query = 'select name from person where id=' + id;
            return using(db.conn(), function (conn) {
                return conn.update('person', { name: oldName }, { id : id })
                    .then(DBH.fetchScalar(query))
                    .then(function (name) {
                        assert.equal(name, oldName);
                    })
                    .then(DBH.begin()) // start transaction
                    .then(DBH.update('person', { name: newName }, { id: id }));
                // because not commit is here, then auto rollback must be called
            }).then(function () {
                return using(db.conn(), function (conn) {
                    return conn.fetchScalar(query)
                        .then(function (name) {
                            assert.equal(oldName, name);
                            assert.notEqual(name, newName);
                        });
                });
            });
        });
        
        it('with commit', function() {
            var id = 3,
                oldName = 'Old Name',
                newName = 'New Name',
                query = 'select name from person where id=' + id;
            return using(db.conn(), function (conn) {
                return conn.update('person', { name: oldName }, { id : id })
                    .then(DBH.fetchScalar(query))
                    .then(function (name) {
                        assert.equal(name, oldName);
                    })
                    .then(DBH.begin()) // start transaction
                    .then(DBH.update('person', { name: newName }, { id: id }))
                    .then(DBH.commit());
            }).then(function () {
                return using(db.conn(), function (conn) {
                    return conn.fetchScalar(query)
                        .then(function (name) {
                            assert.notEqual(oldName, name);
                            assert.equal(name, newName);
                        });
                });
            });
        });

    });

    describe('fetchOne', function () {

        var person1 = people[0];
        person1.id = 1;

        it('simple', function() {
            return using(db.conn(), function(conn) {
                return conn.fetchOne('select id, name, age from person where id=1');
            }).then(function(person) {
                assert.deepEqual(person, person1);
            });
        });

        it('named param', function() {
            return using(db.conn(), function(conn) {
                return conn.fetchOne('select id, name, age from person where id=$id', { id: 1 });
            }).then(function(person) {
                assert.deepEqual(person, person1)
            });
        });

        it('numeric param', function() {
            return using(db.conn(), function(conn) {
                return conn.fetchOne('select id, name, age from person where id=$1', [1]);
            }).then(function(person) {
                assert.deepEqual(person, person1)
            });
        });

        it('first', function() {
            return using(db.conn(), function(conn) {
                return conn.fetchOne('select id, name, age from person');
            }).then(function(person) {
                assert.deepEqual(person, person1)
            });
        });
        it('not exists', function() {
            return using(db.conn(), function(conn) {
                return conn.fetchOne('select id, name, age from person where id=99999');
            }).then(function(person) {
                assert.deepEqual(person, null)
            });
        });

    });
    
});
