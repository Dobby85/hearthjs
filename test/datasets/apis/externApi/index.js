const path = require('path')

let apiPath = path.join(__dirname, 'externApi.js')

module.exports = {
  apis: [apiPath],

  prefix: '',
  addons: [{
    addon: null,
    schemaKeyName: ''
  }],

  init: function (database, callback) {
  },

  getName: function (apiName) {
    return this.prefix + '-' + apiName
  },

  initDatabase: '/path/to/myFile.sql'
}
