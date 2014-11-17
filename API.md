> **WARNING: Work in progress.** 

> Note: This documentation is for dbh-pg v2.x . The v1.x was never documented and is deprecated.

#API Reference

- [Concepts](#concepts)
  - [parameterized query](#parameterized-queries)
  - [query object](#query-object)
  - [sortRule object](#sortrule-object)
  - [promises](#promises)
  - [security](#security)
- [Classes](#classes)
  - [DBH](#dbh)
    - [`object DBH.sanitize`](#object-dbhsanitize)
    - [`object DBH.sql`](#object-dbhsql)
    - [`DBH.prepare(string query)  -> Function`](#dbhpreparestring-query---function)
    - [`DBH.{shorthand}({args})  -> Function`](#dbhshorthandargs---function)
    - [`new DBH(string conextionString [ , object driver ]) -> DBH`](#new-dbhstring-conextionstring---object-driver----dbh)
    - [`new DBH(object settings [ , object driver ]) -> DBH`](#new-dbhobject-settings---object-driver----dbh)
    - [`.conn([ object scope ]) -> Promise`](#conn-object-scope----promise)
  - [Connection](#connection)
    - [`.exec(string query [ , object|array data ]) -> Promise`](#execstring-query---objectarray-data----promise)
    - [`conn.exec(object query) -> Promise`](#connexecobject-query---promise)
    - [`.fetchOne(string query [ , object|array data ]) -> Promise`](#fetchonestring-query---objectarray-data----promise)
    - [`.fetchAll(string query [ , object|array data ]) -> Promise`](#fetchallstring-query---objectarray-data----promise)
    - [`.fetchColumn(string query [ , object|array data, [ string columnName ] ]) -> Promise`](#fetchcolumnstring-query---objectarray-data--string-columnname-----promise)
    - [`.fetchScalar(string query [ , object|array data, [ string columnName ] ]) -> Promise`](#fetchscalarstring-query---objectarray-data--string-columnname-----promise)
    - [`.insert(string table, object row [ , string returning ]) -> Promise`](#insertstring-table-object-row---string-returning----promise)
    - [`.update(string table, object data, object where [ , string returning ]) -> Promise`](#updatestring-table-object-data-object-where---string-returning----promise)
    - [`.delete(string table, object where [ , string returning ]) -> Promise`](#deletestring-table-object-where---string-returning----promise)
    - [`.exists(string table, object where) -> Promise`](#existsstring-table-object-where---promise)
    - [`.count(string table [ , object where ]) -> Promise`](#countstring-table---object-where----promise)
    - [`.begin() -> Promise`](#begin---promise)
    - [`.commit() -> Promise`](#commit---promise)
    - [`.rollback() -> Promise`](#rollback---promise)
- [utils](#utils)
  - [sanitize.js](#sanitizejs)
    - [`.escape(string sql) -> string`](#escapestring-sql---string)
    - [`.array(array array, object whitelist) -> array`](#arrayarray-array-object-whitelist---array)
    - [`.object(object object, object whitelist) -> object`](#objectobject-object-object-whitelist---object)
    - [`.sort(object sort, object whitelist) -> object`](#sortobject-sort-object-whitelist---object)
  - [sql.js](#sqljs)
    - [`.limit(int limit [, int offset ]) -> string`](#limitint-limit---int-offset----string)
    - [`.limit(object ctx) -> string`](#limitobject-ctx---string)
    - [`.orderBy(array sort) -> string`](#orderbyarray-sort---string)
    - [`.orderBy(object ctx) -> string`](#orderbyobjectctx---string)
    - [`.toNamed(object object [ , string separator [ , string inSeparator ] ]) -> string`]()
    - [`.toIndexed(object object, array refArray [ , string separator [ , string inSeparator ] ]) -> string`]()

##Concepts

###Parameterized Queries
Consists in SQL commands string as `'insert into book (name, author_id) values ($1, $2) '`
in which `$1` and `$2` are placeholders that must be replaced with the real values by the library.

####Placeholders types

#####Index placeholders
`$1`, `$2`, `...` uses an array for replacement.
######Example
```javascript
'select * from animals where type=$1 and stains > $2'
```
```javascript
['cat', 3]
```
> `$1` is for the 0-index position in the array.

#####Named placeholders
`$name`, `$author_id`, etc. Uses an plain object for replacement.
######Example
```javascript
'select * from animals where type=$type and stains > $stains'
```
```javascript
{ type: 'cat', stains: 3 }
```

> Named placeholders have not natively support by PostgreSQL therefore are bypass by the library.

####why?
For security reasons. The library uses Prepared Statements and therefore help to be secure against [SQL Injection](http://en.wikipedia.org/wiki/SQL_injection).
___

###Query Object

Is a plain object with these parameters:
- *optional string* **name**: If is given the created query uses a [prepared statement](https://github.com/brianc/node-postgres/wiki/Client#prepared-statements).
- *string* **text**: The SQL command. Can be an [```index parameterized query```](#index-placeholders) query.
- *optional array* **values**: An array of string values for replace in the ```text```. Default ```[]```.

This object is used by the native [pg][] module.

> *named query object* is a query object in that the `name` is not empy.

___

###sortRule Object

Is a plain object with these parameters:
- *string* **attr**: The attribute name.
- *optional boolean* **asc**: `true` is the sort is ascending, `false` is is descending. Default `true`.

This object is used by [`sql.orderBy`](#orderbyarray-sort---string).

###Promises
TODO
___

###Security
TODO
___

##Classes
___

###DBH
```var DBH = require('dbh-pg')```
___

####```object DBH.sanitize```
Proxy to [```sanitize```](#sanitizejs).
####```object DBH.sql```
Proxy to [```sql```](#sqljs).
___

####```DBH.prepare(string query) -> Function```
Creates a function that return a named [```query object```](#query-object), 
useful for use Prepared Statements.

- *string* **query**
  - an [```index parameterized query```](#index-placeholders). 

Returns a *function* in which the parameters are the index placeholders and return a named [```query object```](#query-object).

> **See:** [pg docummentation about prepared statement](https://github.com/brianc/node-postgres/wiki/Client#queryobject-config-optional-function-callback--query)

#####Examples:
Creates a function getAccount(id, pass):
```javascript
var getAccount = DBH.prepare('select * from account where name=$1 and pass=$2')
```
Calling the generated function return the named query object:
```javascript
getAccount('admin', 'admin123')
-> { name: '...', text: 'select * from account where name=$1 and pass=$2', 
values: ['admin', 'admin123'] }
```
The function returned can be use with conn.exe(query) method:
```javascript
using(dbh.conn(), function (conn) {
    return conn.exec( getAccount( 'mail@example.com', 'abc123') )
})
```
_____

####```DBH.{shorthand}({args}) -> Function```

The DBH shorthands are utilities functions for the [```Connection```](#connection)
methods.

Each shorthands returns a function that can be used as [```fulfilledHandler```](https://github.com/petkaantonov/bluebird/blob/master/API.md#thenfunction-fulfilledhandler--function-rejectedhandler----promise) in a promise.

```javascript
DBH.{shorthand}({args})
-> function () {  return this.{shorthand}({args}) }
```
#####Examples:
**With shorthand (count)**
```javascript
using(dbh.conn(), function (conn) {
    return conn
        .insert('animal', { name: 'Cenala', type: 'cat' })
        .then(DBH.count('animals')) // shorthand count
})
```
**Without shorthand**
```javascript
using(dbh.conn(), function (conn) {
    return conn
        .insert('animal', { name: 'Cenala', type: 'cat' })
        .then(function () {
            return this.count('animals')
        })
})
```
#####All Shorthands

| DBH                | Shorthand to...   
|--------------------|-------------------
| `DBH.*exec*`       | [`.exec`](#execstring-query---objectarray-data----promise)
| `DBH.*fetchOne*`   | [`.fetchOne`](#fetchonestring-query---objectarray-data----promise)
| `DBH.*fetchAll*`   | [`.fetchAll`](#fetchallstring-query---objectarray-data----promise)
| `DBH.*fetchColumn*`| [`.fetchColumn`](#fetchcolumnstring-query---objectarray-data--string-columnname-----promise)
| `DBH.*fetchScalar*`| [`.fetchScalar`](#fetchscalarstring-query---objectarray-data--string-columnname-----promise)
| `DBH.*insert*`     | [`.insert`](#insertstring-table-object-row---string-returning----promise)
| `DBH.*update*`     | [`.update`](#updatestring-table-object-data-object-where---string-returning----promise)
| `DBH.*delete*`     | [`.delete`](#deletestring-table-object-where---string-returning----promise)
| `DBH.*exists*`     | [`.exists`](#existsstring-table-object-where---promise)
| `DBH.*count*`      | [`.count`](#countstring-table---object-where----promise)
| `DBH.*begin*`      | [`.begin`](#begin---promise)
| `DBH.*commit*`     | [`.commit`](#commit---promise)
| `DBH.*rollback*`   | [`.rollback`](#rollback---promise)
| `DBH.*done*`       | `.done`


_____

####```new DBH(string conextionString [ , object driver ]) -> DBH```
Instantiates the database handler.

- *string* **conextionString**
  - a connection string in the format ```anything://user:password@host:port/database```
  - a socket path, like ```/var/run/postgresql```
  - a socket path, with a specific database, ```like /var/run/postgresql a_db_name```
  - a socket connection string ```socket:/some/path/?db=database_name&encoding=utf8```
- *optional object* **driver**
  - The result of call ```require('pg')```.

DBH is a lightweight wrapper to [```pg```](https://github.com/brianc/node-postgres) module.
This use a [pool of connections](https://github.com/brianc/node-postgres#client-pooling).

#####Example:
```javascript
var dbh = new DBH('postgres://postgres@localhost/my_db')
```
_____

####```new DBH(object settings [ , object driver ]) -> DBH```
Instantiates the database handler.

- *object* **settings**:
  - *optional string* **.user**:
    - default value: `process.env.USER`
    - PostgreSQL user
  - *optional string* **.password**:
    - default value: `null`
    - user's password for PostgreSQL server
  - *optional string* **.database**:
    - default value: `process.env.USER`
    - database to use when connecting to PostgreSQL server
  - *optional int* **.port**:
    - default value: `5432`
    - port to use when connecting to PostgreSQL server
  - *optional string* **.host**:
    - default value: `null`
    - host address of PostgreSQL server
  - *optional bool* **.ssl**:
    - default value: `false`
    - whether to try SSL/TLS to connect to server
- *optional object* **driver**
  - The result of call ```require('pg')```.

#####Example:
```javascript
var dbh = new DBH({
  user: 'myuser',
  password: 'mypass',
  database: 'mydatabase'
})
```
_____

###```.conn([ object scope ]) -> Promise```
Get a connection from the pool.

- *optional object* **scope**
  - default value: ```{}```
  - The value that is in ```.scope``` in ever promise callback.

When you call ```dbh.conn()``` you get a promise that will be fulfilled when 
a connection from the pool of connections is released.

Is **extremely important** that the last promise call the [```.done```]() method.

```javascript
dbh.conn()
    .exec(...)
    .then(DBH.update(...))
    .then(DBH.done, DBH.done) // Here we call the .done
                              // then the connection is
                              // release to the
                              // connection pool
```

The best way to do this is using [```Promise.using```](https://github.com/petkaantonov/bluebird/blob/master/API.md#promiseusingpromisedisposer-promise-promisedisposer-promise--function-handler---promise),
therefore the ```conn.done``` is called automatically.

####Examples:
#####Base:
```javascript
// note that "using" is for "Promise.using"
var DBH = require('dbh-pg'),
    Promise = require('bluebird'),
    using = Promise.using;

using(dbh.conn(), function (conn) {
    // here we have the conn (Connection) object
    
    // You can use the Connection methods, and
    // EVER return the promise
    return conn;
    // or "return conn.exec(DBH.count('users'))", etc...
})
```
#####Using scope:
```javascript

this.hi = 'hello'

using(dbh.conn(this), function (conn) {
    return conn.count('users')
        .then(function () {
            console.log(this.scope.hi)
            // output: 'hello'
        })
})
```

_____

##Connection
_____

###```.exec(string query [ , object|array data ]) -> Promise```
Send the given SQL query to the database.

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)

Returns a object with this parameters:
- *string* **command**:
  - The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
- *int* **rowCount**:
  - The number of rows affected by the SQL statement [(more information)](http://www.postgresql.org/docs/8.1/static/libpq-exec.html#LIBPQ-EXEC-NONSELECT)
- **oid**:
  - the oid returned
- *array* **rows**:
  - an array of rows

####Example:
#####Simple Query:
```javascript
conn
.exec('select * from book where price <= 20.0')
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
#####[Indexed Parameterized Query]()
```javascript
conn
.exec('select * from book where price <= $1', [20.0])
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
#####[Named Parameterized Query]()
```javascript
conn
.exec('select * from book where price <= $price', { price: 20.0 })
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
_____

###```conn.exec(object query) -> Promise```
Execute the query.

> **See:** [query object]()

```javascript
conn
.exec({
    text: 'select * from book where author_id=$1',
    values : [ 32 ]
})
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], count: 1,  }
})
```
___

###`.fetchOne(string query [ , object|array data ]) -> Promise`
Shortcut to `result.rows[0]` of [`.exec`]()

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)

Returns the first tupla as ```object```.

####Example
#####With `.fetchOne`
```javascript
using(dbh.conn(), function (conn) {
  conn.fetchOne(
    'select * from planet where habitants > $1 limit 1'
    , [3000]
  )
  .then(function (planet) {
    console.log(planet)
    // { name: 'Kolobo', habitants:... }
  })
})
```
#####Without `.fetchOne`
```javascript
using(dbh.conn(), function (conn) {
  conn.exec(
    'select * from planet where habitants > $1 limit 1'
    , [3000]
  )
  .then(function (result) {
    return result.rows[0]
  })
  .then(function (planet) {
    console.log(planet)
    // { name: 'Kolobo', habitants:... }
  })
})
```

> **tip:** Use `LIMIT 1` in the SQL. `.fetchOne` not add this for you.

___

###`.fetchAll(string query [ , object|array data ]) -> Promise`
Shortcut to `result.rows` of [`.exec`]()

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)

Returns an array of tuplas.

####Example
#####With `.fetchAll`
```javascript
using(dbh.conn(), function (conn) {
  conn.fetchAll('select * from planet where habitants > $1', [3000])
    .then(function (planets) {
      console.log(planets)
      // [{ name: 'Kolobo', habitants:... }, ...]
    })
})
```
#####Without `.fetchAll`
```javascript
using(dbh.conn(), function (conn) {
  conn.exec('select * from planet where habitants > $1', [3000])
    .then(function (result) {
      return result.rows
    })
    .then(function (planets) {
      console.log(planets)
      // [{ name: 'Kolobo', habitants:... }, ...]
    })
})
```
___
###`.fetchColumn(string query [ , object|array data, [ string columnName ] ]) -> Promise`

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)
- *optional string* **columnName**
  - default: the first key in `Object.keys(result.row[0])`
  - The name of the column to return.

In this query:
```sql
SELECT name FROM account
```
The `result.rows` is:
```
[{ name: 'Name1'}, { name: 'Name2' }, { name: 'Name3' }, ...]
```
Instead, fetchColumn returns
```
[ 'Name1', 'Name2', 'Name3', ...]
```

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.fetchColumn('select name from planet where habitants > $1', [3000])
    .then(function (planets) {
      console.log(planets)
      // [ 'Kolobo', 'Saturn', 'Ponnyland' ]
    })
})
```
___
###`.fetchScalar(string query [ , object|array data, [ string columnName ] ]) -> Promise`
Shortcut to `result.rows[0][columnName]` of [`.exec`]()

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)
- *optional string* **columnName**
  - default: the first key in `Object.keys(result.row[0])`
  - The name of the column to return.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.fetchScalar('select name from planet where habitants > $1 limit 1', [3000])
    .then(function (name) {
      console.log(name)
      // 'Kolobo'
    })
})
```
___
###`.insert(string table, object row [ , string returning ]) -> Promise`
Insert the `row` in the `table`.

- *string* **table**:
  - the name of the table in the database.
- *object* **row**:
  - Te row to insert.
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.insert('planet', { name: 'Mart', habitants: 343 }, 'id')
    .then(function (id) {
      console.log(id)
      // 435
    })
})
```
___
###`.update(string table, object data, object where [ , string returning ]) -> Promise`
Update the `table` with the `data` where match `where`.

- *string* **table**:
  - the name of the table in the database.
- *object* **data**:
  - the data to update.
- *object* **when**
  - the values to match for updating. e.g. `{ id: 3 }`
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

If `returning` is *undefined*, then return the number of affected rows, 
otherwise an *array* with the affected rows.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.update(
    'planet'
    , { name: 'Mart', habitants: 0 }
    , { id: 435 }
  )
})
```
___
###`.delete(string table, object where [ , string returning ]) -> Promise`
Update the `table` with the `data` where match `where`.

- *string* **table**:
  - the name of the table in the database.
- *object* **data**:
  - the data to update.
- *object* **where**
  - the values to match for updating. e.g. `{ id: 3 }`
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

If `returning` is *undefined*, then return the number of affected rows, 
otherwise an *array* with the affected rows.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.update(
    'planet'
    , { name: 'Mart', habitants: 0 }
    , { id: 435 }
  )
})
```
___
###`.exists(string table, object where) -> Promise`
Shortcut for the SQL:
```sql
SELECT EXIST (SELECT 1 FROM {table} where {where})
```

- *string* **table**:
  - the name of the table in the database.
- *object* **where**
  - the values to match e.g. `{ id: 3 }`

Return *boolean* `true` the item exitst, `false` otherwise.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.exists('planet', { id: 1234 })
})
.then(function (exists) {
  console.log(exists)
  // true or false
})
```
___
###`.count(string table [ , object where ]) -> Promise`
Count the rows in the table

- *string* **table**:
  - the name of the table in the database.
- *optional object* **where**
  - default: `{}`
  - the values to match to filter rows e.g. `{ color: 'red' }`

Return the number of item that match the `where` condition.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.count('planet') // count all planets
})
.then(function (count) {
  console.log(count)
  // 342
})
```
___
###`.begin() -> Promise`
Start a transaction.

If you not call [`.commit]() then the transaction is auto rollback by the library.

> **See:** [Transactions in PostgreSQL](http://www.postgresql.org/docs/8.3/static/tutorial-transactions.html)

####Example
```javascript
// send $10.00 from id=10 to id=11
using(dbh.conn(), function (conn) {
  return conn
  .begin() // start a transaction.
  .then(DBH.exec(
    'update wallet \
    set balance=balance-10 where id=10'
  ))
  .then(DBH.exec(
    'update wallet set \
    balance=balance+10 where id=11'
  ))
  .then(DBH.commit())
})
```
[`test`]() [`test autorollback`]()
___

###`.commit() -> Promise`
Commit a transaction.

Before you must to call [`.begin`]().
If you not call [`.commit]() then the transaction is auto rollback by the library.

> **See:** [Transactions in PostgreSQL](http://www.postgresql.org/docs/8.3/static/tutorial-transactions.html)

####Example
```javascript
using(dbh.conn(), function (conn) {
  return conn
  .begin() // start a transaction.
  .then(DBH.exec(
    'update wallet \
    set balance=balance-10 where id=10'
  ))
  .then(DBH.exec(
    'update wallet set \
    balance=balance+10 where id=11'
  ))
  .then(DBH.commit()) // commit the transaction
})
```
[`test`]() [`test autorollback`]()
___

###`.rollback() -> Promise`
Rollback a transaction.

Before you must to call [`.begin`]().
If you not call [`.commit]() then the transaction is auto rollback by the library.

> **See:** [Transactions in PostgreSQL](http://www.postgresql.org/docs/8.3/static/tutorial-transactions.html)

####Example
```javascript
using(dbh.conn(), function (conn) {
  return conn
  .begin() // start a transaction.
  .then(DBH.exec(
    'update wallet \
    set balance=balance-10 where id=10'
  ))
  .then(DBH.exec(
    'update wallet set \
    balance=balance+10 where id=11'
  ))
  .then(function () {
    if (someCondition) {
      return this.commit();
    } else {
      // roolback if someCondition is false
      return this.rollback();
    }
  })
})
```
[`test`]() [`test autorollback`]()
___
##utils

###sanitize.js
Utils to sanitize user inputs.

Can be required directed:
```javascript
var sql = require('dbh-ph/lib/sanitize')
```
or with DBH:
```javascript
var DBH = require('dbh-pg'),
    sanitize = DBH.sanitize
```
[`test`](https://github.com/roro89/dbh-pg/blob/master/test/sanitize.js#L23)
___

####`.escape(string sql) -> string`
TODO

[`test`](https://github.com/roro89/dbh-pg/blob/master/test/sanitize.js#L29)

___

####`.array(array array, object whitelist) -> array`
TODO

[`test`](https://github.com/roro89/dbh-pg/blob/master/test/sanitize.js#L77-128)
___

####`.object(object object, object whitelist) -> object`
TODO

[`test`](https://github.com/roro89/dbh-pg/blob/master/test/sanitize.js#L130-193)
___

####`.sort(object sort, object whitelist) -> object`
TODO

[`test`](https://github.com/roro89/dbh-pg/blob/master/test/sanitize.js#L195-247)
___
###sql.js
Utils to create SQL chunks.

Can be required directed:
```javascript
var sql = require('dbh-ph/lib/sql')
```
or with DBH:
```javascript
var DBH = require('dbh-pg'),
    sql = DBH.sql
```
___

####`.limit(int limit [ , int offset ]) -> string`
Safe construction of SQL `limit` string.

- *int* **limit*
- *optional int* **offset**

#####Examples:
```javascript
sql.limit(3, 4)
-> ' LIMIT 3 OFFSET 4 '
```
```javascript
sql.limit(3)
-> ' LIMIT 3 '
```
___

####`.limit(object ctx) -> string`
Safe construction of SQL `limit` string.

- *object* **ctx**:
  - *optional int* **.limit*
  - *optional int* **.offset**

#####Examples:
```javascript
sql.limit({ limit: 3, offset: 4 })
-> ' LIMIT 3 OFFSET 4 '
```
```javascript
sql.limit({ limit: 3 })
-> ' LIMIT 3 '
```
```javascript
sql.limit({ })
-> ' '
```
_____

###`.orderBy(array sort) -> string`
Safe construction of SQL `ORDER BY` string.

- *array* **sort**:
  - an array of [```sortRule objects```](#sortrule-object).

####Examples:
```javascript
sql.orderBy([
    { attr: 'editorial', asc: true },
    { attr: 'name', asc: false }
])
-> ' ORDER BY editorial ASC, name DESC '
```
```javascript
sql.orderBy([
    { attr: 'name' }
])
-> ' ORDER BY editorial ASC '
```
```javascript
DBH.sqlLimit({ })
-> ' '
```
_____

###`.orderBy(```object``` ctx) -> string`
Safe construction of sql ```oder by```.

Proxy to:
```javascript
sql.orderBy(ctx.orderBy || ctx.sort || {})
```

#####Examples:
```javascript```
sql.orderBy({ sort: [{ attr:'name' }] })
-> ' ORDER BY name ASC '
```
```javascript```
sql.orderBy({  })
-> '  '
```
___
####`.toNamed(object object [ , string separator [ , string inSeparator ] ]) -> string`
TODO
___
####`.toIndexed(object object, array refArray [ , string separator [ , string inSeparator ] ]) -> string`
TODO
[pg]: https://www.npmjs.org/package/pg
