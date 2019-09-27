/* eslint-env mocha */
const datasets = require('../lib/datasets')
const assert = require('assert')
const app = require('../lib')
const path = require('path')
const database = require('../lib/database')
const fs = require('fs')
const logger = require('../lib/logger')

describe('Datasets', () => {
  before((done) => {
    process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'datasetsApp', 'server')
    app.run('test', process.env.HEARTH_SERVER_PATH, done)
  })

  after((done) => {
    const _logFile = path.join(__dirname, 'datasets', 'datasetsApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }

    database.query('DROP TABLE "MyTable3", "MyTable2", "MyTable"', () => {
      app.close(done)
    })
  })

  it('should insert dataset1 and clean it after', (done) => {
    datasets.insert(['dataset1'], (err) => {
      assert.strictEqual(err, null)
      database.query('SELECT * FROM "MyTable"', (err, res, rows) => {
        assert.strictEqual(err, null)
        assert.strictEqual(rows.length, 3)
        datasets.clean((err) => {
          assert.strictEqual(err, null)
          database.query('SELECT * FROM "MyTable"', (err, res, rows) => {
            assert.strictEqual(err, null)
            assert.strictEqual(rows.length, 0)
            done()
          })
        })
      })
    })
  })

  it('should insert multiple datasets and clean them after', (done) => {
    datasets.insert(['dataset1', 'dataset2'], (err) => {
      assert.strictEqual(err, null)
      database.query('SELECT * FROM "MyTable"', (err, res, rows) => {
        assert.strictEqual(err, null)
        assert.strictEqual(rows.length, 3)
        database.query('SELECT * FROM "MyTable2"', (err, res, rows) => {
          assert.strictEqual(err, null)
          assert.strictEqual(rows.length, 4)
          database.query('SELECT * FROM "MyTable3"', (err, res, rows) => {
            assert.strictEqual(err, null)
            assert.strictEqual(rows.length, 2)
            datasets.clean((err) => {
              assert.strictEqual(err, null)
              database.query('SELECT * FROM "MyTable2"', (err, res, rows) => {
                assert.strictEqual(err, null)
                assert.strictEqual(rows.length, 0)
                done()
              })
            })
          })
        })
      })
    })
  })
})
