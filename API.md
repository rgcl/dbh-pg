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
    - [```object``` DBH.*sanitize*](#dbh-sanitize)
    - [```object``` DBH.*sql*](#dbh-sql)
    - [DBH.*\<shorthand\>*(...)  -> ```Function```](#dbh-shorthands)
    - [DBH.*prepare*(```string``` query)  -> ```Function```](#dbh-prepare-string-query)
    - [new DBH(```object``` settings \[ , ```object``` driver \])  -> ```DBH```](#new-dbh-dbhsettings-settings)
    - [.conn(\[```object``` scope\]) -> ```Promise```](#conn)
  - [Connection](#connection)
    - [.exec(```string``` sql \[ , ```object|array``` data \]) -> ```Promise```]()
    - [.exec(```object``` query) -> ```Promise```]()
    - [.fetchOne(```string``` query \[ , ```object|array``` data \]) -> ```Promise```]()
    - [.fetchAll(```string``` query \[ , ```object|array``` data \]) -> ```Promise```]()
    - [.fetchColumn(```string``` query \[ , ```object|array``` data \]) -> ```Promise```]()
    - [.fetchScalar(```string``` query \[ , ```object|array``` data \]) -> ```Promise```]()
    - [.insert(```string``` table, ```object``` data)]()
    - [.update(```string``` table, ```object``` data, ```object``` whereData) -> ```Promise```]()
    - [.delete(```string``` table, ```object``` whereData) -> ```Promise```]()
    - [.exists(```string``` table, ```object``` whereData) -> ```Promise```]()
    - [.count(```string``` table, ```object``` whereData) -> ```Promise```]()
    - [.begin() -> ```Promise```]()
    - [.commit() -> ```Promise```]()
    - [.rollback() -> ```Promise```]()
- [utils](#utils)
  - [sanitize](#sanitize)
    - [.escape(```string``` sql)]()
    - [.array(```array``` array)]()
    - [.object(```object``` object)]()
    - [.sort(```object``` sort)]()
  - [sql](#sql)
    - [.limit(```int``` limit \[, ```int``` offset\])]()
    - [.limit(```object``` ctx)]()
    - [.orderBy(```array``` sort)]()
    - [.orderBy(```object``` ctx)]()
    - [.toNamed(```object``` object \[ , ```string``` separator \[ , ```string``` inSeparator \] \])]()
    - [.toIndexed(```object``` object, ```array``` refArray \[ , ```string``` separator \[ , ```string``` inSeparator \] \])]()

##Concepts

###Parameterized Queries

Consists in a SQL command string as ```'insert into book (name, author_id) values ($1, $2) '```
in which ```$1``` and ```$2``` are placeholders that must be replaced with the real values by the library.
####Placeholders types
#####Index placeholders
```$1```, ```$2```, ```...``` uses an array for replacement.
> ```$1``` is for the 0-index position in the array.

#####Named placeholders
```$name```, ```$author_id```, etc. Uses an plain object for replacement.
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

####DBH.prepare(```string``` query) -> ```Function```

Creates a function that return a named [```query object```](#query-object), 
useful for use Prepared Statements.

#####Parameters:
* ```string``` query: An [```index parameterized query```](#index-placeholders). 

#####Returns:
Function in which the parameters are the index placeholders and return a named [```query object```](#query-object).

#####See:
[pg docummentation about prepared statement](https://github.com/brianc/node-postgres/wiki/Client#queryobject-config-optional-function-callback--query)

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

###```object``` DBH.*sanitize*
Proxy to [```sanitize```](#sanitize).
###```object``` DBH.*sql*
Proxy to [```sql```](#sql).
___

###DBH.```{shorthand}```(```{args}```) -> ```Function```

The DBH shorthands are utilities functions for the [```Connection```](#connection)
methods.

Each shorthands returns a function that can be used as [```fulfilledHandler```](https://github.com/petkaantonov/bluebird/blob/master/API.md#thenfunction-fulfilledhandler--function-rejectedhandler----promise) in a promise.

```javascript
DBH.{shorthand}({args})
-> function () {  return this.{shorthand}({args}) }
```
####Examples:
**With shorthand (count)***
```javascript
using(dbh.conn(), function (conn) {
    return conn
        .insert('animal', { name: 'Cenala', type: 'cat' })
        .then(DBH.count('animals')) // shorthand count
})
```
***Without shorthand***
```javascript
using(dbh.conn(), function (conn) {
    return conn
        .insert('animal', { name: 'Cenala', type: 'cat' })
        .then(function () {
            return this.count('animals')
        })
})
```
####DBH.exec({args})
Shorthand for .exec({args})

Shorthand to [```conn.exec(...)```]()

| DBH.* | Shorthand to: | 
|-------|---------------|
|.exec  |conn.
|

_____

###DBH.sanitize
Proxy to [sanitize]().
_____

###new DBH(```object``` settings)
Instantiates the database handler.
_____

###new DBH(```require('pg')``` pg, ```object``` options)
Instantiates the database handler.
_____

###.conn([ ```object``` scope ])
Get a connection from the poll.
_____

##Connection
_____

###conn.exec(```string``` sql)
Send the given SQL command to the database.

####Returns:
A object with this parameters:
- ```array``` rows: An array of items returner from the database, each item is a plain key->value object.
- ```int``` count: The number of the affected rows

####Example:
```javascript
conn
.exec('select * from book')
.then(function (resultset) {
    console.log(resultset)
    // { rows: [{item1}, ...], count: 1,  }
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
