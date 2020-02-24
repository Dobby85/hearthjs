## Database

HearthJS works with PostgreSQL database.

### Connection

HearthJS take server config to connect to postgres. If following environment variable are set, they will be use for postgres connection instead of conf.

- `APP_DATABASE_USER`
- `APP_DATABASE_PASSWORD`
- `APP_DATABASE_NAME`
- `APP_DATABASE_HOST`
- `APP_DATABASE_PORT`

### Timeout

You can set postgreSQL `statement_timeout` in conf. It will be set during the connection.

To update it, you can use the following key in your configuration file: `APP_DATABASE_TIMEOUT`.

### Query

You have the possibility to execute SQL query at anytime. The second parameter which is `params` that you can give to postgreSQL is optional.

```js
const hearthjs = require('hearthjs')

// Run the server...

hearthjs.db.query('SELECT 1 AS number', [], (err, result, rows) => {

})

// OR

hearthjs.db.query('SELECT 1 AS number', (err, result, rows) => {

})
```

You can also use the promise version of the `query` function.

```js
hearthjs.db.query('SELECT 1 AS number', []).then(([ result, rows ]) => {

}).catch((err) => {

})
```

### Migration

Hearthjs has its own migration system. It must be used with the CLI.

#### Create a migration

```bash
./hearthjs migrate --create
# OR
./hearthjs migrate -c
```

This command will ask you a description, write it and valid.
Once you did this, two files will be created in your `migration` directory. An `up` and a `down` file.
Write in your `up` file your database modification and in the `down` file the request which can **cancel** your up.

Example:
```sql
// Up file
CREATE TABLE "Test" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL
);
```
```sql
// Down file
DROP TABLE "Test";
```

*You can write multiple request in the same file.*

#### Execute a migration

When you want to execute a migration, you must choose your environment (test, dev or prod).

```bash
./hearthjs migrate dev
```

This command will parse all your migrations and summurize you what will be done. You have to valid with `Y` or cancel with `n`.

If one of your migration has already been applied, you can always update it.

**WARNING: Don't update migration file which are in production, else you could loose your data**

If you update an old migration file, hearthjs will detect it as a conflict. It will down through your updated migration and up all migrations from your updated migrations.

For each conflict, you can choose how the down must be done.

- `f`: Down with the down request store in database
- `F`: Down with your file down request
- `a`: Don't apply SQL request but update SQL request store in database. After this, the conflict will disappear.

#### Down or up to a specific version

If you want test your `down` request or just put your database in an old migration version, you can do it like this:

```bash
./hearthjs migrate test -v <migration version>
```

The migration version is the code which is in font of the `_`.

For the filename `201908121234988_up.sql`, the code is `201908121234988`.

With this, you can `down` or `up` to any versions of your migration.

### Exec SQL file

When you run your server, hearthjs parse all SQL files recursively in your `server` directory to register them.

`database.exec` function can take 4 parameters.
- **templateName** *required*
- **data** *optional*
- **model** *optional*
- **callback** *required*

You can use `data` variable inside your template (cf. [Templating](#templating)). And your rows can be converted to a wanted model (cf. [Converter](#converter)).

If you don't pass `model` parameter, you will receive postgreSQL rows in your callback else you will receive the formatted object.

If you want use a `model`, you must pass `data` parameter !

Exemple:
If you have a file named `register.sql` and `selectUsers.sql` in your server directory, you can execute your request like this

```js
const hearthjs = require('hearthjs')

// Run the server...

// Second parameter is optional here too
hearthjs.db.exec('register', {}, (err, result, rows) => {

})
```

Or with a model

```js
const hearthjs = require('hearthjs')

// Run the server...

let model = ['array', {
  id: ['<<idUser>>'],
  mail: ['<mail>']
}]

// Second parameter is optional here too
hearthjs.db.exec('selectUsers', {}, model, (err, result, formattedResult) => {

})
```

You can also use the promise version of the `exec` function.

```js
hearthjs.db.exec('register', {}, model).then(([ result, object ]) => {

}).catch((err) => {

})
```
