## Helpers

### Access environment mode

You can access easily the current environment mode with hearthjs.

```js
const hearthjs = require('hearthjs')

console.log(hearthjs.env) // Display test, dev or prod
```

### Handle promise error

Hearthjs has a little function which permit you to handle async/await error easily.

```js
const hearthjs = require('hearthjs')
const handle = hearthjs.helpers.handlePromiseError

let promiseFunc = // A promise function

let { error, data } = handle(promiseFunc)

if (error) {
  // Handle error here
}

// No error, you can access data
```

With this function you don't need to add a `try catch` for all your promises. And you can always know from which function the error is coming from.

### Generic queue

You know calling a callback in a loop is not a good idea and you have to create recursive function to loop on your array. This time is done. Now you can use a `genericQueue`!

#### How it works?

It's simple, hearthjs will create an object which will call one of your callback for each item.

Here is the genericQueue prototype

```js
hearthjs.helpers.genericQueue(items, itemHandler, errorHandler, callback)
```

An example will be clearer than text:

```js
const hearthjs = require('hearthjs')

let myArray = ['value1', 'value2', 'value3']

let genericQueue = hearthjs.helpers.genericQueue(myArray, (item, next) => {
  // You will receive one by one each item of your array (value1, value2, value3)
  // You must call next when you finish processing your item
  // You can pass an error to next callback
}, (error) => {
  // Handle errors here
}, () => {
  // This callback is called when we stop looping on the array
})
```

**WARNING: The genericQueue shift element of the array one by one. Take care of cloning your array before sending it to the genericQueue if you want to reuse it after.**

```js
// Clone an array
let clonedArray = JSON.parse(JSON.stringify(arrayToClone))
```

```js
const hearthjs = require('hearthjs')

let myArray = ['value1', 'value2', 'value3']
let concatenateValues = ''

let genericQueue = hearthjs.helpers.genericQueue(myArray, (item, next) => {
  concatenateValues += item + ' '
}, (error) => {
  // Handle errors here
}, () => {
  console.log(concatenateValues) // display: value1 value2 value3 
})
```
