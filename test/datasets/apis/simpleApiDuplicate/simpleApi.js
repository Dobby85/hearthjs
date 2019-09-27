const hearth = require('../../../../lib/index')
const externApi = require('.')

const schemas = {
  getSchemaA: {
    successMsg: 'Nice2'
  },

  schema: {
    before: (req, res, next) => {
      return res.send('Hello')
    }
  }
}

hearth.api.define(externApi.getName('simpleApi'), schemas, (server) => {
  server.get('/simple-api-duplicate/nice', 'getSchemaA')
  server.get('/simple-api-duplicate/hello', 'schema')
})
