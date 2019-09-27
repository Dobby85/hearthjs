# HearthJS

Create REST Api application really fast. It offers many tools that simplify REST Api development.

## Installation

```bash
npm i hearthjs
```

## Getting started

The easiest way to run the server is by using command line.

```bash
./hearthjs debug dev
# OR
./hearthjs start prod
```

But you can also run the server programtically.

Run the server by calling `hearthjs.run`. It takes two arguments:
- **env** Your environment (test/dev/prod)
- **serverPath** Path to the server directory

```js
const hearthjs = require('hearthjs')

hearthjs.run('dev', path.join(__dirname, 'path', 'to', 'your', 'directory'), (err) => {
  if (err) {
    console.error(err)
  }
})
```

**Warning: Don't forget to set the environment variable `HEARTH_SERVER_PATH`**

```js
process.env.HEARTH_SERVER_PATH = path.join('path', 'to', 'my', 'server', 'directory')
```
