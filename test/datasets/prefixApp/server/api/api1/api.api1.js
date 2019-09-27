const hearth = require('../../../../../../lib/index')

const schemas = {
  schema: {
    before: (req, res, next) => {
      return res.send('OUAH')
    }
  }
}

hearth.api.define('api2', schemas, (server) => {
  server.get('/extern/from-api1', 'schema')
})
