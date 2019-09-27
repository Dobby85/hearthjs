const hearth = require('../../../../../../lib/index')

const schemas = {
  getSchemaA: {
    query: 'schemaA',
    after: (req, res, data, next) => {
      let newData = {
        person: data[0].firstname + ' ' + data[0].lastname
      }
      next(null, newData)
    },
    successMsg: 'Success'
  },

  getSchemaB: {
    query: 'schemaA'
  },

  getSchemaC: {
    query: 'schemaA',
    after: (req, res, data, next) => {
      next()
    }
  },

  getSchemaD: {
    out: ['object', {
      firstname: ['<firstname>'],
      lastname: ['<lastname>'],
      age: ['<age>']
    }],
    query: 'schemaD'
  },

  getSchemaE: {
    out: ['object', {
      firstname: ['<firstname>'],
      lastname: ['<lastname>'],
      mail: ['<mail>'],
      age: ['<age>']
    }],
    query: 'schemaE',
    successMsg: 'yeees'
  },

  errorSchema: {
    out: ['object', {
      id: ['<<id>>']
    }],
    query: 'schemaE'
  },

  schemaWithFunction: {
    function: myFunc
  }
}

hearth.api.define('ApiName', schemas, (server) => {
  server.get('/schema-a', 'getSchemaA')
  server.get('/schema-b', 'getSchemaB')
  server.get('/schema-c', 'getSchemaC')
  server.get('/schema-d', 'getSchemaD')
  server.get('/func2', 'schemaWithFunction')
  server.post('/my-post-e', 'getSchemaE')
  server.post('/error-schema', 'errorSchema')
})

function myFunc (req, res) {
  hearth.db.query('SELECT 3 AS number', (err, result, rows) => {
    if (err) {
      res.send(err.toString())
    }
    res.send(rows[0].number.toString())
  })
}
