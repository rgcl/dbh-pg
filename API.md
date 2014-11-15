> **WARNING: Work in progress.** 

> Note: This documentation is for dbh-pg v2.x . The v1.x was never documented and is deprecated.

#API Reference

- [Concepts](#concepts)
  - [parametized query](#parametized-query)
  - [query object](#query-object)
  - [sortRule object](#sortrule-object)
  - [promises](#promises)
  - [security](#security)
- [Classes]()
  - [DBH](#dbh)
    - [```object DBH.sanitize```](#dbh-sanitize)
    - [```object DBH.sql```](#dbh-sql)
    - [```DBH.{shorthand}({args})  -> Function```](#dbh-shorthands-function)
    - [```DBH.prepare(string query)  -> Function```](#dbh-prepare-string-query-function)
    - [```new DBH(object settings [ , object driver ])  -> DBH```](#new-dbh-object-settings-object-driver-dbh)
    - [```.conn([object scope]) -> Promise```](#conn-object-scope-promise)
  - [Connection](#connection)
    - [```.exec(string sql [ , object|array data ]) -> Promise```](#exec-string-sql-objectarray-data-promise)
    - [```.exec(object query) -> Promise```]()
    - [```.fetchOne(string query [ , object|array data ]) -> Promise```]()
    - [```.fetchAll(string query [ , object|array data ]) -> Promise```]()
    - [```.fetchColumn(string query [ , object|array data ]) -> Promise```]()
    - [```.fetchScalar(string query [ , object|array data ]) -> Promise```]()
    - [```.insert(string table, object data)]()
    - [```.update(string table, object data, object whereData) -> Promise```]()
    - [```.delete(string table, object whereData) -> Promise```]()
    - [```.exists(string table, object whereData) -> Promise```]()
    - [```.count(string table, object whereData) -> Promise```]()
    - [```.begin() -> Promise```]()
    - [```.commit() -> Promise```]()
    - [```.rollback() -> Promise```]()
- [utils](#utils)
  - [sanitize.js](#sanitize)
    - [```.escape(string sql) -> string```]()
    - [```.array(array array) -> array```]()
    - [```.object(object object) -> object```]()
    - [```.sort(object sort) -> object```]()
  - [sql.js](#sql)
    - [```.limit(int limit [, int offset ]) -> string```]()
    - [```.limit(object ctx) -> string```]()
    - [```.orderBy(array sort) -> string```]()
    - [```.orderBy(object ctx) -> string```]()
    - [```.toNamed(object object [ , string separator [ , string inSeparator ] ]) -> string```]()
    - [```.toIndexed(object object, array refArray [ , string separator [ , string inSeparator ] ]) -> string```]()

##Concepts

###Parameterized Queries
Consists in SQL commands string as ```'insert into book (name, author_id) values ($1, $2) '```
in which ```$1``` and ```$2``` are placeholders that must be replaced with the real values by the library.

####Placeholders types

#####Index placeholders
```$1```, ```$2```, ```...``` uses an array for replacement.
######Example
```javascript
'select * from animals where type=$1 and stains > $2'
```
```javascript
['cat', 3]
```
> ```$1``` is for the 0-index position in the array.

#####Named placeholders
```$name```, ```$author_id```, etc. Uses an plain object for replacement.
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
- ```optional string``` name: If is given the created query uses a [prepared statement](https://github.com/brianc/node-postgres/wiki/Client#prepared-statements).
- ```string``` text: The SQL command. Can be an [```index parameterized query```](#index-placeholders) query.
- ```optional array``` values: An array of string values for replace in the ```text```. Default ```[]```.

This object is used by the native [pg][] module.

> *named query object* is a query object in that the ```name``` is not empy.

___

###sortRule Object

Is a plain object with these parameters:
- ```string``` attr: The attribute name.
- ```optional boolean``` asc: ```true``` is the sort is ascending, ```false``` is is descending. Default ```true```.

This object is used in [```DBH.sqlOrderBy(array of sortRule)```](#dbh-sqlorderby-string).

###Promises

___

###Security
___

##Classes
___

###DBH
```var DBH = require('dbh-pg')```
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

####```object DBH.sanitize```
Proxy to [```sanitize```](#sanitize).
####```object DBH.sql```
Proxy to [```sql```](#sql).
___

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
| DBH              | Shorthand to... |
|------------------|-----------------|
| DBH.*exec*       | [.exec]()
| DBH.*fetchOne*   | [.fetchOne]()
| DBH.*fetchAll*   | [.fetchAll]()
| DBH.*fetchColumn*| [.fetchColumn]()
| DBH.*fetchScalar*| [.fetchScalar]()
| DBH.*insert*     | [.insert]()
| DBH.*update*     | [.update]()
| DBH.*delete*     | [.delete]()
| DBH.*count*      | [.count]()
| DBH.*begin*      | [.begin]()
| DBH.*commit*     | [.commit]()
| DBH.*rollback*   | [.rollback]()
| DBH.*done*       | [.done]()

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
#####Simple:
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

###```.exec(string query) -> Promise```
Send the given SQL query to the database.

- *string* **query**:
  - the SQL command to send to the database

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
```javascript
conn
.exec('select * from book')
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
_____

###conn.exec(```string``` sql, ```object``` data)

Execute the sql with the given data.

```javascript
conn
.exec('select * from book where author_id=$autor_id', { author_id : 32 })
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], count: 1,  }
})
```
_____

###conn.exec(/*string*/ sql, /*array*/ data)

Execute the sql with the given data.

```javascript
conn
.exec('select * from book where author_id=$1', [ 32 ])
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], count: 1,  }
})
```
_____

###conn.exec(/*Query*/ query)

Execute the query.

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

##utils

###sql
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

####.limit(```int``` limit [ , ```int``` offset ]) -> ```string```
Safe construction of SQL ```limit``` string.

#####Examples:
```javascript
sql.limit(3, 4)
-> ' LIMIT 3 OFFSET 4 '
```
```javascript
sql.limit(3)
-> ' LIMIT 3 '
```

####.limit(```object``` ctx) -> ```string```
Safe construction of SQL ```limit``` string.

The ctx parameter is an object that contains ```int``` .limit 
and ```optional int``` .offset attributes.

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

###.orderBy(```array``` sort) -> ```string```
Safe construction of SQL ```oder by``` string.

####Parameters:
- ```array``` sort: an array of [```sortRule objects```](#sortrule-object).

####Returns:
A ```ORDER BY``` SQL command part.

####Examples:
```javascript
sql.orderBy([
    { attr: 'editorial', asc: true },
    { attr: 'name', asc: false }
])
// ' ORDER BY editorial ASC, name DESC '
```
```javascript
sql.orderBy([
    { attr: 'name' }
])
-> ' ORDER BY editorial ASC '
```
```javascript
DBH.sqlLimit({ })
// ' '
```
_____

###.orderBy(```object``` ctx)
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

> note that if ctx has not the sort property, then blank string is returned.


[pg]: https://www.npmjs.org/package/pg
