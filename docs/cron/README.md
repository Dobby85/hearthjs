## Cron

You can add cron and manage them easily in your application.

### Add a cron

To add a cron, you must create a file which begin with `cron.` in the `cron` directory at the route of your server.

```js
// cron/cron.myCron.js
const hearthjs = require('hearthjs')

hearthjs.cron.add('myCron', '* * * * *', () => {
  // cron action
}, { start: true })
```

- The first parameter is the `cron name`. It's thanks to this name that you could execute action on it later.
- The second parameter is the cron expression. To execute cron, we use the `node-cron` modules. You can find in it's [documentation](https://www.npmjs.com/package/node-cron#cron-syntax) the cron syntax.
- The third parameter is the action to execute.
- The fourth parameter are options and is optional. You can add an object with `start` key and set it to `true` if you want run your cron when your server start.

### Manage crons

You can manage your cron thanks to their name.

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

You can get a cron action if you need to execute one time in your application.

```js
const hearthjs = require('hearthjs')

let func = hearthjs.cron.getAction('myCron')

func() // Execute cron action
```

At your cron declaration, you can pass parameter to the action. The action **can't** receive parameter when it executes itself but you can send parameter to your action when you get it with the `getAction` function.

**Warning: The `start`, `stop` and `getAction` function throw error if your cron name does not exists**

*Note: when you clusterize your server, crons are executed only one time in the leader thread*
