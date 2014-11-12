#API Reference

> Note: This documentation is for dbh-pg v2.x . The v1.x was never documented and is deprecated.

- [DBH](#dbh)
  - [DBH.prepare(```string``` sql)]()
  - [DBH.sqlLimit(```int``` limit \[, ```int``` offset)\]]()
  - [DBH.sqlLimit(```object``` ctx)]()
  - [DBH.sqlOrderBy(```array``` sort)]()
  - [DBH.sqlOrderBy(```object``` ctx)]()
  - [DBH.\<shorthand\>(...)]()
  - [DBH.sanitize.*]()
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

##DBH

###DBH.prepare(```string``` sql)
Creates a prepared statement.

###DBH.sqlLimit(```int``` limit [ , ```int``` offset ])
Safe construction of sql ```limit```.

###DBH.sqlLimit(```object``` ctx)
Safe construction of sql ```limit```.

###DBH.sqlOrderBy(```array``` sort)
Safe construction of sql ```oder by```.

###DBH.sqlOrderBy(```object``` ctx)
Safe construction of sql ```oder by```.

###DBH.\<shorthand\>(...)
Multiples shorthands for conn.*

###DBH.sanitize
Proxy to [sanitize]().

###new DBH(```object``` settings)
Instantiates the database handler.

###new DBH(```require('pg')``` pg, ```object``` options)
Instantiates the database handler.

###.conn([ ```object``` scope ])
Get a connection from the poll.

##Connection

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
