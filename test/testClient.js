/* eslint-env mocha */
const app = require('../lib/')
const assert = require('assert')
const path = require('path')
const fs = require('fs')
const logger = require('../lib/logger')
const TestClient = require('../lib/testClient')
const request = require('request')

describe('Test client', () => {
  before((done) => {
    process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'testClientApp', 'server')
    app.run('test', process.env.HEARTH_SERVER_PATH, done)
  })

  after((done) => {
    app.close(() => {
      const _logFile = path.join(__dirname, 'datasets', 'testClientApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

      if (fs.existsSync(_logFile)) {
        fs.unlinkSync(_logFile)
      }
      done()
    })
  })

  it('should not access authenticated route without login', (done) => {
    let user = new TestClient('test@test.fr', 'Nope')

    user.get('/test', (err, response, body) => {
      assert.strictEqual(err, null)
      assert.strictEqual(body.success, false)
      assert.strictEqual(body.message, 'You are not login')
      done()
    })
  })

  it('should login a user and access get /test and logout him', (done) => {
    let user = new TestClient('test@test.fr', 'Nope')

    user.login((err, response, body) => {
      assert.strictEqual(err, null)
      assert.strictEqual(body.success, true)
      assert.strictEqual(body.message, 'Connected')

      user.get('/test', (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah get')

        user.logout((err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          assert.strictEqual(body.message, 'Disconnected')

          user.get('/test', (err, response, body) => {
            assert.strictEqual(err, null)
            assert.strictEqual(body.success, false)
            done()
          })
        })
      })
    })
  })

  it('should login a user and access get /test and ', (done) => {
    let user = new TestClient('test@test.fr', 'Nope')

    user.login((err, response, body) => {
      assert.strictEqual(err, null)
      assert.strictEqual(body.success, true)
      assert.strictEqual(body.message, 'Connected')

      user.get('/test', (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah get')
        done()
      })
    })
  })

  it('should override login route', (done) => {
    let user = new TestClient('test@test.fr', 'Nope')

    user.login('/nope', (err) => {
      assert.notStrictEqual(err, null)
      done()
    })
  })

  describe('Keep session', () => {
    let user = new TestClient('test@test.fr', 'pass')
    let user2 = new TestClient('test@test.fr', 'pass')

    before((done) => {
      user.login((err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        user2.login((err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          done()
        })
      })
    })

    after((done) => {
      user.logout((err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        user2.logout((err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          done()
        })
      })
    })

    it('should get route for two users', (done) => {
      user.get('/test', (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah get')
        user2.get('/test', (err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          assert.strictEqual(body.message, 'Yeah get')
          done()
        })
      })
    })

    it('should post route for two users', (done) => {
      user.post('/test', { data: 'toto' }, (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah post toto')
        user2.post('/test', { data: 'tata' }, (err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          assert.strictEqual(body.message, 'Yeah post tata')
          done()
        })
      })
    })

    it('should put route for two users', (done) => {
      user.put('/test', { data: 'titi' }, (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah put titi')
        user2.put('/test', { data: 'tutu' }, (err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          assert.strictEqual(body.message, 'Yeah put tutu')
          done()
        })
      })
    })

    it('should delete route for two users', (done) => {
      user.del('/test', (err, response, body) => {
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Yeah del')
        user2.del('/test', (err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          assert.strictEqual(body.message, 'Yeah del')
          done()
        })
      })
    })

    it('should execute an unwrapped request', (done) => {
      request.get({
        url: user.getCompleteUrl('/test')
      }, (err, response, body) => {
        body = JSON.parse(body)
        assert.strictEqual(err, null)
        assert.strictEqual(body.success, false)
        request.get({
          url: user.getCompleteUrl('/test'),
          headers: {
            Cookie: user.cookie
          }
        }, (err, response, body) => {
          body = JSON.parse(body)
          assert.strictEqual(err, null)
          assert.strictEqual(body.success, true)
          done()
        })
      })
    })
  })
})
