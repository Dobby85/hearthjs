## Translations

You can easily translate all your string with hearthjs.

### How it works?

All your translations are in the `lang` directory located at the root of your `server` directory. A lang file is a `json` composed of `key`/`value`.

```json
# fr.json
{
  "hello": "bonjour",
  "yes": "oui",
  "no": "non"
}
```

To use this keys, you can call the `t` function in hearthjs.

```js
const hearthjs = require('hearthjs')
const t = hearthjs.t

t('hello') // return bonjour
```

This function check if you translate the key and return you the translated value. By default, it takes the server default language which is declared by the key `APP_SERVER_LANG`.

*Note: If the key is not found in your lang files, the `t` function return your key.*

### Dynamic translations

For example, if you want that each of your user could choose it's language, you can send a second parameter to the `t` function. This is the wanted lang. This parameter override the default lang.

```js
const hearthjs = require('hearthjs')
const t = hearthjs.t

t('hello', 'es') // return hola
```

### CLI

Hearthjs has a `translate` command to find all string surrounded by the `t` function and add them in your lang files.

```bash
./hearthjs translate [lang]
```

The `lang` parameter is optional. If it's not defined, keys will be added in all lang files which are in your `lang` directory. Then you have just to complete the empty translations.

Several options are available:

- **-d** or **--delete** This option deleted all keys in your lang files which has not been found in your server files *Default: false*
- **-r** or **--recursive** This option active or deactivate the folder recursivity *Default: true*
- **-p** or **--path** This option change the search path. It must start from the server folder *Default: /*
- **-v** or **--verbose** This option add verbosity. Three levels are available: 1, 2 or 3 *Default: 0*

**WARNING: If you update the path and active the delete option, you will delete all the keys which are not in your path**

```bash
# We search recursively from the api folder, display founded keys and update all lang files
./hearthjs translate -p ./server/api -v 2 -d
```
