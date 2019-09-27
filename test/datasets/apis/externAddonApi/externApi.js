const hearth = require('../../../../lib/index')
const externApi = require('.')

const schemas = {
  getSchemaA: {
    checkMail: true,
    successMsg: 'OK'
  }
}

hearth.api.define(externApi.getName('externApi'), schemas, (server) => {
  server.post('/extern-api-addon', 'getSchemaA')
})
