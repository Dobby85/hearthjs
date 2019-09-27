const hearth = require('../../../../lib/index')
const externApi = require('./')

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

hearth.api.define(externApi.getName('externApi'), schemas, (server) => {
  server.get('/extern-api/error', 'getSchemaA')
  server.get('/extern-api/OK', 'schema')
})
