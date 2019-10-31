## API

```js
const hearthjs = require('hearthjs')

const schema = {
  mySchema: {
    before: (req, res, next) => {
      // LOGIC
      next()
    },

    after: (req, res, data, next) => {
      // LOGIC
      next()
    }
  }
}

hearthjs.api.define('apiName', (router) => {
  router.get('/route', 'mySchema')
})
```

As you can see, hearthjs works with `schema`.

You can add following keys to a schema

```js
{
  before: (req, res, next) => {}, // Function executes before the SQL Request
  after: (req, res, data, next) => {}, // Function executes after the SQL Request, it receives the result of the SQL Request in data
  successMsg: '', // Message returned if the request succeed
  middleware: [], // A list of middleware to execute for the route
  query: 'sqlFile', // The query to execute between before and after
  function: (req, res) => {}, // Function to execute
  out: [], // Model, hearthjs will parse your returned rows and transform it in a JSON object
  in: [] // Model, hearthjs will use it to check all your data are like you want
}
```

In the `before` and `after` function, if you want to return an error, pass a string to the next function. It will return an error with your defined string as message. If you receive data in `after` function, they will not be sent.

```js
{
  before: (req, res, next) => {
    next('Error') // Will return Error as message to the user
  }
}
```

You can update `data` return by next by giving it the new `data`.

```js
{
  after: (req, res, data, next) => {
    let newData = {
      firstname: 'John'
    }
    next(null, newData) // Will return Error as message to the user
  }
}
```

If you set an `out` model in your schema, hearthjs will convert rows returned by the query in your JSON object (cf. [Converter](#converter)). `after` will receive the formatted JSON object instead of rows returned by postgres. If `out` is not set, `after` will receive rows as postgres return them.

If you set an `in` model in your schema, hearthjs will check expected data with multiple filters. (cf. [Data validation](#data-validation))

You can user `req` variable in your `sql` file. (cf. [Templating](#templating))

### Methods

You can declare `GET`, `POST`, `PUT` and `DELETE` method.

```js
hearthjs.api.define('apiName', (router) => {
  router.get('/route', 'schema'),
  router.post('/route', 'schema'),
  router.put('/route', 'schema')
  router.delete('/route', 'schema'),
})
```

### Route without schema

If you don't want to execute a schema but a simple function like express, you can set your function instead of a schema.

```js
const schema = {
  funcSchema: {
    function: (req, res) => {
      return res.send('OK')
    }
  }
}

hearthjs.api.define('apiName', schema, (router) => {
  router.get('/route', 'funcSchema')
})
```

### Returned data

HearthJS returns a JSON object with the following properties to the user.

```js
{
  success: true, // Was the request successful
  data: {}, // Data return by the SQL Request
  message: '' // A message
}
```
