/* eslint-env mocha */
const app = require('../lib/')
const assert = require('assert')
const path = require('path')
const request = require('request')
const externSimpleApi = require('./datasets/apis/simpleApi')
const externSimpleApiDuplicate = require('./datasets/apis/simpleApiDuplicate')
const externApiInit = require('./datasets/apis/externApiInit')
const externApiAddon = require('./datasets/apis/externAddonApi')
const sinon = require('sinon')
const logger = require('../lib/logger')
const fs = require('fs')

describe('Extern API', () => {
  before(() => {
    process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'externApiApp', 'server')
  })

  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'externApiApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Run app', () => {
    beforeEach(() => {
      sinon.stub(process, 'exit')
      app.server._addons = []
      app.server._apis = []
    })

    afterEach((done) => {
      delete require.cache[require.resolve('./datasets/externApiApp/server/api/api1/api.api1.js')]
      delete require.cache[require.resolve('./datasets/apis/simpleApi/simpleApi.js')]
      process.exit.restore()
      app.server._addons = []
      app.server._apis = []
      app.close(() => {
        done()
      })
    })

    it('should load a simple extren api and access extern route', (done) => {
      app.useApi(externSimpleApi, 'myPrefix')
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)

        request.get(app.server.getEndpoint() + 'extern/from-api1', function (err, response, body) {
          assert.strictEqual(err, null)
          assert.strictEqual(body, 'OUAH')
          request.get(app.server.getEndpoint() + 'simple-api/nice', function (err, response, body) {
            assert.strictEqual(err, null)
            body = JSON.parse(body)
            assert.strictEqual(body.success, true)
            assert.strictEqual(body.message, 'Nice')
            request.get(app.server.getEndpoint() + 'simple-api/hello', function (err, response, body) {
              assert.strictEqual(err, null)
              assert.strictEqual(body, 'Hello')
              request.get(app.server.getEndpoint() + 'simple-api-2', function (err, response, body) {
                assert.strictEqual(err, null)
                body = JSON.parse(body)
                assert.strictEqual(body.success, true)
                assert.strictEqual(body.message, '2')
                done()
              })
            })
          })
        })
      })
    })
  })

  describe('Prefix', () => {
    beforeEach(() => {
      sinon.stub(process, 'exit')
      app.server._addons = []
      app.server._apis = []
    })

    afterEach((done) => {
      delete require.cache[require.resolve('./datasets/externApiApp/server/api/api1/api.api1.js')]
      delete require.cache[require.resolve('./datasets/apis/simpleApi/simpleApi.js')]
      process.exit.restore()
      app.server._addons = []
      app.server._apis = []
      app.close(() => {
        done()
      })
    })

    it('should not load API if no prefix has been provided', (done) => {
      app.useApi(externSimpleApi)
      assert.strictEqual(process.exit.calledWith(1), true)
      done()
    })

    it('should not load two API with the same name', (done) => {
      app.useApi(externSimpleApi, 'pre')
      app.useApi(externSimpleApiDuplicate, 'pre')
      assert.strictEqual(process.exit.calledWith(1), true)
      done()
    })

    it('should load two API with the same name and different prefix', (done) => {
      app.useApi(externSimpleApi, 'pre')
      app.useApi(externSimpleApiDuplicate, 'pre2')
      assert.strictEqual(process.exit.called, false)
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)

        request.get(app.server.getEndpoint() + 'extern/from-api1', function (err, response, body) {
          assert.strictEqual(err, null)
          assert.strictEqual(body, 'OUAH')
          request.get(app.server.getEndpoint() + 'simple-api/nice', function (err, response, body) {
            assert.strictEqual(err, null)
            body = JSON.parse(body)
            assert.strictEqual(body.success, true)
            assert.strictEqual(body.message, 'Nice')
            request.get(app.server.getEndpoint() + 'simple-api-duplicate/nice', function (err, response, body) {
              assert.strictEqual(err, null)
              body = JSON.parse(body)
              assert.strictEqual(body.success, true)
              assert.strictEqual(body.message, 'Nice2')
              done()
            })
          })
        })
      })
    })
  })

  describe('Initialization', () => {
    beforeEach(() => {
      sinon.stub(process, 'exit')
      app.server._addons = []
      app.server._apis = []
    })

    afterEach((done) => {
      delete require.cache[require.resolve('./datasets/externApiApp/server/api/api1/api.api1.js')]
      process.exit.restore()
      app.server._addons = []
      app.server._apis = []
      app.close(() => {
        done()
      })
    })

    it('should init database and call init function', (done) => {
      app.useApi(externApiInit, 'prefix')
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)

        app.db.query('SELECT * FROM "ExternTable"', (err, res, rows) => {
          assert.strictEqual(err, null)
          assert.strictEqual(rows.length, 1)
          assert.strictEqual(rows[0].name, 'test')

          app.db.query('DROP TABLE "ExternTable";', () => {
            request.get(app.server.getEndpoint() + 'extern/from-api1', function (err, response, body) {
              assert.strictEqual(err, null)
              assert.strictEqual(body, 'OUAH')
              request.get(app.server.getEndpoint() + 'extern-api-init/name', function (err, response, body) {
                assert.strictEqual(err, null)
                body = JSON.parse(body)
                assert.strictEqual(body.success, true)
                assert.strictEqual(body.message, 'OULALALA')
                done()
              })
            })
          })
        })
      })
    })
  })

  describe('Addon', () => {
    beforeEach(() => {
      sinon.stub(process, 'exit')
      app.server._addons = []
      app.server._apis = []
    })

    afterEach((done) => {
      delete require.cache[require.resolve('./datasets/externApiApp/server/api/api1/api.api1.js')]
      process.exit.restore()
      app.server._addons = []
      app.server._apis = []
      app.close(() => {
        done()
      })
    })

    it('should init database and call init function', (done) => {
      app.useApi(externApiAddon, 'prefix')
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)
        request.get(app.server.getEndpoint() + 'extern/from-api1', function (err, response, body) {
          assert.strictEqual(err, null)
          assert.strictEqual(body, 'OUAH')
          request.post({
            url: app.server.getEndpoint() + 'extern-api-addon',
            form: {
              mail: 'test@test.fr'
            }
          }, function (err, response, body) {
            assert.strictEqual(err, null)
            body = JSON.parse(body)
            assert.strictEqual(body.success, true)
            assert.strictEqual(body.message, 'OK')
            request.post({
              url: app.server.getEndpoint() + 'extern-api-addon',
              form: {
                mail: 'test.fr'
              }
            }, function (err, response, body) {
              assert.strictEqual(err, null)
              body = JSON.parse(body)
              assert.strictEqual(body.success, false)
              assert.strictEqual(body.message, 'Invalid mail')
              done()
            })
          })
        })
      })
    })
  })
})
