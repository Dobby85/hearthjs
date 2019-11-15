## Tests

You can easily test your API with hearthjs.

### Run

```bash
./hearthjs test
```

This command will run a server in `test` mode. So, in your tests, you can make API calls without run your server manually.

Many options are available with this command:
- **-p** or **--port** to override `APP_SERVER_PORT`
- **--db_username** to override `APP_DATABASE_USERNAME`
- **--db_host** to override `APP_DATABASE_HOST`
- **--db_name** to override `APP_DATABASE_NAME`
- **--db_password** to override `APP_DATABASE_PASSWORD`
- **--db_port** to override `APP_DATABASE_PORT`
- **-s** or **--stop** to stop the script when all tests have been executed

When you run your test, by default, the script never end so when you update your server files or sql files or test files, tests rerun automatically with new changes.

*Note:* When you want to execute a request to your server, you can call the following function to get the `host` with the `port`.

```js
const hearthjs = require('hearthjs')

hearthjs.server.getEndpoint() // return http://localhost:3000/
```

So, even if you update your configuration, you don't have to update your port request for each test.

### Test files

Your tests files must be in a `test` directory in your `api` directories or in a `test` directory at the root of your `server` directory.
Moreover, they must be JS files starting by `test.`.

Example:  
*/server/api/myApi/test/test.myFile.js*  
*/server/api/otherApi/test/test.myFile2.js*  
*/server/test/test.myFile3.js*  

### HTTP Client

You can use the hearthjs http client to keep a session during multiple tests.

#### Create an client instance

```js
const hearthjs = require('hearthjs')

describe('Test', () => {
  let _user = new hearthjs.httpClient('email@email.com', 'password')

  before((done) => {
    _user.login(done)
  })

  after((done) => {
    _user.logout(done)
  })
})
```

By default, the `login` function call the `/login` route. Same thing for the `logout` function which call the `/logout` route. You can override them like this:

```js
const hearthjs = require('hearthjs')

let _user = new hearthjs.httpClient('email@email.com', 'password')

_user.login('/new-login-route', (err, response, body) => {})
_user.logout('/new-logout-route', (err, response, body) => {})
```

#### Headers

You can add a default header which will be added automatically to requests.

```js
describe('Test', () => {
  let _user = new hearthjs.httpClient('email@email.com', 'password')

  _user.headers = {
    // Write here the header that must be in all request
  }
})
```

#### Execute a request

You can execute simple HTTP request with the client. If you are connected, the client add the cookie to the request to execute an authenticated test.

You can execute `GET`, `POST`, `PUT` and `DELETE` requests.

```js
const hearthjs = require('hearthjs')

describe('Test', () => {
  let _user = new hearthjs.httpClient('email@email.com', 'password')

  before((done) => {
    _user.login(done)
  })

  after((done) => {
    _user.logout(done)
  })

  it('Should execute a get request', (done) => {
    _user.get('/my-route', (err, response, body) => {
      // The body is a valid JSON object
    })
  })

  it('Should execute a post request', (done) => {
    _user.post('/my-route', {
      data: ''
    }, (err, response, body) => {
      // Handle the response here
    })
  })
})
```

#### Execute a complex request

If you need to custom your request, you can make authenticated request easily.

You can get the complete URL with the `getCompleteUrl('/my-route')` and get the user cookie with `cookie` property.

```js
const hearthjs = require('hearthjs')
const request = require('request')

describe('Test', () => {
  let _user = new hearthjs.httpClient('email@email.com', 'password')

  before((done) => {
    _user.login(done)
  })

  after((done) => {
    _user.logout(done)
  })

  it('Should execute a complex request', (done) => {
    request.get({
      url: _user.getCompleteUrl('/my-route'),
      headers: {
        Cookie: _user.cookie
      }
    }, (err, response, body) => {
      // Handle response
    })
  })
})
```

### Datasets

When you test your API, it can be usefull to have datasets in database. You can add and clean them easily.

`datasets.insert` function take as first argument a list of datasets name.

**Your dataset file must be in server directory**

For example, if you have in your `server` directory two datasets named `dataset1.sql` and `dataset2.sql`, you can insert and clean them like this.

```js
const hearthjs = require('hearthjs')
const path = require('path')

describe('Test', () => {
  before((done) => {
    hearthjs.datasets.insert(['dataset1', 'dataset2'], done)
  })

  after((done) => {
    hearthjs.datasets.clean(done)
  })
})
```

**WARNING**

`datasets.clean` does not drop table your create in datasets, it juste delete the content of all tables.
