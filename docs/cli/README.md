## CLI

To simplify tasks, you can add you own command line to the hearthjs binary.  
To do it, add an `index.js` file in the `server/commands/` folder. This file must export the list of your command.

```js
// server/commands/index.js
const commands = [{
  name: '',        // Your command name
  description: '', // Your command description
  path: ''         // The absolute path to your executable file
}]

module.exports = commands
```

To work, `hearthjs` use `commander` to exeucte commands. The path of the command is an executable file which contains your command details. It should looks like this:

```js
#!/usr/bin/env node
const program = require('commander')

program
  .arguments('<arg>')
  .action((arg) => {
    // Execute your logic here
  })
  .parse(process.argv)
```

You can customize your command as you want. For more details, check the `commander` [documentation](https://www.npmjs.com/package/commander).

*Note: The file must be an executable file.*
