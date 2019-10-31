## Addons

An addon is a key you can insert in your schemas to check things or execute actions.

### Build an addon

Here is an addon object

```js
let addon = {
  schemaKeyName: '',
  init: function (database, callback) {},
  initSchema: function (addonValue, database, route, schema, callback) {},
  exec: function (addonValue, database, route, schema, req, res, next) {}
}
```

The `schemaKeyName` is the name you will add to your schema. If I create an addon with `roles` as `schemaKeyName`, I could do:

```js
let schema = {
  roles: ['USER', 'ADMIN'],
  in: {},
  out: {}
}
```

There are 3 functions you can declare when you build an addon.

#### init

`init` function is called before registering routes. You have access to the `database` so you can create table...

#### initSchema

`initSchema` function is called when registering an API. It takes several parameters:

- `addonValue`: The value set to the key in the schema
- `database`: The database
- `route`: The route associate to the schema
- `schema`: The schema where your key has been used

#### exec

`exec` function is called each time a route which has a schema with `schemaKeyName` is called. It takes several parameters:

- `addonValue`: The value set to the key in the schema
- `database`: The database
- `route`: The route associate to the schema
- `schema`: The schema where your key has been used
- `req`: The request object
- `res`: The response object

Do not forget to call the callback, else the application couldn't run.

*Note: If you want to return an error in your addon, you can pass a parameter to the next function. This will return an error to the user.*

Example:

```js
let addon = {
  exec: function (addonValue, database, route, schema, req, res, next) {
    // Want return an error
    return next('Oups an error occured')
  }
}
```

### Use an addon

You can use multiple addons.

```js
const roleAddon = require('roleAddon')
const app = require('hearthjs')

app.useAddon(roleAddon)
```

After that, you can use the addon in your schemas.

You can add all your addons in the [`beforeInit` function of your server](/server/#initialisation).

#### Override schemaKeyName

If you get a conflict in your addon `schemaKeyName`, you can override it like this:

```js
app.useAddon(roleAddon, 'newSchemaKeyName')
```
