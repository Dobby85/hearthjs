## Cron

You can add crons and manage them easily in your application.

### Add a cron

To add a cron, you must create a file which begin with `cron.` in the `cron` directory at the root of your server.

```js
// cron/cron.myCron.js
const hearthjs = require('hearthjs')

hearthjs.cron.add('myCron', '* * * * *', () => {
  // cron action
}, { start: true })
```

- The first parameter is the `cron name`. It's thanks to this name that you will be able to execute actions on it later.
- The second parameter is the cron expression. To execute cron, we use the `node-cron` modules. You can find the cron syntax in this [documentation](https://www.npmjs.com/package/node-cron#cron-syntax).
- The third parameter is the action to execute.
- The fourth parameter are options and is optional. You can add an object with `start` key and set it to `true` if you want run your cron when your server start.

### Manage crons

You can manage your cron thanks to their names.

#### Start a cron

```js
const hearthjs = require('hearthjs')

hearthjs.cron.start('myCron')
```

#### Stop a cron

```js
const hearthjs = require('hearthjs')

hearthjs.cron.stop('myCron')
```

#### Get cron action

The cron action allows you to execute your cron manually.

In the following example, we are getting the cron named "myCron", and execute it one time manually.

```js
const hearthjs = require('hearthjs')

let func = hearthjs.cron.getAction('myCron')

func() // Execute cron action
```

At your cron declaration, you can pass parameter to the action. The action **can't** receive parameters when it executes itself but you can send parameters to your action when you get it with the `getAction` function.

**Warning: The `start`, `stop` and `getAction` function throw error if your cron name does not exists**

*Note: when you clusterize your server, crons are executed only one time in the leader thread*
