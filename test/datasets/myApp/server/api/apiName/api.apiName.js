const hearth = require('../../../../../../lib/index')
const t = require('../../../../../../lib/translate').t
const multer = require('multer')

let upload = multer({ dest: '../uploads/' })

let myMiddleware = function (req, res, next) {
  req.val = 'value'
  next()
}

const schemas = {
  getSchemaA: {
    before: (req, res, next) => {
      next(t('Error...', 'fr'), 402)
    }
  },

  getSchemaB: {
    after: (req, res, data, next) => {
      return res.send(t('Coucou', req.lang))
    }
  },

  getSchemaC: {
    before: (req, res, next) => {
      req.msg = t('ououlala')
      next()
    },

    after: (req, res, data, next) => {
      return res.send(req.msg.replace('la', 'le'))
    }
  },

  postSchemaD: {
    before: (req, res, next) => {
      req.value = req.body.value1 + req.body.value2 + req.body.value3
      next()
    },

    after: (req, res, data, next) => {
      return res.send(req.value)
    }
  },

  putSchemaE: {
    before: (req, res, next) => {
      req.value = req.body.value1 + req.body.value2 + req.body.value3
      next()
    },

    after: (req, res, data, next) => {
      return res.send(req.value)
    }
  },

  delSchemaF: {
    before: (req, res, next) => {
      req.value = req.params.id
      next()
    },

    after: (req, res, data, next) => {
      return res.send(req.value)
    }
  },

  testMiddleware: {
    middleware: [myMiddleware],
    before: (req, res, next) => {
      return res.send(req.val)
    }
  },

  uploadFile: {
    middleware: [upload.single('file')],
    before: (req, res, next) => {
      return res.send(req.file.originalname)
    }
  },

  emptySchema: {
    successMsg: t('Great!')
  },

  schemaWithIn: {
    in: ['object', {
      accounts: ['array', {
        name: ['>', '5', 'errorMessage', '> 5'],
        users: ['array', {
          firstname: ['>=', 4, 'startsWith', 'Jo', 'endsWith', 'hn', 'error>=Message', '4 char min', 'errorStartsWithMessage', 'begin with Jo', 'errorendsWithMessage', 'end with hn'],
          mail: ['type', 'mail']
        }]
      }]
    }],

    after: (req, res, data, next) => {
      next(null, 201, req.body)
    }
  },

  getWithIn: {
    in: ['object', {
      firstname: [],
      age: []
    }]
  },

  schemaWithFunction: {
    function: myFunc
  },

  schemaWithRoles: {
    before: (req, res, next) => {
      res.send(t('OK'))
    }
  }
}

hearth.api.define('ApiName', schemas, (server) => {
  server.get('/error')
  server.get('/schema-a', 'getSchemaA')
  server.get('/schema-b', 'getSchemaB')
  server.get('/schema-c', 'getSchemaC')
  server.post('/schema-d', 'postSchemaD')
  server.put('/schema-e', 'putSchemaE')
  server.delete('/schema-f/:id', 'delSchemaF')
  server.get('/middleware', 'testMiddleware')
  server.post('/upload-file', 'uploadFile')
  server.get('/empty-schema', 'emptySchema')
  server.get('/func', 'schemaWithFunction')
  server.post('/schema-with-in', 'schemaWithIn')
  server.get('/get-with-in', 'getWithIn')
  server.get('forgot-slash', 'schemaWithFunction')
  server.get('schema-with-roles', 'schemaWithRoles')
})

function myFunc (req, res) {
  return res.send(t('OK!'))
}
