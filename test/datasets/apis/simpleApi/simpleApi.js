const hearth = require('../../../../lib/index')
const externApi = require('.')

const schemas = {
  getSchemaA: {
    successMsg: 'Nice'
  },

  schema: {
    before: (req, res, next) => {
      return res.send('Hello')
    }
  }
}

hearth.api.define(externApi.getName('simpleApi'), schemas, (server) => {
  server.get('/simple-api/nice', 'getSchemaA')
  server.get('/simple-api/hello', 'schema')
})
