## Server

### Directory tree

You must have in your root directory a `server` directory with an `api` directory in it.

```
myProject
└── server
    ├── config
    │   ├── dev.json
    │   ├── prod.json
    │   └── test.json
    ├── api
    │   └── apiName
    |       ├── test
    |       |   └── test.apiName.js
    |       ├── sql
    |       |   └── sqlFile.sql
    │       └── api.apiName.js
    ├── lang
    |   ├── fr.json
    |   └── en.json
    ├── cron
    |   └── cron.cronName.js
    ├── test
    |   └── test.global.js
    ├── logs
    ├── migration
    └── index.js
```

### Naming convention

All your api filenames must respect the following convention `api.apiName.js`. You can set anything thing as `apiName` it has no impact on hearthjs.

### Configuration

Your application can save configuration from multiple way. In every case, here is the list of key which must be present in your configuration files:

- `APP_SERVER_PORT`
- `APP_SERVER_LANG`
- `APP_DATABASE_USERNAME`
- `APP_DATABASE_HOST`
- `APP_DATABASE_NAME`
- `APP_DATABASE_PASSWORD`
- `APP_DATABASE_PORT`

#### From config file (default)

If your application have a `config` folder with the right environment configuration (`test.json`, `dev.json` or `prod.json`), it will be used by default.

#### From environment variables

If not config files could be found, no one will be created but we get `process.env`. Before returning config file, we parse every env values and convert `numbers` and `boolean` to real numbers and boolean.

```json
// environment variable
{
  "STR": "value",
  "NUM": "123",
  "BOOL": "true"
}

// would be converted to
{
  "STR": "value",
  "NUM": 123,
  "BOOL": true
}
```

### Cluster

You can clusterize your server easily by adding the following key in your configuration files.
- `APP_NB_CLUSTER`

This key can take different values.
- `-1` this will run one cluster per cpu
- `0` this will not run cluster and server will run in the master process
- `number` this will run `number` cluster

*Note:*
If you want execute function only one time and not as much as clusters number, you can add the following check:

```js
const cluster = require('cluster')

if (cluster.isMaster || process.env.IS_LEADER_THREAD) {
  // Even with multiple cluster, only one can access here
}
```

### Run

To run your server, you can use the hearthjs CLI. You can run it with two way:

```bash
./hearthjs start <mode> #dev, test or prod
# Or if you are in development
./hearthjs debug <mode>
```

With the CLI, you have the possibility to override each of the following configuration key.
- `APP_SERVER_PORT` with **-p** or **--port**
- `APP_SERVER_LANG` with **-l** or **--lang**
- `APP_NB_CLUSTER` with **-c** or **--cluster**
- `APP_DATABASE_USERNAME` with **--db_username**
- `APP_DATABASE_HOST` with **--db_host**
- `APP_DATABASE_NAME` with **--db_name**
- `APP_DATABASE_PASSWORD` with **--db_password**
- `APP_DATABASE_PORT` with **--db_port**

For example if you want manage your port and cluster with the CLI, you can do:

```bash
./hearthjs start prod --port 3000 --cluster 8
# OR
./hearthjs debug dev -p 3000
```

The difference between `start` and `debug` command is that in `debug` mode, the `debug` lib will be enable for **hearthjs** key. Moreover, all files which are in the following directory are watched.
- `server/api/**/*.js`
- `server/api/**/sql/*.sql`

So each time you update one of this file, your server automatically restart with new changes.

### Initialisation

You can call init functions when the server starts. Three functions are available:

- beforeInit
- init
- afterInit

All this function have at least a callback in parameter. You **must** call it with an error or not.

##### beforeInit

This function is called before all initialisation. The server has not been created yet.

##### init

This function receives the express server in parameter. This is in this function you can add your own middleware.

##### afterInit

This function is called after all initialisations.

These functions are in the `index.js` file which is at the root of your server directory. It must looks like this:

```js
const server = {
  beforeInit: (callback) => {
    return callback(null)
  },

  init: (server, callback) => {
    // Add your middleware here
    return callback(null)
  },

  afterInit: (server, callback) => {
    return callback(null)
  }
}

module.exports = server
```

### Run in production

When you use the command `hearthjs start prod`, hearthjs starts an HTTPS server.

**WARNING**

Before running a production environment, you have to put your private key and your certificates under `/server/certificates`. It should looks like:

- `/server/certificates/server.key`
- `/server/certificates/server.cert`

Hearthjs automatically run the server on port `443`.

### Start a socket server

You can start a socket server to send notification to your client.

To start this socket server, add `startSocketServer` to your `index.js` file. You can also specify a cors object with this key : `socketCorsOptions`.

See `socket.io` cors documentation for the object : https://socket.io/docs/v4/handling-cors/
