## Data validation

HearthJS can validate your data if you declare them in your schema. The object declaration looks like the converter except do not declare the field name. You can add multiple check by field.

```js
let in = {
  name: ['>', 5, 'startsWith', 'Account'],
  age: ['>=', 18]
}
```

Here, if name does not start with `Account` or if it has a length inferior or equals to 5, an error will be returned.

### Default value

**Warning**: If you set fields in your `in` schema, your data are required. If they are not in the body, an error will be returned.

To avoid that, you can specify a `default value` which will be added to your body.

Example:

```js
let in = {
  name: ['default', 'accountName', '>', 5, 'startsWith', 'Account'],
  age: ['>=', 18]
}
```

Here, if no field name is send in body, hearthjs will add a field name with `accountName` as value.

### Validation type

##### Comparaison

You can use `<`, `<=`, `>`, `>=` or `==` to check number's value of string's length.

```js
let in = {
  age: ['>', 18, '<', 60]
}
```

##### Start/End with

You can `startsWith` or `endsWith` to check a string starts or ends with a specified value.

```js
let in = {
  firstname: ['startsWith', 'Jo', 'endsWith', 'hn']
}
```

##### Regex

You can use `regex` to check a field match.

```js
let in = {
  specific: ['regex', '^\\S+\\.\\S+$']
}
```

##### Type

You can use specific type:

- **date** Check date is valid
- **url** Check the url format
- **mail** Check mail format
- **phone** Check phone format looks like `0000000000`, `00.00.00.00.00` or `00 00 00 00 00`
- **ipAddress** Check IP address format

```js
let in = {
  mail: ['type', 'mail'],
  phone: ['type', 'phone']
}
```

##### Function

You can add your own function validation. If you want valid your field, you must return `true`, else, if you want return an error, you must return this object:

```js
{
  valid: false,
  message: 'Error message'
}
```

```js
const myValidator = function (elem) {
  if (elem.length < 5) {
    return {
      valid: false,
      message: 'Firstname is too short. 5 characters minimum.'
    }
  }
  return true
}

let in = {
  firstname: ['function', myValidator]
}
```

### Error message

You can specified error message for each field with the keywork `errorMessage`. Or you can be more precise by setting a message for each validation type. You can add keyword `error${validationType}Message`. For example, you can add `error>=Message`, `errortypeMessage`, `errorregexMessage`...

```js
let in = {
  mail: ['type', 'mail', 'errorMessage', 'Invalid mail']
}

// OR

let in = {
  firstname: ['>', '5', '<', '20', 'error>Message', 'Must be greater than 5 characters', 'error<Message', 'Must be smaller than 20 characters']
}
```
