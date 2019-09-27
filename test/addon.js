/* eslint-env mocha */
const app = require('../lib/')
const assert = require('assert')
const path = require('path')
const request = require('request')
const validateMailAddon = require('./datasets/addons/validateMailAddon')
const roleAddon = require('./datasets/addons/roleAddon')
const roleAddon2 = require('./datasets/addons/roleAddon2')
const errorAddon = require('./datasets/addons/errorAddon')
const sinon = require('sinon')
const logger = require('../lib/logger')
const fs = require('fs')

describe('Addons', () => {
  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'addonApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Part 1', () => {
    before((done) => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'addonApp', 'server')
      app.useAddon(validateMailAddon)
      app.useAddon(roleAddon)
      app.run('test', process.env.HEARTH_SERVER_PATH, done)
    })

    after((done) => {
      app.db.query('DROP TABLE IF EXISTS "RoleTest"', () => {
        app.close(done)
      })
    })

    it('should save all roles in RoleTest', (done) => {
      app.db.query('SELECT "role", "route" FROM "RoleTest" ORDER BY "role", "route"', (err, res, rows) => {
        assert.strictEqual(err, null)
        assert.strictEqual(rows.length, 5)
        assert.deepStrictEqual(rows[0], { role: 'ADMIN', route: '/schema-b' })
        assert.deepStrictEqual(rows[1], { role: 'NONAME', route: '/schema-c' })
        assert.deepStrictEqual(rows[2], { role: 'UNKNOWN', route: '/schema-c' })
        assert.deepStrictEqual(rows[3], { role: 'USER', route: '/schema-b' })
        assert.deepStrictEqual(rows[4], { role: 'USER', route: '/schema-c' })
        done()
      })
    })

    it('should acces route /schema-b', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'schema-b'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Nice')
        done()
      })
    })

    it('should not acces route /schema-c', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'schema-c'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.strictEqual(body.success, false)
        assert.strictEqual(body.message, 'Only ADMIN can access')
        done()
      })
    })

    it('should validate email', (done) => {
      request.post({
        url: app.server.getEndpoint() + 'schema-a',
        form: {
          mail: 'toto@gmail.com'
        }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yes')
        done()
      })
    })

    it('should not validate email', (done) => {
      request.post({
        url: app.server.getEndpoint() + 'schema-a',
        form: {
          mail: 'totogmail.com'
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

  describe('Part 2: Error', () => {
    beforeEach(() => {
      sinon.stub(process, 'exit')
    })

    afterEach(() => {
      process.exit.restore()
      app.server._addons = []
    })

    it('should exit if addons does not have name', (done) => {
      app.useAddon(errorAddon)
      assert(process.exit.calledWith(1))
      done()
    })

    it('should exit if two addons have the same name', (done) => {
      app.useAddon(roleAddon)
      app.useAddon(roleAddon2)
      assert(process.exit.calledWith(1))
      done()
    })

    it('should use schemaKeyName define in useAddon', (done) => {
      app.useAddon(roleAddon, 'myName')
      app.useAddon(roleAddon2, 'oulala')
      assert.strictEqual(app.server._addons.length, 2)
      assert.strictEqual(app.server._addons[0].schemaKeyName, 'myName')
      assert.strictEqual(app.server._addons[1].schemaKeyName, 'oulala')
      done()
    })
  })
})
