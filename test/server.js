/* eslint-env mocha */
const app = require('../lib/')
const assert = require('assert')
const path = require('path')
const request = require('request')
const fs = require('fs')
const server = require('../lib/server')
const { spawn } = require('child_process')
const logger = require('../lib/logger')

let program = null

describe('Server', () => {
  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Load config', () => {
    before(() => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'configApp', 'server')
      server._serverPath = process.env.HEARTH_SERVER_PATH
    })

    it('should load test config', (done) => {
      server._loadConfig('test', {}, (err) => {
        assert.strictEqual(err, null)
        assert.strictEqual(server.config.APP_SERVER_PORT, 8080)
        done()
      })
    })

    it('should return an error if a mandatory key is missing', (done) => {
      server.config = {}
      server._loadConfig('test1', {}, (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })

    it('should return an error if config file does not exists', (done) => {
      server.config = {}
      server._loadConfig('notexists', {}, (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })
  })

  describe('Init functions', () => {
    before(function (done) {
      fs.copyFile(path.join(__dirname, 'datasets', 'indexFiles', 'basicIndex.js'), path.join(__dirname, 'datasets', 'myApp', 'server', 'index.js'), (err) => {
        assert.strictEqual(err, null)
        process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
        app.run('test', process.env.HEARTH_SERVER_PATH, done)
      })
    })

    after((done) => {
      fs.unlinkSync(path.join(__dirname, 'datasets', 'myApp', 'server', 'index.js'))
      fs.unlinkSync(path.join(__dirname, 'datasets', 'myApp', 'server', 'test.test'))
      app.close(done)
    })

    it('should have call all init functions', () => {
      const content = fs.readFileSync(path.join(__dirname, 'datasets', 'myApp', 'server', 'test.test'), 'utf8')
      assert.strictEqual(content, 'OlatchoupifinalInit')
    })
  })

  describe('Init functions 2', () => {
    before(function (done) {
      fs.copyFile(path.join(__dirname, 'datasets', 'indexFiles', 'middlewareIndex.js'), path.join(__dirname, 'datasets', 'myApp', 'server', 'index.js'), (err) => {
        assert.strictEqual(err, null)
        process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
        app.run('test', process.env.HEARTH_SERVER_PATH, done)
      })
    })

    after((done) => {
      fs.unlinkSync(path.join(__dirname, 'datasets', 'myApp', 'server', 'index.js'))
      app.close(done)
    })

    it('should add a middleware', (done) => {
      request.get(app.server.getEndpoint() + 'user', function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(response.body, 'Pass to middleware')
        done()
      })
    })
  })

  describe('API', function () {
    before(function (done) {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
      app.run('test', process.env.HEARTH_SERVER_PATH, done)
    })

    after((done) => {
      app.close(done)
    })

    it('should serve schema-a route which return an error', function (done) {
      request.get(app.server.getEndpoint() + 'schema-a', function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.strictEqual(body.success, false)
        assert.strictEqual(body.message, 'Error...')
        done()
      })
    })

    it('should serve schema-b route which return a message', (done) => {
      request.get(app.server.getEndpoint() + 'schema-b', function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'Coucou')
        done()
      })
    })

    it('should serve schema-c route which call before and after', (done) => {
      request.get(app.server.getEndpoint() + 'schema-c', function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'ououlela')
        done()
      })
    })

    it('should not server /error', (done) => {
      request.get(app.server.getEndpoint() + 'error', function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body.includes('Cannot GET /error'), true)
        done()
      })
    })

    it('should post data and use them', (done) => {
      request.post({
        url: app.server.getEndpoint() + 'schema-d',
        form: {
          value1: 'val1',
          value2: 'val2',
          value3: 'val3'
        }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'val1val2val3')
        done()
      })
    })

    it('should put data and use them', (done) => {
      request.put({
        url: app.server.getEndpoint() + 'schema-e',
        form: {
          value1: '1',
          value2: '2',
          value3: '3'
        }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, '123')
        done()
      })
    })

    it('should use delete method', (done) => {
      request.delete({
        url: app.server.getEndpoint() + 'schema-f/42'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, '42')
        done()
      })
    })

    it('should pass through middleware', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'middleware'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'value')
        done()
      })
    })

    it('should upload file', (done) => {
      let req = request.post({
        url: app.server.getEndpoint() + 'upload-file'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'file.txt')
        done()
      })
      req.form().append('file', 'John Doe', {
        filename: 'file.txt',
        contentType: 'text/plain'
      })
    })

    it('should upload file', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'empty-schema'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.strictEqual(body.success, true)
        assert.strictEqual(body.message, 'Great!')
        done()
      })
    })

    it('should execute a function and not a schema', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'func'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'OK!')
        done()
      })
    })

    it('should get result from api2', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'from-api2'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'Hello')
        done()
      })
    })

    it('should validate in data', (done) => {
      let accounts = [{
        name: 'Account1',
        users: [{
          firstname: 'John',
          mail: 'john@gmail.com'
        }, {
          firstname: 'Jooohn',
          mail: 'jooohn@gmail.com'
        }]
      }]

      request.post({
        url: app.server.getEndpoint() + 'schema-with-in',
        json: { accounts: accounts }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(body, {
          success: true,
          data: { accounts: accounts },
          message: ''
        })
        done()
      })
    })

    it('should return error on firstname in data', (done) => {
      let accounts = [{
        name: 'Account1',
        users: [{
          firstname: 'Jhn',
          mail: 'john@gmail.com'
        }, {
          firstname: 'Jooohn',
          mail: 'jooohn@gmail.com'
        }]
      }]

      request.post({
        url: app.server.getEndpoint() + 'schema-with-in',
        json: { accounts: accounts }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(body, {
          success: false,
          data: {},
          message: '4 char min'
        })
        done()
      })
    })

    it('should return error on mail in data', (done) => {
      let accounts = [{
        name: 'Account1',
        users: [{
          firstname: 'John',
          mail: 'johngmail.com'
        }, {
          firstname: 'Jooohn',
          mail: 'jooohn@gmail.com'
        }]
      }]

      request.post({
        url: app.server.getEndpoint() + 'schema-with-in',
        json: { accounts: accounts }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(body, {
          success: false,
          data: {},
          message: 'mail johngmail.com is an invalid mail.'
        })
        done()
      })
    })

    it('should return an error when there is an in schema with a GET', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'get-with-in'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, {
          success: false,
          data: {},
          message: 'Error: Missing key firstname in data'
        })
        done()
      })
    })

    it('should add route even if it does not start with /', (done) => {
      request.get({
        url: app.server.getEndpoint() + 'forgot-slash'
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, 'OK!')
        done()
      })
    })
  })

  describe('Error duplicate API', () => {
    before((done) => {
      app.run('test', path.join(__dirname, 'datasets', 'errorApp', 'server'), done)
    })

    after((done) => {
      app.close(done)
    })

    it('should not declare two times API with same name', () => {
      assert.strictEqual(Object.keys(app.api._apiList.api2.routes).length, 1)
    })
  })

  describe('Errors', () => {
    afterEach((done) => {
      app.close(done)
    })

    it('should not run the server if database does not exists', (done) => {
      let badConfig = {
        APP_SERVER_PORT: 8080,
        APP_HTTPS: false,
        APP_DATABASE_HOST: 'localhost',
        APP_DATABASE_NAME: 'unknown_database',
        APP_DATABASE_PASSWORD: 'password',
        APP_DATABASE_PORT: 5432,
        APP_DATABASE_TIMEOUT: 30000,
        APP_DATABASE_USERNAME: 'postgres'
      }
      fs.writeFileSync(path.join(__dirname, 'datasets', 'errorConfigApp', 'server', 'config', 'test.json'), JSON.stringify(badConfig, null, 4), 'utf-8')
      app.run('test', path.join(__dirname, 'datasets', 'errorConfigApp', 'server'), (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })

    it('should not run the server if config is not a JSON file', (done) => {
      let badConfig = 'coucou'
      fs.writeFileSync(path.join(__dirname, 'datasets', 'errorConfigApp', 'server', 'config', 'test.json'), badConfig, 'utf-8')
      app.run('test', path.join(__dirname, 'datasets', 'errorConfigApp', 'server'), (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })
  })

  describe('Database timeout', () => {
    it('should set a default timeout of 10s', (done) => {
      let badConfig = {
        APP_SERVER_PORT: 8080,
        APP_HTTPS: false,
        APP_DATABASE_HOST: 'localhost',
        APP_DATABASE_NAME: 'hearth_test',
        APP_DATABASE_PASSWORD: 'password',
        APP_DATABASE_PORT: 5432,
        APP_DATABASE_USERNAME: 'postgres'
      }
      app.server.config = {}
      fs.writeFileSync(path.join(__dirname, 'datasets', 'errorConfigApp', 'server', 'config', 'test.json'), JSON.stringify(badConfig, null, 4), 'utf-8')
      app.run('test', path.join(__dirname, 'datasets', 'errorConfigApp', 'server'), (err) => {
        assert.strictEqual(err, null)
        app.db.query('SHOW statement_timeout;', (err, res, rows) => {
          assert.strictEqual(err, null)
          assert.strictEqual(rows[0].statement_timeout, '10s')
          app.close(done)
        })
      })
    })

    it('should set timeout of config file', (done) => {
      let badConfig = {
        APP_SERVER_PORT: 8080,
        APP_HTTPS: false,
        APP_DATABASE_HOST: 'localhost',
        APP_DATABASE_NAME: 'hearth_test',
        APP_DATABASE_PASSWORD: 'password',
        APP_DATABASE_PORT: 5432,
        APP_DATABASE_TIMEOUT: 30000,
        APP_DATABASE_USERNAME: 'postgres'
      }
      fs.writeFileSync(path.join(__dirname, 'datasets', 'errorConfigApp', 'server', 'config', 'test.json'), JSON.stringify(badConfig, null, 4), 'utf-8')
      app.run('test', path.join(__dirname, 'datasets', 'errorConfigApp', 'server'), (err) => {
        assert.strictEqual(err, null)
        app.db.query('SHOW statement_timeout;', (err, res, rows) => {
          assert.strictEqual(err, null)
          assert.strictEqual(rows[0].statement_timeout, '30s')
          app.close(done)
        })
      })
    })
  })

  describe('API with SQL', () => {
    before((done) => {
      app.run('test', path.join(__dirname, 'datasets', 'mySQLApp', 'server'), (err) => {
        if (err) {
          return done(err)
        }
        app.datasets.clean(done)
      })
    })

    after((done) => {
      app.close(done)
    })

    it('should request schema-a and SQL query with after', (done) => {
      let expected = {
        success: true,
        data: {
          person: 'John Doe'
        },
        message: 'Success'
      }

      request.get(app.server.getEndpoint() + 'schema-a', function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should request schema-a and SQL query alone', (done) => {
      let expected = {
        success: true,
        data: [{
          firstname: 'John',
          lastname: 'Doe'
        }],
        message: ''
      }

      request.get(app.server.getEndpoint() + 'schema-b', function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should not replace data if they wad not sent to next', (done) => {
      let expected = {
        success: true,
        data: [{
          firstname: 'John',
          lastname: 'Doe'
        }],
        message: ''
      }

      request.get(app.server.getEndpoint() + 'schema-c', function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, expected)
        done()
      })
    })

    it('should execute a query in function without schema', (done) => {
      request.get(app.server.getEndpoint() + 'func2', function (err, response, body) {
        assert.strictEqual(err, null)
        assert.strictEqual(body, '3')
        done()
      })
    })

    it('should execute a query and format returned data', (done) => {
      request.get(app.server.getEndpoint() + 'schema-d', function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, {
          success: true,
          data: {
            firstname: 'John',
            lastname: 'Doe',
            age: 20
          },
          message: ''
        })
        done()
      })
    })

    it('should execute a query with req params and format returned data', (done) => {
      request.post({
        url: app.server.getEndpoint() + 'my-post-e',
        form: {
          firstname: 'John',
          lastname: 'Doe',
          mail: 'john.doe@gmail.com',
          age: '42'
        }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, {
          success: true,
          data: {
            firstname: 'John',
            lastname: 'Doe',
            mail: 'john.doe@gmail.com',
            age: 42
          },
          message: 'yeees'
        })
        done()
      })
    })

    it('should not crash if data does not exists', (done) => {
      request.post({
        url: app.server.getEndpoint() + 'my-post-e',
        form: {
          id: 1
        }
      }, function (err, response, body) {
        assert.strictEqual(err, null)
        body = JSON.parse(body)
        assert.deepStrictEqual(body, {
          success: true,
          data: {
            firstname: null,
            lastname: null,
            mail: null,
            age: null
          },
          message: 'yeees'
        })
        done()
      })
    })
  })

  describe('Clustering', () => {
    before((done) => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
      done()
    })

    afterEach((done) => {
      stopCluster(done)
    })

    it('should not start a cluster when --cluster = 0', (done) => {
      executeCluster('0', '8080', () => {
        request.get('http://localhost:8080/user', (err, response, body) => {
          body = JSON.parse(body)
          assert.strictEqual(err, null)
          assert.strictEqual(body.id, null)
          done()
        })
      })
    })

    it('should take the port send via CLI', (done) => {
      executeCluster('1', '4000', () => {
        request.get('http://localhost:4000/user', (err, response, body) => {
          assert.strictEqual(err, null)
          assert.strictEqual(/"id":\d}/.test(response.body), true)
          done()
        })
      })
    })

    it('should load balance between all workers 2 workers', (done) => {
      executeCluster('2', '8080', () => {
        let _nbQueries = 200
        let _waitedResponse = _nbQueries
        let _workerResponse = { 1: 0, 2: 0 }

        let test = (err, response, body) => {
          assert.strictEqual(err, null)
          body = JSON.parse(body)
          _workerResponse[body.id] += 1
          _waitedResponse -= 1

          if (_waitedResponse === 0) {
            assert.strictEqual(_workerResponse[1] > 80, true)
            assert.strictEqual(_workerResponse[2] > 80, true)
            assert.strictEqual(_workerResponse[1] + _workerResponse[2], _nbQueries)
            done()
          }
        }

        for (let i = 0; i < _nbQueries; i++) {
          request.get('http://localhost:8080/user', test)
        }
      })
    })

    it('should overwrite number of cluster via CLI and load balance between them', (done) => {
      executeCluster('4', '8080', () => {
        let _nbQueries = 200
        let _waitedResponse = _nbQueries
        let _workerResponse = { 1: 0, 2: 0, 3: 0, 4: 0 }

        let test = (err, response, body) => {
          assert.strictEqual(err, null)
          body = JSON.parse(body)
          _workerResponse[body.id] += 1
          _waitedResponse -= 1

          if (_waitedResponse === 0) {
            assert.strictEqual(_workerResponse[1] > 30, true)
            assert.strictEqual(_workerResponse[2] > 30, true)
            assert.strictEqual(_workerResponse[3] > 30, true)
            assert.strictEqual(_workerResponse[4] > 30, true)
            assert.strictEqual(_workerResponse[1] + _workerResponse[2] + _workerResponse[3] + _workerResponse[4], _nbQueries)
            done()
          }
        }

        for (let i = 0; i < _nbQueries; i++) {
          request.get('http://localhost:8080/user', test)
        }
      })
    })

    it('should restart automatically when a worker die. It should still have 4 workers at the end', (done) => {
      executeCluster('4', '8080', () => {
        let _nbQueries = 200
        let _waitedResponse = _nbQueries
        let _workerResponse = {}
        let _nbSuccess = 0
        let _nbCrash = 0

        let crash = () => {
          request.get('http://localhost:8080/crash', function (err, response, body) {
            assert.notStrictEqual(err, null)
            _waitedResponse -= 1
            _nbCrash += 1
            if (_waitedResponse === 0) {
              _endOfTest()
            }
          })
        }

        let sendRequest = () => {
          request.get('http://localhost:8080/user', function (err, response, body) {
            assert.strictEqual(err, null)
            _waitedResponse -= 1
            _nbSuccess += 1
            if (_waitedResponse === 0) {
              _endOfTest()
            }
          })
        }

        let callback = (err, response, body) => {
          assert.strictEqual(err, null)
          body = JSON.parse(body)
          _waitedResponse -= 1

          if (_workerResponse[body.id]) {
            _workerResponse[body.id] += 1
          } else {
            _workerResponse[body.id] = 1
          }

          if (_waitedResponse === 0) {
            let _nbActiveWorker = 0
            let _total = 0

            for (let _workerId in _workerResponse) {
              _nbActiveWorker += 1
              _total += _workerResponse[_workerId]
            }
            assert.strictEqual(_nbActiveWorker, 4)
            assert.strictEqual(_total, _nbQueries)
            done()
          }
        }

        let _endOfTest = () => {
          assert.strictEqual(_nbSuccess + _nbCrash, _nbQueries)
          _waitedResponse = _nbQueries

          // Wait until all workers are restarted for the test
          setTimeout(() => {
            for (let i = 0; i < _nbQueries; i++) {
              request.get('http://localhost:8080/user', callback)
            }
          }, 200)
        }

        for (let i = 0; i < _nbQueries; i++) {
          // Crash server every 20 * 10ms
          if (i % 20 === 0) {
            setTimeout(crash, 10 * i)
          } else {
            setTimeout(sendRequest, 10 * i)
          }
        }
      })
    }).timeout(5000)
  })
})

/**
 * Launch server with nbCluster
 * @param {String} nbCluster Number of cluster to start
 * @param {String} port Application port
 * @param {Function} callback
 */
function executeCluster (nbCluster, port, callback) {
  const _serverPath = path.join(__dirname, 'datasets', 'myApp', 'server')
  const binPath = path.join(__dirname, '..', 'bin', 'hearthjs')

  program = spawn(binPath, ['start', 'prod', '--cluster', nbCluster, '--port', port], { cwd: _serverPath })
  program.stdout.pipe(process.stdout)
  program.stderr.pipe(process.stderr)

  setTimeout(() => {
    return callback()
  }, 1000)
}

/**
 * Stop started cluster
 * @param {Function} callback
 */
function stopCluster (callback) {
  if (program) {
    process.kill(program.pid)
    program = null
  }

  setTimeout(() => {
    return callback()
  }, 200)
}
