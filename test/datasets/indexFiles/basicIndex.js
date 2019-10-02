const fs = require('fs')
const path = require('path')

const server = {
  beforeInit: function (callback) {
    fs.writeFile(path.join(__dirname, 'test.test'), 'Ola', callback)
  },

  init: function (server, callback) {
    fs.appendFile(path.join(__dirname, 'test.test'), 'tchoupi', callback)
  },

  afterInit: function (server, callback) {
    fs.appendFile(path.join(__dirname, 'test.test'), 'finalInit', callback)
  }
}

module.exports = server
