

#![BDH-PG](logo.png?raw=true)

[![NPM](https://nodei.co/npm/dbh-pg.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dbh-pg/)

[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Build Status](https://secure.travis-ci.org/sapienlab/dbh-pg.png)](http://travis-ci.org/sapienlab/dbh-pg)

Database Handler for PostgreSQL writer upon [pg](https://github.com/brianc/node-postgres) and [bluebird](https://github.com/petkaantonov/bluebird).

## Quick example

```javascript
// require dependences
var DBH = require('dbh-pg'),
    Promise = require('bluebird'),
    using = Promise.using;
    
// instantiate the database
var db = new DBH('postgres://postgres@localhost/db2test');

using(db.conn(), function (conn) {
    // a connection from the poll
    conn
    .fetchOne('select * from user where id=$1', [10])
    .then(function (user) {
        console.log(user); // {id:10, name:...}
    });
}); // automatic release the connection to poll
```

### Transactions

```javascript
// send 10 coins from user_id=3 to user_id=4
using(db.conn(), function (conn) {
    conn
    .begin() // start transaction
    .then(function () {
        // 'this' point to the created connection 'conn'
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

## Parallel task

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

## Using Shorthands

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
    )).then(DBH.commit);
    // noted that is DBH.commit, not DBH.commit()
});
```

## Using objects as replacement

```javascript
// This is the first example, note that
// instead $1, uses $id
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

## Prepared Statements

```javascript
// DBH.prepare recibe a SQL and return function that recibe the
// replacement as array or params.
// Note that DBH.prepare can be used outside the 'using'.
var prepared = DBH.prepare('select name from city where country_code=$1');

using(db.conn(), function (conn) {
    var me = this;
    ['ar', 'cl', 'jp', 'pe', 'col'].forEach(function (code) {
        me.exec(prepared(code));
    })
});
```

## Complex example

```javascript
// limit the amount of users to 1000 and send an email
// notifying affected users in a transaction.
var DBH = require('dbh-ph'),
    Promise = require('Promise'),
    using = Promise.using,
    db = new DBH('postgres://postgres@localhost/db2test');
    
var nodemailer = require('nodemailer'), // no included, used for this example only
    transporter = nodemailer.createTransport(),
    sendMail = Promise.promisify(transporter.sendMail);
    
using(db.conn(), function (conn) {

    var updateAmountTo1000 = DBH.prepare(
        'update user set amount = 1000 where email=$email'
    );
    
    conn
    .begin()
    .then(DBH.fetchAll('select email, amount from user where amount > $1', [1000]))
    .then(function (users) {
        // map is because users is an array
        var promises = users.map(function (user) {
            return this.exec(updateAmountTo1000(user))
                .then(function () {
                    sendMail({
                        from : 'no-reply@example.com',
                        to : user.email,
                        subject : ':P',
                        text : 'You had $ '
                            + user.amount
                            + ' in your account. Sorry'
                    })
                });
        }.bind(this));
        
        return Promise.all(promises);
    })
    .then(DBH.commit);
    
});
```

## TODO

Full docs

## License

MIT
