## Templating

You can template your `SQL` file with hearthjs. In the `SQL` file of your `query` schema, you have the possibility to access `req` variable from request.

HerathJS does not insert data directly. It transform the query and use `prepared` query of postreSQL.

### Variables

To inject variable, you must use `{{` and `}}`. Between tag, you can set your variable like in javascript.

Data:
```js
let req = {
  body: {
    id: 1
  }
}
```

Template:
```sql
SELECT * FROM "table" WHERE id = {{ data.id }}
```

Result
```sql
SELECT * FROM "table" WHERE id = $1
```

### Conditions

To add conditions, you must use `{#` and `#}`. Between tag, you can set you condition like in javascript. To close the condition, you must use the tag `{{#}}`

Data:
```js
let req = {
  body: {
    role: 'ADMIN',
    id: 1
  }
}
```

Template:
```sql
SELECT "id", "mail"{# data.role === 'ADMIN' #}, "password"{{#}}
FROM "Users"
WHERE id = {{ data.id }}
```

Result:
```sql
SELECT "id", "mail", "password"
FROM "Users"
WHERE id = 1
```

### Loop

To add conditions, you must use `{%` and `%}`. Between tag, you can set you condition loop like in javascript. To close the loop, you must use the tag `{{%}}`

Data:
```js
let req = {
  body: {
    languages: ['NodeJS', 'Python', 'C', 'C++']
  }
}
```

Template:
```sql
INSERT INTO "Languages" ("name") VALUES
{% data.languages %}
  ({{ data.languages[i] }}) {# data.languages[i + 1] !== undefined #}, {{#}}
{{%}}
```

Result:
```sql
INSERT INTO "Languages" ("name") VALUES
('NodeJS'), ('Python'), ('C'), ('C++')
```

### Nested loop

You can make loop in loop. The index begin with `i`. The next nested loop, it index will be `j`, the next one `k`...

Data:
```js
let req = {
  body: {
    accounts: [{
      name: 'Account1',
      users: [{
        firstname: 'John',
        lastname: 'Doe'
      }, {
        firstname: 'Cre',
        lastname: 'Durand'
      }]
    }, {
      name: 'Account2',
      users: [{
        firstname: 'Pierre',
        lastname: 'Dupont'
      }, {
        firstname: 'Tom',
        lastname: 'Benoit'
      }]
    }]
  }
}
```

Template:
```twig
{% data.accounts %}
  Account name: {{ data.accounts[i].name }}
  Users: 
  {% data.accounts[i].users %}
    * {{ data.accounts[i].users[j].firstname }} {{ data.accounts[i].users[j].lastname }}
  {{%}}
{{%}}
```

Result:
```
Account name: Account1
Users:
* John Doe
* Cre Durand
Account name: Account2
Users:
* Pierre Dupont
* Tom Benoit
```

### Include

You can include SQL files in another SQL file by using the following marker: `{->` and `<-}`.

You have to passe the name of a SQL file which is registered when your server is starting.

```sql
WITH insert_value {
  # Execute your insert here
}

{-> getValue <-}
```

This will execute the insert and then the SQL request which is in the `getValue.sql` file.

#### Parameters

You can also send parameters to your includes.

```sql
-- toInclude.sql
SELECT {{ data.parameters[0] }}, {{ data.parameters[1]}}
```

```sql
-- test.sql
{-> toInclude(data.body.firstname, data.body.lastname) <-}
```

In file `toInclude.sql`, value of `data.parameters[0]` will be `data.firstname` and value of `data.parameters[1]` will be `data.lastname`

*You send an unlimited number of parameter*

### Constant

You can add pre-defined constant in your template. If you add an unknown constant, hearthjs will ignore it. You must use `{$` and `$}` to add a constant.

##### PRINT

This constant is a debug constant. When you want debug a template, you can add `{$ PRINT $}`. It will print the final request, their data and data you send it (`req`) in the console.

##### PRINT_READY

This constant is a debug constant. When you want debug a template, you can add `{$ PRINT_READY $}`. It will print the final request filled with data, you just have to copy paste it in your SQL app to try it!

##### ORDER BY

If you have strange result in your final object. The cause is maybe a bad order of data. Add `{$ ORDER BY $}` at the end of your query. This will `ORDER BY` your query with all your primary key. Your primary key must be between `<<` and `>>`

Model:
```js
let out = ['array', {
  id: ['<<idAccount>>'],
  name:: ['<name>'],
  users: ['array', {
    id: ['<<idUser>>'],
    mail: ['<mail>']
  }]
}]
```

Template:
```twig
{$ ORDER BY $}
```

Result:
```sql
ORDER BY "idAccount", "idUser"
```

### Basic replacement

**WARNING: With this method you can be vulnerable to SQL injection**

Instead replace a value with `$1` and send the data in parameter, you can replace the you variable with your value.

This option is available for table name for example.

To do it, add `:hard` after your variable name.

Data:
```js
let req = {
  body: {
    id: 1
  }
}
```

Template:
```sql
SELECT * FROM "table" WHERE id = {{ data.id:hard }}
```

Result
```sql
SELECT * FROM "table" WHERE id = 1
```
