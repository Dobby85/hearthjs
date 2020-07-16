
const hearthjs = require('../../../../lib')

const server = {
  init: function (server, callack) {
    server.use(hearthjs.express.urlencoded({ extended: false }))
    server.use(hearthjs.express.json())
    return callack(null)
  }
}

module.exports = server
