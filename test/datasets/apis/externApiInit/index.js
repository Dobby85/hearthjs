const path = require('path')

let apiPath = path.join(__dirname, 'externApiInit.js')

module.exports = {
  apis: [apiPath],

  name: null,

  prefix: '',

  init: function (database, callback) {
    this.name = 'OULALALA'
    callback(null)
  },

  getName: function (apiName) {
    return this.prefix + '-' + apiName
  },

  initDatabase: path.join(__dirname, 'init.sql')
}
