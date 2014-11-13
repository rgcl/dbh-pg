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
    - [DBH.*prepare*(```string``` query)](#dbh-prepare-string-query)
    - [DBH.*sqlLimit*(```int``` limit \[, ```int``` offset\])]()
    - [DBH.*sqlLimit*(```object``` ctx)]()
    - [DBH.*sqlOrderBy*(```array``` sort)]()
    - [DBH.*sqlOrderBy*(```object``` ctx)]()
    - [DBH.*\<shorthand\>*(...)]()
    - [DBH.*sanitize*.*]()
    - [new DBH(```object``` settings)](#new-dbh-dbhsettings-settings)
    - [new DBH(```require('pg')``` pg \[, ```options``` options\])](#new-dbh-pg-pg-options)
    - [.conn(\[```object``` scope\])](#conn)
  - [Connection](#connection)
    - [.exec(```string``` sql \[ , ```object|array``` data \])]()
    - [.exec(```object``` query)]()
    - [.begin()]()
    - [.commit()]()
    - [.rollback()]()
    - [.fetchOne(```string``` query \[ , ```object|array``` data \])]()
    - [.fetchAll(```string``` query \[ , ```object|array``` data \])]()
    - [.fetchColumn(```string``` query \[ , ```object|array``` data \])]()
    - [.fetchScalar(```string``` query \[ , ```object|array``` data \])]()
    - [.insert(```string``` table, ```object``` data)]()
    - [.update(```string``` table, ```object``` data, ```object``` whereData)]()
    - [.delete(```string``` table, ```object``` whereData)]()
    - [.exists(```string``` table, ```object``` whereData)]()
    - [.count(```string``` table, ```object``` whereData)]()
- [utils]()
  - [sanitize](#sanitize)
    - [.escape(```string``` sql)]()
    - [.array(```array``` array)]()
    - [.object(```object``` object)]()
    - [.sort(```object``` sort)]()

##Concepts
___

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

####DBH.sqlLimit(```int``` limit [ , ```int``` offset ]) -> ```string```
Safe construction of sql ```limit``` string.

#####Examples
```javascript
DBH.sqlLimit(3, 4)
-> ' LIMIT 3 OFFSET 4 '
```
```javascript
DBH.sqlLimit(3)
-> ' LIMIT 3 '
```

####DBH.sqlLimit(```object``` ctx) -> ```string```
Safe construction of sql ```limit``` string.

The ctx parameter is an object that contains ```int``` .limit 
and ```optional int``` .offset attributes.

#####Examples
```javascript
DBH.sqlLimit({ limit: 3, offset: 4 })
-> ' LIMIT 3 OFFSET 4 '
```
```javascript
DBH.sqlLimit({ limit: 3 })
-> ' LIMIT 3 '
```
```javascript
DBH.sqlLimit({ })
-> ' '
```
_____

###DBH.sqlOrderBy(```array``` sort) -> ```string```
Safe construction of sql ```oder by```.

####Parameters:
- ```array``` sort: an array of [```sortRule objects```](#sortrule-object).

####Returns:
A ```ORDER BY``` SQL command part.

####Examples:
```javascript
DBH.sqlOrderBy([
    { attr: 'editorial', asc: true },
    { attr: 'name', asc: false }
])
// ' ORDER BY editorial ASC, name DESC '
```
```javascript
DBH.sqlOrderBy([
    { attr: 'name' }
])
-> ' ORDER BY editorial ASC '
```
```javascript
DBH.sqlLimit({ })
// ' '
```
_____

###DBH.sqlOrderBy(```object``` ctx)
Safe construction of sql ```oder by```.

Call DBH.sqlOrderBy(```ctx.sort```).

####Examples:
```javascript```
DBH.sqlOrderBy({ sort: [{ attr:'name' }] })
-> ' ORDER BY name ASC '
```
```javascript```
DBH.sqlOrderBy({  })
-> '  '
```

> note that if ctx has not the sort property, then blank string is returned.

_____

###DBH.\<shorthand\>(...)
Multiples shorthands for conn.*
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

pg: https://www.npmjs.org/package/pg
