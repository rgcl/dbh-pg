**Warning! in development**

# DBH-PG

[![Build Status](https://secure.travis-ci.org/sapienlab/dbh-pg.png)](http://travis-ci.org/sapienlab/dbh-pg)

Database Handler for PostgreSQL writer upon pg and bluebird.


## example

```javascript
var DBH = require('dbh-ph'),
    db = new DBH('postgres://postgres@localhost/db2test');
    
var nodemailer = require('nodemailer'), // no included, used for this example only
    transporter = nodemailer.createTransport(),
    sendMail = Promise.promisify(transporter.sendMail);
    
var Promise = require('bluebird');

db.conn(this /* scope */) // fetch a connection in the pool
    .then(DBH.begin) // begin transaction
    .then(DBH.fetchAll('SELECT u.email, u.amount FROM users u where u.amount > $1', [1000]))
    .then(function(users) {
    
        // create a prepared statement
        var prepared = DBH.prepare('UPDATE users SET amount = 1000 where email = $email');
        
        // create a array of promises
        var emailPromises = users.map(function(user) {
            // single promise: exec the prepared statement and then send the email
            return this.exec(prepared(user))
                .then(function() {
                    sendMail({
                        from : 'no-reply@example.com',
                        to : user.email,
                        subject : ':p',
                        text : 'You had $ '
                            + user.amount
                            + ' in your account. Sorry.'
                    })
                });
        }.bind(this));
        
        return Promise.all(emailPromises);
        
    })
    .done(DBH.commit)
    .catch(DBH.rollback)
    .finally(DBH.done); // release the connection to the pool


```

## Developing



### Tools
