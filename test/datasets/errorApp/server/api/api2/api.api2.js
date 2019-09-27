const hearth = require('../../../../../../lib/index')

const schemas = {
  getSchemaA: {
    before: (req, res, next) => {
      next('Error...')
    }
  },

  schema: {
    before: (req, res, next) => {
      return res.send('Hello')
    }
  }
}

hearth.api.define('api2', schemas, (server) => {
  server.get('/from-api2', 'schema')
})
