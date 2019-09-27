## Extern API

You can externalize API so everyone can use it in their application.

### Build an API

API files are the same than in a hearthjs application. You must add a `index.js` file which looks like this:

```js
const path = require('path')
const addon = require('my-addon')

let apiPath = path.join(__dirname, 'externApi.js')

module.exports = {
  apis: [apiPath],
  prefix: '',
  addons: [{ addon: addon, schemaKeyName: '' }],
  init: function (database, callback) {},
  getName: function (apiName) {
    return this.prefix + '-' + apiName
  },
  initDatabase: '/path/to/myFile.sql'
}
```

There are multiples things:
- `apis`: This is the array with the path to all your apis files
- `prefix`: Let this field empty. It is usefull for people who use your API to avoid conflicts with other APIs
- `addons`: This is an array of addon you will need in your API. This addons will be load in the application with all other addons
- `init`: This is a function where you can access the database. This function is called before registering your API.
- `getName`: Let this function like this, it is also to avoid conflicts with other APIs
- `initDatabase`: This is the path to a SQL file where you can init tables...

In all your API files, you must define yous API like this:

```js
const externApi = require('./')

hearth.api.define(externApi.getName('externApi'), schemas, (server) => {
  server.get('/extern-api/error', 'getSchemaA')
  server.get('/extern-api/OK', 'schema')
})
```

Like this, the prefix will be added by hearthjs to avoid conflicts if user use multilples extern APIs.

### Use an API

Use an API is really simple.

```js
const api = require('my-api')
const hearthjs = require('hearthjs')

hearthjs.useApi(api, 'prefix')
hearthjs.run(...)
```

You **must** specify a prefix for your API, else the application will not run.
