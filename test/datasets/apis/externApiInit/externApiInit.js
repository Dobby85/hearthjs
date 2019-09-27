const hearth = require('../../../../lib/index')
const externApi = require('.')

const schemas = {
  getSchemaA: {
    successMsg: externApi.name
  }
}

hearth.api.define(externApi.getName('externApi'), schemas, (server) => {
  server.get('/extern-api-init/name', 'getSchemaA')
})
