
#![BDH-PG](logo.png?raw=true)

[![NPM](https://nodei.co/npm/dbh-pg.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dbh-pg/)

[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Build Status](https://secure.travis-ci.org/sapienlab/dbh-pg.png)](http://travis-ci.org/sapienlab/dbh-pg)

Lightweight Database Handler for PostgreSQL writer upon [node-postgres][] and [bluebird][].

##Why?
Because [node-postgres] is too low level and is not funny
to write deeply nested functions for commons task such as create transactions.

##Features
- [Promises/A+](https://promisesaplus.com/) style by [bluebird][].
- [Full Documented API](API.md#api-reference).
- [Full Tested API](test/).
- Made with simple and clean code.
- Extra utils for [sanitization](API.md#sanitizejs) and [sql creation](API.md#sqljs).

##Installation

The latest stable version:
```sh
$ npm install dbh-pg
```
It is recommended that you also install [bluebird][] for use `Promise.using`:
```sh
$ npm install bluebird
```
##Usage

> 1. Require the dependencies.
> 2. [Instantiate](API.md#new-dbhstring-conextionstring---object-driver----dbh) the DBH (Internally creates a connection pool).
> 3. Use [`Promise.using`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promiseusingpromisedisposer-promise-promisedisposer-promise--function-handler---promise) (or the shorhand ``DBH.using``) to get a connection from the pool and then auto release it. Is important that the callback function returns the connection promise.

```javascript
// require dependences
var DBH = require('dbh-pg'),
    Promise = require('bluebird'),
    using = Promise.using
    
// instantiate the database
var db = new DBH('postgres://postgres@localhost/db2test')

using(db.conn(), function (conn) {
    // a connection from the pool
    return conn
    .fetchOne('select * from user where id=$1', [10])
    .then(function (user) {
        console.log(user) // {id:10, name:...}
    })
}) // automatic release the connection to pool
```
[`conn.fetchOne`](API.md#fetchonestring-query---objectarray-data----promise)

###Transactions

> 1. Call `conn.begin` to start the transaction
> 2. Use the transaction
> 3. Explicit call `conn.commit`, if not auto rollback is applied before release the connection to the pool.

```javascript
// send 10 coins from user_id=3 to user_id=4
using(db.conn(), function (conn) {
    return conn
    .begin() // start transaction
    .then(function () {
        // 'this' points to the created connection 'conn'
        return this.exec(
            'update wallet \
            set coins = coins - 10 \
            where user_id=$1',
            [3]
        );
    }).then(function () {
        return this.exec(
            'update wallet \
            set coins = coins + 10 \
            where user_id=$1',
            [4]
        );
    }).then(function () {
        // commit the transaction!
        return this.commit();
    });
});
```
[`conn.begin`](API.md#begin---promise) [`conn.exec`](API.md#execstring-query---objectarray-data----promise) [`conn.commit`](API.md#commit---promise)
###Parallel task

```javascript
// print array of data (from query) and the total items in the table
using(db.conn(), db.conn(), function (conn1, conn2) {
    return Promise.join(
        conn1.fetchAll('select * from user limit 10'),
        conn2.fetchOne('select count(*) from user')
    )
    .then(function (items, total) {
        console.log(items, total) // array of objects, number
    })
})
```

###Using Shorthands

```javascript
// shorthands are static methods in the DBH 'class'.
// This is the same example used in Transaction
using(db.conn(), function (conn) {
    conn
    .begin()
    .then(DBH.exec(
        'update wallet \
        set coins = coins - 10 \
        where user_id=$1',
        [3]
    )).then(DBH.exec(
        'update wallet \
        set coins = coins + 10 \
        where user_id=$1',
        [4]
    )).then(DBH.commit())
})
```
[`DBH shorthands`](API.md#dbhshorthandargs---function)
###Using objects as replacement

```javascript
// This is the first example, note that
// instead of $1 this uses $id
using(db.conn(), function (conn) {
    return conn
    .fetchOne('select * from user where id=$id', { id : 10 })
    .then(function (user) {
        console.log(user)
    })
})
```
[`named parameterized queries`](API.md#named-placeholders)
###Prepared Statements

```javascript
// DBH.prepare receives a SQL statement and return function that receives the
// replacement as an array of params.
// Note that DBH.prepare can be used outside the 'using'.
var prepared = DBH.prepare('insert into country_code values($1)')

using(db.conn(), function (conn) {
    var me = this;
    var promises = ['ar', 'cl', 'jp', 'pe', 'co'].map(function (code) {
        return me.exec(prepared(code))
    })
    return Promise.all(promises)
})
```
[`DBH.prepare`](API.md#dbhpreparestring-query---function)
##Contributing
**We ♥ contributions**

Please create a (tested) pull request :)

##License

[MIT LICENSE](LICENSE)

[node-postgres]: https://github.com/brianc/node-postgres#node-postgres
[bluebird]: https://github.com/petkaantonov/bluebird#introduction
