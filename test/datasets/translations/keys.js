const hearth = require('../../../lib/index')
const translate = require('../../../lib/translate')
const t = translate.t
const cluster = require('cluster')

const schemas = {
  getSchemaA: {
    before: (req, res, next) => {
      next(t('Error...'))
    }
  },

  schema: {
    before: (req, res, next) => {
      return res.send(t('Hello', 'en'))
    }
  },

  crash: {
    before: (req, res, next) => {
      process.exit(1)
    }
  },

  user: {
    before: (req, res, next) => {
      let _id = null

      if (cluster.worker) {
        _id = cluster.worker.id
      }
      console.log(t('Hello  |/ \\ my,?!:+-*=0 1 2 3 frien', 'en'))
      return res.json({ id: _id })
    }
  }
}

hearth.api.define('api2', schemas, (server) => {
  server.get('/from-api2', 'schema')
  server.get('/crash', 'crash')
  server.get('/user', 'user')
})
