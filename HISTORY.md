# 2.1.1 2015-11-05

* In the documentation the use of quotation marks is clarified for the table names for `.ìnsert`, `.update`, `.delete`,
  `.exists` and `.count`.
* Documented the [`.verbose`](https://github.com/sapienlab/dbh-pg/blob/master/API.md#new-dbhobject-settings---object-driver----dbh) option.

# 2.1.0 2015-11-05

* Fix bugs [12](https://github.com/sapienlab/dbh-pg/issues/12) and [13](https://github.com/sapienlab/dbh-pg/issues/13).
* Fix error in the API Docs, about the `returning` clausule in `.insert`, `.update` and `.delete`.
  When `returning` param exists, then returns a [Result Object](#result-object).
* Update the `bluebird` dependence to v3.*

# 2.0.2 2015-08-16

* Update the ``pg`` dependence to v4.*
* Now ``bluebird`` is an internal dependence, so you can use ``DBH.using`` or ``Promise.using``.
* Finished the API documentation

# 1.0.1 2014-10-26

* Uncommited transaction now generate automatic rollback
* Add tests about transactions

# 1.0.0 2014-10-24

* Now ``Promise.using`` of ``bluebird`` npm module is used to release the connection to the pool.
* Update the ``bluebird`` npm module.
* DBH: Adding ``bool verbose`` option in the constructor to debug the generated SQL to the console.
* DBH: ``DBH.escape`` now returns unquoted string.
* Update README.md

# 0.1.0

* Connection: Adding ``fetchOne``, ``fetchAll`` and ``fetcColumn`` methods.
* DBH: Adding ``escape``, ``sqlOrderBy`` and ``limit`` static methods.

# 0.0.1 2014-05-04

First version
