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
    |       ├── sql
    |       |   └── sqlFile.sql
    │       └── api.apiName.js
    ├── lang
    |   ├── fr.json
    |   └── en.json
    ├── cron
    |   └── cron.cronName.js
    ├── logs
    └── migration
```

### Naming convention

All your api filenames must respect the following convention `api.apiName.js`. You can set anything thing as `apiName` it has no impact on hearthjs.

### Configuration

You must have in your `server` directory a folder named `config`. `config` folder must have `dev.json`, `test.json` and `prod.json` files.

Here is the list of key which must be present in your configuration files:
- `APP_SERVER_PORT`
- `APP_SERVER_LANG`
- `APP_DATABASE_USERNAME`
- `APP_DATABASE_HOST`
- `APP_DATABASE_NAME`
- `APP_DATABASE_PASSWORD`
- `APP_DATABASE_PORT`

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
