> This documentation is for the current dbh-pg v3.x

#API Reference

- [Concepts](#concepts)
  - [parameterized query](#parameterized-queries)
  - [query object](#query-object)
  - [result object](#result-object)
  - [sortRule object](#sortrule-object)
  - [promises](#promises)
  - [security](#security)
- [Classes](#classes)
  - [DBH](#dbh)
    - [`object DBH.sanitize`](#object-dbhsanitize)
    - [`object DBH.sql`](#object-dbhsql)
    - [`DBH.using(Promise|Disposer promise, Promise|Disposer promise ..., Function handler) -> Promise`](https://github.com/sapienlab/dbh-pg/blob/master/API.md#dbhusingpromisedisposer-promise-promisedisposer-promise--function-handler---promise)
    - [`DBH.prepare(string query)  -> Function`](#dbhpreparestring-query---function)
    - [`DBH.one([ int index ]) -> Function`](#dbhone-int-index----function)
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
    - [`.done() -> void`](#done---void)
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
    - [`.toNamed(object object [ , string separator [ , string inSeparator ] ]) -> string`](#tonamedobject-object---string-separator---string-inseparator-----string)
    - [`.toIndexed(object object, array refArray [ , string separator [ , string inSeparator ] ]) -> string`](#toindexedobject-object-array-refarray---string-separator---string-inseparator-----string)

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

###Result Object
Is a plain object with these parameters:

- *string* **command**:
  - The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
- *int* **rowCount**:
  - The number of rows affected by the SQL statement [(more information)](http://www.postgresql.org/docs/8.1/static/libpq-exec.html#LIBPQ-EXEC-NONSELECT)
- **oid**:
  - the oid returned
- *array* **rows**:
  - an array of rows

[`pg documentation`](https://github.com/brianc/node-postgres/wiki/Query#result-object)
___

###sortRule Object

Is a plain object with these parameters:
- *string* **attr**:
  - The attribute name.
- *optional boolean* **asc**:
  - default: *true*
  - `true` is the sort is ascending, `false` is is descending.

This object is used by [`sql.orderBy`](#orderbyarray-sort---string).

___
###Promises

Because the asynchronous nature of javascript, it is common to see things like:

```javascript
// userFromId give a live to userToId
function transferOneLive(userFromId, userToId, callback) {
  db.conn(function(err, conn) {
    if(err) { return callback(err) }
    conn.begin(function(err) {
      if(err) { return callback(err) }
      conn.exec('update user set lives=lives-1 where id=$1', [userFromId], function(err) {
        if(err) { return callback(err) }
        conn.exec('update user set lives=lives+1 where id=$1', [userToId], function(err) {
          if(err) { return callback(err) }
          conn.commit(function(err) {
            if(err) {
              conn.rollback(function(err) {
                return callback(err)
              })
              return callback(err)
            }
          })
        })
      })
    })
  })
}

// usage
transferOneLive(3, 5, function(err) {
  if(err) { return console.log('Ohh!') }
  console.log('Ok!')
})
```

With `promises`, that code turn more redeable:
```javascript
// userFromId give a live to userToId
function transferOneLive(userFromId, userToId, callback) {
  return DBH.using(db.conn(), function(conn) {
    return conn.begin()
      .then(DBH.exec('update user set lives=lives-1 where id=$1', [userFromId]))
      .then(DBH.exec('update user set lives=lives+1 where id=$1', [userToId]))
      .then(DBH.commit())
  })
}

// usage
transferOneLive(3, 5)
  .then(function() { console.log('Ok!') })
  .catch(function(err) { console.log('Ohh!') })
```
> If catch, rollback is executed automatically by DBH-PG

This library use [`bluebird`](https://github.com/petkaantonov/bluebird) library for promises. Despite Promise is native in node v0.12, bluebird has more tools for manage the promises (example, .using).
___

###Security

Only the methods that use a [parameterized query](#parameterized-queries) are safe for direct user-input.
Consider ALL other methods to be not safe for user-input.

#### Examples of safe usage of user-input:
- `conn.exec('select * from account where username=$1 and pass=$2', [theUsername, thePass])`. Because 
  `theUsername` and `thePass` are used in a [parameterized query](#parameterized-queries).
- `conn.insert('account', { username: theUsername, pass: thePass })`. Because 
  `theUsername` and `thePass` are used in a [parameterized query](#parameterized-queries).

#### Examples of unsafe usage of user-input:
- `conn.exec("select * from account where username='" + theUsername + "' and pass='" + thePass + "'")`. Because 
  `theUsername` or `thePass` can be `boom!'; drop table account -- `.
- `conn.insert(theTableName, { username: theUsername, pass: thePass })`. Because 
  `theTableName` can be `account' (username) values ('boom!'); drop table account -- `.

> See:
> - [SQL Injection](https://en.wikipedia.org/wiki/SQL_injection)
> - [dbal docs](http://docs.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/security.html) (the PHP equivalent of dbh-pg)
  
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
####`DBH.using(Promise|Disposer promise, Promise|Disposer promise ..., Function handler) -> Promise`
Proxy to [`Promise.using`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promiseusingpromisedisposer-promise-promisedisposer-promise--function-handler---promise).
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
####`DBH.one([ int index ]) -> Function`
Return a function that receive a [`result object`](#result-object) and return `result.rows[index]`.

- *optional int* **index**
  - default: 0
  - the index of the array to return

#####Usage Example
```javascript
using(dbh.conn(), function (conn) {
  return conn
    .update({...}, { pk: 2 }, '*')
    .then(DBH.one())
})
.then(function (updatedItem) {
  // instead a [Result Object](#result-object)
  // we have the item
})
```
[`definition`](lib/DBH.js#L66-70)
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

| DBH              | Shorthand to...   
|------------------|-------------------
| `DBH.exec`       | [`.exec`](#execstring-query---objectarray-data----promise)
| `DBH.fetchOne`   | [`.fetchOne`](#fetchonestring-query---objectarray-data----promise)
| `DBH.fetchAll`   | [`.fetchAll`](#fetchallstring-query---objectarray-data----promise)
| `DBH.fetchColumn`| [`.fetchColumn`](#fetchcolumnstring-query---objectarray-data--string-columnname-----promise)
| `DBH.fetchScalar`| [`.fetchScalar`](#fetchscalarstring-query---objectarray-data--string-columnname-----promise)
| `DBH.insert`     | [`.insert`](#insertstring-table-object-row---string-returning----promise)
| `DBH.update`     | [`.update`](#updatestring-table-object-data-object-where---string-returning----promise)
| `DBH.delete`     | [`.delete`](#deletestring-table-object-where---string-returning----promise)
| `DBH.exists`     | [`.exists`](#existsstring-table-object-where---promise)
| `DBH.count`      | [`.count`](#countstring-table---object-where----promise)
| `DBH.begin`      | [`.begin`](#begin---promise)
| `DBH.commit`     | [`.commit`](#commit---promise)
| `DBH.rollback`   | [`.rollback`](#rollback---promise)
| `DBH.done`       | [`.done`](#done---void)
_____

####```new DBH(string conextionString [ , object driver ]) -> DBH```
Instantiates the database handler.

- *string* **conextionString**
  - a connection string in the format ```anything://user:password@host:port/database```
  - a socket path, like ```/var/run/postgresql```
  - a socket path, with a specific database, ```like /var/run/postgresql a_db_name```
  - a socket connection string ```socket:/some/path/?db=database_name&encoding=utf8```
- *optional object* **driver**
  - The result of call `require('pg')`

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
  - *optional* bool **.verbose**:
    - default value: `false`
    - if is `true`, then print the generated SQL before execute to the console. Use it for debugging.
  - *optional* bool **.pseudoSafeUpdates**:
    - default value: `false`
    - if is `true`, then the methods [`.update`](#updatestring-table-object-data-object-where---string-returning----promise) and [`.delete`](#deletestring-table-object-where---string-returning----promise) fails if the `where` parameter is not given.
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
  - The result of call `require('pg')`

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
  - default value: `{}`
  - The value that is in `.scope` in ever promise callback.

When you call `dbh.conn()` you get a promise that will be fulfilled when 
a connection from the pool of connections is released.

Is **extremely important** that the last promise call the [`.done`]() method.

```javascript
dbh.conn()
    .exec(...)
    .then(DBH.update(...))
    .then(DBH.done(), DBH.done()) // Here we call the .done
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

___

##Connection
___

###`.exec(string query [ , object|array data ]) -> Promise`
Send the given SQL query to the database.

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)

Returns a [`result object`](#result-object)

####Example:
#####Simple Query:
```javascript
using(dbh.conn(), function (conn) {
  return conn.exec('select * from book where price <= 20.0')
})
.then(function (result) {
  console.log(result)
  // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})

```
#####[Indexed Parameterized Query]()
```javascript
using(dbh.conn(), function (conn) {
  return conn.exec('select * from book where price <= $1', [20.0])
})
.then(function (result) {
  console.log(result)
  // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
#####[Named Parameterized Query]()
```javascript
using(dbh.conn(), function (conn) {
  return conn.exec('select * from book where price <= $price', {
    price: 20.0
  })
})
.then(function (result) {
  console.log(result)
  // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
___

###```conn.exec(object query) -> Promise```
Execute the query.

> **See:** [query object](#query-object)

```javascript
using(dbh.conn(), function (conn) {
  return conn.exec({
    text: 'select * from book where author_id=$1',
    values : [ 32 ]
  })
})
.then(function (result) {
  console.log(result)
  // { rows: [{item1}, ...], rowCount: 0, command: 'SELECT', ...  }
})
```
___

###`.fetchOne(string query [ , object|array data ]) -> Promise`
Shortcut to `result.rows[0]` of [`.exec`](#execstring-query---objectarray-data----promise)

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [`parameterized`](#parameterized-queries)

Returns the first row as ```object```.

####Example
#####With `.fetchOne`
```javascript
using(dbh.conn(), function (conn) {
  return conn.fetchOne(
    'select * from planet where habitants > $1 limit 1'
    , [3000]
  )
})
.then(function (planet) {
  console.log(planet)
  // { name: 'Kolobo', habitants:... }
})
```
#####Without `.fetchOne`
```javascript
using(dbh.conn(), function (conn) {
  conn.exec(
    'select * from planet where habitants > $1 limit 1'
    , [3000]
  )
  .then(DBH.one()) // extra step
})
.then(function (planet) {
  console.log(planet)
  // { name: 'Kolobo', habitants:... }
})
```

> **tip:** Use `LIMIT 1` in the SQL. `.fetchOne` not add this for you.

___

###`.fetchAll(string query [ , object|array data ]) -> Promise`
Shortcut to `result.rows` of [`.exec`](#execstring-query---objectarray-data----promise)

- *string* **query**:
  - the SQL command to send to the database
- *optional object|array* **data**:
  - The data to use with the `query` if it is [parameterized](#parameterized-queries)

Returns an array of tuplas.

####Example
#####With `.fetchAll`
```javascript
using(dbh.conn(), function (conn) {
  return conn.fetchAll('select * from planet where habitants > $1', [3000])
})
.then(function (planets) {
  console.log(planets)
  // [{ name: 'Kolobo', habitants:... }, ...]
})
```
#####Without `.fetchAll`
```javascript
using(dbh.conn(), function (conn) {
  return conn.exec('select * from planet where habitants > $1', [3000])
    .then(function (result) {
      // extra step
      return result.rows
    })
})
.then(function (planets) {
  console.log(planets)
  // [{ name: 'Kolobo', habitants:... }, ...]
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
```javascript
[{ name: 'Name1'}, { name: 'Name2' }, { name: 'Name3' }, ...]
```
Instead, `.fetchColumn` returns
```javascript
[ 'Name1', 'Name2', 'Name3', ...]
```

####Example
```javascript
using(dbh.conn(), function (conn) {
  return conn.fetchColumn('select name from planet where habitants > $1', [3000])
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
  - Use `"` quotation for reserved words, schemas, etc.
    - Examples:
      - `.insert('"user"', { ... })`
      - `.insert('"myschema"."user"', { ... })`
- *object* **row**:
  - Te row to insert.
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

If `returning` is *undefined*, then return *undefined*, 
otherwise a [Result Object](#result-object) that contains one row with the attributes described  in `returning`.

####Examples:
#####Simple:
```javascript
using(dbh.conn(), function (conn) {
  return conn.insert('planet', { name: 'Mart', habitants: 343 })
})
```
#####With schema name:
```javascript
using(dbh.conn(), function (conn) {
  return conn.insert('"universe"."planet"', { name: 'Mart', habitants: 343 })
})
```

#####To know the autogenerated `id`:
```javascript
using(dbh.conn(), function (conn) {
  return conn.insert('planet', { name: 'Mart', habitants: 343 }, 'id')
})
.then(function (result) {
  console.log(result)
  // { ... rows: [ { id: 435 } ] ... }
})
```

#####To know the autogenerated `id` using DBH.one():
```javascript
using(dbh.conn(), function (conn) {
  return conn.insert('planet', { name: 'Mart', habitants: 343 }, 'id')
    .then(DBH.one())
})
.then(function (planet) {
  console.log(planet.id)
  // 435
})
```
___
###`.update(string table, object data, object where [ , string returning ]) -> Promise`
Update the `table` with the `data` where match `where`.

- *string* **table**:
  - the name of the table in the database.
  - Use `"` quotation for reserved words, schemas, etc.
    - Examples:
      - `.insert('"user"', { ... })`
      - `.insert('"myschema"."user"', { ... })`
- *object* **data**:
  - the data to update.
- *object* **when**
  - the values to match for updating. e.g. `{ id: 3 }`
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

If `returning` is *undefined*, then return the number of affected rows, 
otherwise a [Result Object](#result-object) in that each row has the attributes described  in `returning`.

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
Delete rows in the `table` that match with `where`.

- *string* **table**:
  - the name of the table in the database.
  - Use `"` quotation for reserved words, schemas, etc.
    - Examples:
      - `.insert('"user"', { ... })`
      - `.insert('"myschema"."user"', { ... })`
- *object* **where**
  - the values to match for deleting. e.g. `{ id: 3 }`
- *optional string* **returning**
  - default: undefined
  - the data to return. Useful for know autogenerated values.
  - is comma separated for each column name, e.g. `*` or, `name,birthday`.

If `returning` is *undefined*, then return the number of affected rows, 
otherwise a [Result Object](#result-object) in that each row has the attributes described  in `returning`.

####Example
```javascript
using(dbh.conn(), function (conn) {
  conn.delete(
    'planet'
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
  - Use `"` quotation for reserved words, schemas, etc.
    - Examples:
      - `.insert('"user"', { ... })`
      - `.insert('"myschema"."user"', { ... })`
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
  - Use `"` quotation for reserved words, schemas, etc.
    - Examples:
      - `.insert('"user"', { ... })`
      - `.insert('"myschema"."user"', { ... })`
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
###`.done() -> void`
Return the conextion to the pool of conexions.

To use *only* if you are not using [`Promise.using`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promiseusingpromisedisposer-promise-promisedisposer-promise--function-handler---promise).

> **Recommendation**: Ever use `Promise.using`, in this way `.done` is called automatically.

####Examples:
#####With `Promise.using`
```javascript
using(dbh.conn(), function (conn) {
  return conn.exec('...')
  // We NOT use `conn.done()` because 
  // we are using `Promise.using`.
  // Therefore `.done` is called automatically
  // by the library.
})
```
#####Without `Promise.using`
```javascript
dbh
.conn()
.exec('...')
.then(function () {
  return this.done();
}, function () {
  return this.done();
})
// or .then(DBH.done(), DBH.done())

// Here we use `conn.done` because we
// are not inside the `Promise.using`
```
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
[`test`](test/sanitize.js#L23)
___

####`.escape(string sql) -> string`
Escape the given sql.

#####Example:
```javascript
sanitize.escape('" or 1=1 -- ')
-> '\" or 1=1 -- '
````

[`test`](test/sanitize.js#L29)
___

####`.array(array array, object whitelist) -> array`
Filter the given `array` with the `whitelist`.

- *array* **array**:
  - the array to filter.
- *object* **whitelist**:
  - an object in that the `keys` are compared with each `item` in the array.

#####Rules for sanitize
One item in the **array** will be included in the returning *array* 
if matches with some `key` in the **whitelist** and:

######a) The `value` of the `key` in the **whitelist** is `true`
```javascript
sanitize.array(['red', 'blue'], { red: true, blue: false })
-> ['red']
````
######b) The `value` of the `key` in the **whitelist** is `string`
In this case the `ìtem` is overwrited by the `string`.
```javascript
sanitize.array(['red', 'blue'], { red: true, blue: 'azul' })
-> ['red', 'azul']
````
######c) The `value` of the `key` in the **whitelist** is a function that returns (a), (b) or (c).
```javascript
sanitize.array(['name', 'email'], {
  name: 'true',
  email: function (item) {
    // admit the email only if isAdmin is true
    return isAdmin();
  }
})
-> ['name'] // assuming that isAdmin() return false
````

#####Example:
Creation of safe `SELECT` where the fields come from the user input.
```javascript
function makeSelect(userInput, isAdmin) {
  var fields = sanitize.array(userInput, {
    name: 'a.name',
    email: function (item) { return isAdmin ? 'a.email' : false }
  })
  return = 'select '
    + fields.join(',')
    + ' from account a'
}

makeSelect(['name', 'pass'], true)
-> 'select u.name from account a'
// because the pass is not in the whitelist, 
// then is not in the returning array
````

[`test`](test/sanitize.js#L77-128)
___

####`.object(object object, object whitelist) -> object`
Filter the given **object** with the **whitelist**.

- *object* **object**:
  - the object to filter.
- *object* **whitelist**:
  - an object in that the `keys` are compared with each `key` in the **object**.

#####Rules for sanitize
One item in the **object** will be included in the returning *object* 
if their `key` matches with some `key` in the **whitelist** and:

######a) The `value` of the `key` in the **whitelist** is `true`
```javascript
sanitize.object({ color: 'yellow', type: 'comic sans' }, { color: true, type: false })
-> { color: 'yellow' }
````
######b) The `value` of the `key` in the **whitelist** is `string`
In this case the `key` of the item is overwrited by the `string`.
```javascript
sanitize.object({ color: 'yellow', type: 'comic sans' }, { color: true, type: 'font' })
-> { color: 'yellow', font: 'comic sans' }
````
######c) The `value` of the `key` in the **whitelist** is a function that returns (a), (b) or (c).
```javascript
sanitize.object({ color: 'yellow', type: 'comic sans' }, {
  color: 'true',
  type: function (key, value) {
    // admit the type only if isDesigner is true
    return isDesigner();
  }
})
-> { color: 'yellow' } // assuming that isDesigner() return false
````

#####Example:
Creation of safe `SELECT` where the `WHERE` come from the user input.
```javascript
function makeSelect(userInput) {
  var where = sanitize.object(userInput, {
    name: 'a.name',
    // admit only if the email is from the company
    email: function (key, value) { return /@mycompany/.test(value) ? 'a.email' : false }
  })
  return = 'select a.id, a.name from account a where '
    + sql.toNamed(where)
}

makeSelect({ name: 'Canela', pass: '123', email: 'canela@example.com' })
-> 'select a.id, a.name from account a where a.name=$name'
// because the pass is not in the whitelist, 
// then is not in the returning array.
// email is not because not match with the regExp /@mycompany/
````

[`test`](test/sanitize.js#L130-193)
___

####`.sort(object sort, object whitelist) -> object`
TODO

[`test`](test/sanitize.js#L195-247)
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

- *int* **limit**
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
DBH.orderBy([])
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
Format the object to [`named query`](#named-placeholders) chunk.

- *object* **object**
- *optional string* **separator**:
  - default: `'AND'`
- *optional string* **inSeparator**:
  - default: `'='`

#####Examples:
```javascript
sql.toNamed({ name: 'Bill', last: 'Puertas' })
-> ' name=$name AND last=$last '
```

```javascript
sql.toNamed({ name: 'Bill', last: 'Puertas' }, ',')
-> ' name=$name , last=$last '
```
[`definition`](lib/sql.js#L43-59)
___
####`.toIndexed(object object, array refArray [ , string separator [ , string inSeparator ] ]) -> string`
Format the object to [`indexed query`](#index-placeholders) chunk.

- *object* **object**
- *array* **refArray**:
  - an array that will be mutated adding the values according to the index in the result string
- *optional string* **separator**:
  - default: `'AND'`
- *optional string* **inSeparator**:
  - default: `'='`

#####Examples:
```javascript
var arr = []
sql.toIndexed({ name: 'Bill', last: 'Puertas' })
-> ' name=$1 AND last=$2 '

console.log(arr)
-> ['Bill', 'Puertas']
```

```javascript
var arr = []
sql.toIndexed({ name: 'Bill', last: 'Puertas' }, ',')
-> ' name=$1 , last=$2 '

console.log(arr)
-> ['Bill', 'Puertas']
```
[`definition`](lib/sql.js#L61-79)

[pg]: https://www.npmjs.org/package/pg
