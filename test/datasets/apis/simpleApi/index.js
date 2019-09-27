const path = require('path')

let apiPath = path.join(__dirname, 'simpleApi.js')
let apiPath2 = path.join(__dirname, 'simpleApi2.js')

module.exports = {
  apis: [apiPath, apiPath2],

  prefix: '',

  getName: function (apiName) {
    return this.prefix + '-' + apiName
  }
}
