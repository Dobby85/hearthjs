## Converter

HearthJS can transform your postgreSQL rows in JSON object. You can define object or array.

In this example, we wanna get one account which contain a list of users.

```js
let out = ['object', {
  id: ['<idAccount>'],
  name: ['<accountName>'],
  users: ['array', {
    id: ['<<idUser>>'],
    mail: ['<userMail>']
  }]
}]

// OR

let out = {
  id: ['<idAccount>'],
  name: ['<accountName>'],
  users: [{
    id: ['<<idUser>>'],
    mail: ['<userMail>']
  }]
}

```
With this object we could associate the following SQL request:

```sql
SELECT
  a."id" as "idAccount",
  a."name" as "accountName",
  u."id" as "idUser",
  u."mail" as "userMail"
FROM "Account" a
INNER JOIN "User" u ON a."id" = u."idAccount"
```

You must set your primary keys between `<<` and `>>`, other keys must be between `<` and `>`. The value between chevrons must be the output name in your SQL request. You can set anything you want as key.
If postgres return nothing, the converter will return an empty `array` or an empty `object` depends on what you want.

### Functions

You can call the converter yourself. It takes two arguments. The first is your `output model` and the second is `rows` you want to convert.

```js
const hearthjs = require('hearthjs')

// Run the server...
hearthjs.converter.sqlToJson(model, rows)
```
