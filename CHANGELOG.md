# HearthJS

### v1.2.0
- Watch following files when launching `./hearthjs test` command.
  - `/api/**/test/test.*.js`
  - `/api/**/api.*.js`
  - `/api/**/sql/*.sql`
  - `/test/test.*.js`
- Correct errors in documentation
- Data validation: Correct date type validation. Accet any valid date.
- `./hearthjs test` crash on first failed test
- translations: Check value is not empty. If the value is empty, the key is returned.
- Add http client for tests. It is possible to create instance of login user to execute authenticated request.

### v1.1.0
- Add init function (beforeInit, init and after init)
- Correct translations regex. Now it match space, `.`, `,`, `/`, `\`, `|`, `?`, `!`, `:`, `+`, `-`, `*`, `=`
- Improve test documentation
- Add documentation on server
- Data validation: type date accepts date object

### v1.0.1
- Update main in package.json

### v1.0.0
- Add first version of hearthjs
- Add Logger
- Add API declaration
- Add Database management
- Add Cron
- Add Translations
- Add Data mapping
- Add Data validation
- Add Documentation
- Add Addons
- Add Extern API declaration
