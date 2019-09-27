const path = require('path')

let apiPath = path.join(__dirname, 'simpleApi.js')

module.exports = {
  apis: [apiPath],

  prefix: '',

  getName: function (apiName) {
    return this.prefix + '-' + apiName
  }
}
