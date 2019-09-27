## Logger

A logger is include in hearthjs. It allows to keep traces of everything on your server. All logs are in the `logs` directory at the root of your `server` directory.

The logger logs all request. For each requests, you can find two lines in the log file. One for the beginning of the request and another for the end. So if one of your request crash, you can now it.

*Note: An unique ID is associate to each request so you can easily find the start and the end of your request*

You also have the following information for each request:
- The date time
- The method
- The URL
- The status code
- The duration of the request
- The unique ID

The logger act differently between the `debug` and the `start` mode. If you start your application with the `debug` command of hearthjs CLI, your will see all your logs in your console and in the logs file. But when you start the application with the `start` command of hearthjs CLI, nothing is display in the console. All logs are only in the log file.

Hearthjs keep 7 days of log. A new log file is created everyday.

### Log message

You can also log message anywhere in your server. This message will appear in your log file.

```js
const hearthjs = require('hearthjs')

hearthjs.logger.log('My message to log')
```

The function can take 3 parameters. Only the first one is mandatory.

- The first parameter is the message to log.
- The second parameter is the level of log. It can be `info`, `warn` or `error`. If no parameter is send, the level will be `info`
- The third parameter is an option object.

```js
{
  mustLog: true, // A boolean can be set here. The message will be logged only if the value is true.
  logDate: true // Use only for console log in debug mode. It removes the date and the level.
}
```

### Debug message

If you prefer use the the [debug](https://www.npmjs.com/package/debug) package, you can use the following function.

```js
const hearthjs = require('hearthjs')

hearthjs.logger.debug('My message to debug')
```

This debug logs are display in the console in debug mode.

**Warning: All debug logs are not write in log file**
