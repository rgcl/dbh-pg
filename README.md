> **WARNING!** This doc is for v2.x, the v1.x was experimental

#![BDH-PG](logo.png?raw=true)

[![NPM](https://nodei.co/npm/dbh-pg.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dbh-pg/)

[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Build Status](https://secure.travis-ci.org/sapienlab/dbh-pg.png)](http://travis-ci.org/sapienlab/dbh-pg)

Lightweight Database Handler for PostgreSQL writer upon [node-postgres][] and [bluebird](https://github.com/petkaantonov/bluebird).

##Why?
Because [node-postgres] is too low level and is not funny
to write deeply nested functions for commons task such as create transactions.

##Features
- [Promises/A+](https://promisesaplus.com/) style by [bluebird](https://github.com/petkaantonov/bluebird).
- [Full Documented API](API.md).
- [Full Tested API](test/).
- Made with simple and clean code.
- extra utils for [sanitization](API.md#sanitizejs) and [sql creation](API.md#sqljs).

## Quick examples

```javascript
// require dependences
var DBH = require('dbh-pg'),
    Promise = require('bluebird'),
    using = Promise.using;
    
// instantiate the database
var db = new DBH('postgres://postgres@localhost/db2test');

using(db.conn(), function (conn) {
    // a connection from the pool
    conn
    .fetchOne('select * from user where id=$1', [10])
    .then(function (user) {
        console.log(user); // {id:10, name:...}
    });
}); // automatic release the connection to pool
```

###Transactions

```javascript
// send 10 coins from user_id=3 to user_id=4
using(db.conn(), function (conn) {
    conn
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
        this.commit();
    });
});
```

###Parallel task

```javascript
// print array of data (from query) and the total items in the table
using(db.conn(), db.conn(), function (conn1, conn2) {
    Promise.props({
        items : conn1.fetchAll('select * from user limit 10'),
        total : conn2.fetchOne('select count(*) from user')
    })
    .then(function (data) {
        console.log(data.items, data.total); // array of objects, number
    })
});
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
    )).then(DBH.commit());
});
```

###Using objects as replacement

```javascript
// This is the first example, note that
// instead of $1 this uses $id
using(db.conn(), function (conn) {
    conn
    .fetchOne('select * from user where id=$id', {
        id : 10
    })
    .then(function (user) {
        console.log(user);
    });
});
```

###Prepared Statements

```javascript
// DBH.prepare receives a SQL statement and return function that receives the
// replacement as an array of params.
// Note that DBH.prepare can be used outside the 'using'.
var prepared = DBH.prepare('select name from city where country_code=$1');

using(db.conn(), function (conn) {
    var me = this;
    ['ar', 'cl', 'jp', 'pe', 'col'].forEach(function (code) {
        me.exec(prepared(code));
    })
});
```

##TODO

Full docs

##License

MIT

[node-postgres]: https://github.com/brianc/node-postgres
