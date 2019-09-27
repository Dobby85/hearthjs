/* eslint-env mocha */
const cron = require('../lib/cron')
const assert = require('assert')
const path = require('path')
const fs = require('fs')
const app = require('../lib/')
const request = require('request')
const { spawn } = require('child_process')
const logger = require('../lib/logger')

let program = null

describe('Cron', () => {
  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'cronApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Load cron', () => {
    const pathCron1 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron1')
    const pathCron2 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron2')

    before(() => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'cronApp', 'server')
    })

    after(() => {
      if (fs.existsSync(pathCron1)) {
        fs.unlinkSync(pathCron1)
      }
      if (fs.existsSync(pathCron2)) {
        fs.unlinkSync(pathCron2)
      }
      cron._cronList = {}
    })

    it('should load cron and start them', (done) => {
      cron.loadCron((err) => {
        assert.strictEqual(err, null)
        assert.strictEqual(Object.keys(cron._cronList).length, 2)
        setTimeout(() => {
          cron.stop('testCron')
          cron.stop('testCron2')
          const contentCron1 = fs.readFileSync(pathCron1, 'utf8')
          const contentCron2 = fs.readFileSync(pathCron2, 'utf8')
          assert.strictEqual(contentCron1, 'Test cron')
          assert.strictEqual(contentCron2, 'Test cron 2')
          done()
        }, 1000)
      })
    })
  })

  describe('Run server', () => {
    const pathCron1 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron1')
    const pathCron2 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron2')

    before(() => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'cronApp', 'server')
    })

    after((done) => {
      if (fs.existsSync(pathCron1)) {
        fs.unlinkSync(pathCron1)
      }
      if (fs.existsSync(pathCron2)) {
        fs.unlinkSync(pathCron2)
      }
      app.close(done)
    })

    it('should start server and load cron on startup', (done) => {
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)
        assert.notStrictEqual(app.cron._cronList['testCron'], undefined)
        assert.notStrictEqual(app.cron._cronList['testCron2'], undefined)
        setTimeout(() => {
          let content1 = fs.readFileSync(pathCron1, 'utf8')
          let content2 = fs.readFileSync(pathCron2, 'utf8')
          assert.strictEqual(content1, 'Test cron')
          assert.strictEqual(content2, 'Test cron 2')
          done()
        }, 1000)
      })
    })
  })

  describe('Run clusterize server', () => {
    const pathCron1 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron1')
    const pathCron2 = path.join(__dirname, 'datasets', 'cronApp', 'server', 'cron', 'cron2')

    before(() => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'cronApp', 'server')
    })

    afterEach((done) => {
      if (fs.existsSync(pathCron1)) {
        fs.unlinkSync(pathCron1)
      }
      if (fs.existsSync(pathCron2)) {
        fs.unlinkSync(pathCron2)
      }
      stopCluster(done)
    })

    it('should start server with 4 clusters, run cron, crash all process and continue running cron', (done) => {
      let _nbQueries = 300
      let _waitedResponse = _nbQueries

      let crash = () => {
        request.get('http://localhost:8080/crash', function (err, response, body) {
          assert.notStrictEqual(err, null)
          _waitedResponse -= 1
          if (_waitedResponse === 0) {
            _endOfTest()
          }
        })
      }

      let sendRequest = () => {
        request.get('http://localhost:8080/user', function (err, response, body) {
          assert.strictEqual(err, null)
          _waitedResponse -= 1
          if (_waitedResponse === 0) {
            _endOfTest()
          }
        })
      }

      let _endOfTest = () => {
        _waitedResponse = _nbQueries
        fs.unlinkSync(pathCron1)
        fs.unlinkSync(pathCron2)

        setTimeout(() => {
          let content1 = fs.readFileSync(pathCron1, 'utf8')
          let content2 = fs.readFileSync(pathCron2, 'utf8')
          assert.strictEqual(content1, 'Test cron')
          assert.strictEqual(content2, 'Test cron 2')
          done()
        }, 1000)
      }

      executeCluster('4', '8080', () => {
        setTimeout(() => {
          let content1 = fs.readFileSync(pathCron1, 'utf8')
          let content2 = fs.readFileSync(pathCron2, 'utf8')
          assert.strictEqual(content1, 'Test cron')
          assert.strictEqual(content2, 'Test cron 2')

          for (let i = 0; i < _nbQueries; i++) {
            // Crash server every 20 * 10ms
            if (i % 20 === 0) {
              setTimeout(crash, 10 * i)
            } else {
              setTimeout(sendRequest, 10 * i)
            }
          }
        }, 1000)
      })
    }).timeout(8000)
  })

  describe('Function add, start, stop and getAction', () => {
    const filePath = path.join(__dirname, 'cronFile')

    afterEach(() => {
      if (cron._cronList['myCron']) {
        cron._cronList['myCron'].cron.destroy()
        cron._cronList = {}
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })

    it('should add a cron and start it automatically', () => {
      cron.add('myCron', '* * * * *', () => {}, { start: true })
      assert.notStrictEqual(cron._cronList['myCron'], undefined)
      assert.strictEqual(cron._cronList['myCron'].cron.status, 'scheduled')
    })

    it('should throw an error if cron already exists', () => {
      cron.add('myCron', '* * * * *', () => {})
      assert.throws(() => {
        cron.add('myCron', '* * * * *', () => {})
      }, Error, 'A cron myCron has already been declared')
    })

    it('should add a cron but not start it', () => {
      cron.add('myCron', '* * * * *', () => {})
      assert.notStrictEqual(cron._cronList['myCron'], undefined)
      assert.strictEqual(cron._cronList['myCron'].cron.status, undefined)
    })

    it('should throw an error if start is called for an unknown cron', () => {
      assert.throws(() => {
        cron.start('myCron')
      }, Error, 'Unknow cron myCron')
    })

    it('should throw an error if stop is called for an unknown cron', () => {
      assert.throws(() => {
        cron.stop('myCron')
      }, Error, 'Unknow cron myCron')
    })

    it('should throw an error if getAction is called for an unknown cron', () => {
      assert.throws(() => {
        cron.getAction('myCron')
      }, Error, 'Unknow cron myCron')
    })

    it('should add a cron start and stop it', () => {
      cron.add('myCron', '* * * * *', () => {})
      cron.start('myCron')
      assert.notStrictEqual(cron._cronList['myCron'], undefined)
      assert.strictEqual(cron._cronList['myCron'].cron.status, 'scheduled')
      cron.stop('myCron')
      assert.strictEqual(cron._cronList['myCron'].cron.status, 'stoped')
    })

    it('should return the action and we could execute it', () => {
      cron.add('myCron', '* * * * *', () => {
        fs.writeFileSync(filePath, 'Yoo')
      }, { start: true })
      assert.notStrictEqual(cron._cronList['myCron'], undefined)
      let func = cron.getAction('myCron')
      func()
      let content = fs.readFileSync(filePath, 'utf8')
      assert.strictEqual(content, 'Yoo')
    })
  })
})

/**
 * Launch server with nbCluster
 * @param {String} nbCluster Number of cluster to start
 * @param {String} port Application port
 * @param {Function} callback
 */
function executeCluster (nbCluster, port, callback) {
  const _serverPath = path.join(__dirname, 'datasets', 'cronApp', 'server')
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
