const hearth = require('../../../../../../lib/index')

const schemas = {
  getSchemaA: {
    validateMail: true,
    in: {
      mail: []
    },
    successMsg: 'Yes'
  },

  getSchemaB: {
    roles: ['ADMIN', 'USER'],
    successMsg: 'Nice'
  },

  getSchemaC: {
    roles: ['USER', 'NONAME', 'UNKNOWN'],
    successMsg: 'Oups'
  }
}

hearth.api.define('ApiName', schemas, (server) => {
  server.post('/schema-a', 'getSchemaA')
  server.get('/schema-b', 'getSchemaB')
  server.get('/schema-c', 'getSchemaC')
})
