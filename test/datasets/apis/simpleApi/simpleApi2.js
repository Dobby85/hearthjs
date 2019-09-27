const hearth = require('../../../../lib/index')
const externApi = require('.')

const schemas = {
  getSchemaA: {
    successMsg: '2'
  }
}

hearth.api.define(externApi.getName('simpleApi2'), schemas, (server) => {
  server.get('/simple-api-2', 'getSchemaA')
})
