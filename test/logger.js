/* eslint-env mocha */
const logger = require('../lib/logger')
const assert = require('assert')
const path = require('path')
const fs = require('fs')
const sinon = require('sinon')
const mockdate = require('mockdate')
const app = require('../lib/')
const request = require('request')
const { spawn } = require('child_process')

let program = null

describe('Logger', () => {
  before(() => {
    process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
  })

  after(() => {
    mockdate.reset()
  })

  describe('Log request', () => {
    const _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', '08-01-2019.log')

    before((done) => {
      mockdate.set(new Date('08/01/2019'))
      app.run('prod', process.env.HEARTH_SERVER_PATH, { port: 8080 }, done)
    })

    after((done) => {
      mockdate.reset()
      fs.unlinkSync(_logFilePath)
      app.close(done)
    })

    it('should log request in log file', (done) => {
      request.get('http://localhost:8080/user', (err, response) => {
        assert.strictEqual(err, null)
        let _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent.includes('GET /user started'), true)
        assert.strictEqual(_logContent.includes('GET /user ended in'), true)
        assert.strictEqual(_logContent.includes('(200)'), true)
        assert.strictEqual(_logContent.includes('08-01-2019 00:00:00 INFO Request'), true)
        done()
      })
    })
  })

  describe('Log request crash', () => {
    let _logFilePath = null

    before((done) => {
      _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)
      executeCluster('prod', '4', '8080', done)
    })

    after((done) => {
      fs.unlinkSync(_logFilePath)
      stopCluster(done)
    })

    it('should log the started crash request', (done) => {
      request.get('http://localhost:8080/crash', () => {
        let _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent.includes('GET /crash started'), true)
        assert.strictEqual(_logContent.includes('GET /crash ended in'), false)
        assert.strictEqual(_logContent.includes('(400)'), false)
        done()
      })
    })
  })

  describe('Log clusterize', () => {
    let _logFilePath = null

    before((done) => {
      _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)
      executeCluster('prod', '4', '8080', done)
    })

    after((done) => {
      fs.unlinkSync(_logFilePath)
      stopCluster(done)
    })

    it('should log the started crash request', (done) => {
      const _nbQueries = 50
      let _nbWaited = 50

      for (let i = 0; i < _nbQueries; i++) {
        request.get('http://localhost:8080/user', () => {
          _nbWaited -= 1

          if (_nbWaited === 0) {
            const _logContent = fs.readFileSync(_logFilePath, 'utf8')
            const count = (_logContent.match(/\n/g) || []).length

            assert.strictEqual(count > 100, true)
            done()
          }
        })
      }
    })
  })

  describe('Dev mode', () => {
    const _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', '08-01-2019.log')

    let _logSpy = null
    let _errorSpy = null

    before(() => {
      mockdate.set(new Date('08/01/2019'))
      _logSpy = sinon.spy(console, 'log')
      _errorSpy = sinon.spy(console, 'error')
    })

    after(() => {
      mockdate.reset()
      console.log.restore()
      console.error.restore()
    })

    afterEach(() => {
      _logSpy.resetHistory()
      _errorSpy.resetHistory()

      if (fs.existsSync(_logFilePath)) {
        fs.unlinkSync(_logFilePath)
      }
    })

    it('should log in log file and display it with console.log', (done) => {
      logger.initLogger('dev')
      const _expectLog = '08-01-2019 00:00:00 INFO Test'
      logger.log('Test', 'info')
      assert.strictEqual(_logSpy.called, true)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, `${_expectLog}\n`)
        done()
      }, 30)
    })

    it('should log in log file and display it with console.error', (done) => {
      const _expectLog = '08-01-2019 00:00:00 ERROR Test'
      logger.initLogger('dev')
      logger.log('Test', 'error')
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, true)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, `${_expectLog}\n`)
        done()
      }, 30)
    })

    it('should debug with debug lib and not console.log', (done) => {
      logger.initLogger('dev')
      logger.debug('Debug message')
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, '')
        done()
      }, 30)
    })
  })

  describe('Prod mode', () => {
    const _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', '08-01-2019.log')

    let _logSpy = null
    let _errorSpy = null

    before(() => {
      mockdate.set(new Date('08/01/2019'))
      _logSpy = sinon.spy(console, 'log')
      _errorSpy = sinon.spy(console, 'error')
    })

    after(() => {
      mockdate.reset()
      console.log.restore()
      console.error.restore()
    })

    afterEach(() => {
      _logSpy.resetHistory()
      _errorSpy.resetHistory()

      if (fs.existsSync(_logFilePath)) {
        fs.unlinkSync(_logFilePath)
      }
    })

    it('should log in log file only', (done) => {
      logger.initLogger('prod')
      const _expectLog = '08-01-2019 00:00:00 INFO Test'
      logger.log('Test', 'info')
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, `${_expectLog}\n`)
        done()
      }, 30)
    })

    it('should log in log file only 2', (done) => {
      const _expectLog = '08-01-2019 00:00:00 ERROR Test'
      logger.initLogger('prod')
      logger.log('Test', 'error')
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, `${_expectLog}\n`)
        done()
      }, 30)
    })

    it('should not log debug and don\'t call debug', (done) => {
      logger.initLogger('prod')
      logger.debug('Debug message')
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, '')
        done()
      }, 30)
    })
  })

  describe('Options', () => {
    const _logFilePath = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', '08-01-2019.log')

    let _logSpy = null
    let _errorSpy = null

    before(() => {
      mockdate.set(new Date('08/01/2019'))
      _logSpy = sinon.spy(console, 'log')
      _errorSpy = sinon.spy(console, 'error')
    })

    after(() => {
      mockdate.reset()
      console.log.restore()
      console.error.restore()
    })

    afterEach(() => {
      _logSpy.resetHistory()
      _errorSpy.resetHistory()

      if (fs.existsSync(_logFilePath)) {
        fs.unlinkSync(_logFilePath)
      }
    })

    it('should log only message', (done) => {
      logger.initLogger('dev')
      const _expectLog = 'Test'
      logger.log('Test', 'info', { logDate: false })
      assert.strictEqual(_logSpy.called, true)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, `${_expectLog}\n`)
        done()
      }, 30)
    })

    it('should not log if mustLog is false', (done) => {
      logger.initLogger('dev')
      logger.log('Test', 'info', { mustLog: false })
      assert.strictEqual(_logSpy.called, false)
      assert.strictEqual(_errorSpy.called, false)

      setTimeout(() => {
        logger._stop()
        const _logContent = fs.readFileSync(_logFilePath, 'utf8')
        assert.strictEqual(_logContent, '')
        done()
      }, 30)
    })
  })

  describe('Delete old logs', () => {
    const _logDirectory = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs')

    before(() => {
      mockdate.set(new Date('08/01/2019'))
      fs.writeFileSync(path.join(_logDirectory, '07-31-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-30-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-29-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-28-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-27-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-26-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-25-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-24-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '07-23-2019.log'), 'Data logged')
      fs.writeFileSync(path.join(_logDirectory, '06-01-2019.log'), 'Data logged')
    })

    after(() => {
      mockdate.reset()
      if (fs.existsSync(path.join(_logDirectory, '08-02-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '08-02-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '08-01-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '08-01-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-31-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-31-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-30-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-30-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-29-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-29-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-28-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-28-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-27-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-27-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-26-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-26-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-25-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-25-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-24-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-24-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '07-23-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '07-23-2019.log')) }
      if (fs.existsSync(path.join(_logDirectory, '06-01-2019.log'))) { fs.unlinkSync(path.join(_logDirectory, '06-01-2019.log')) }
    })

    it('should create a new file on a new day and delete log file too old', (done) => {
      logger._deleteOldLog()

      setTimeout(() => {
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-31-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-30-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-29-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-28-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-27-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-26-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-25-2019.log')), true)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-24-2019.log')), false)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '07-23-2019.log')), false)
        assert.strictEqual(fs.existsSync(path.join(_logDirectory, '06-01-2019.log')), false)
        done()
      }, 30)
    })
  })
})

/**
 * Launch server with nbCluster
 * @param {String} nbCluster Number of cluster to start
 * @param {String} port Application port
 * @param {Function} callback
 */
function executeCluster (mode, nbCluster, port, callback) {
  const _serverPath = path.join(__dirname, 'datasets', 'myApp', 'server')
  const binPath = path.join(__dirname, '..', 'bin', 'hearthjs')

  program = spawn(binPath, ['start', mode, '--cluster', nbCluster, '--port', port], { cwd: _serverPath })
  program.stdout.pipe(process.stdout)
  program.stderr.pipe(process.stderr)

  setTimeout(() => {
    return callback()
  }, 1500)
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
