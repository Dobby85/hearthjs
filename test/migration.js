/* eslint-env mocha */
const migration = require('../lib/migration')
const datasets = require('../lib/datasets')
const assert = require('assert')
const app = require('../lib/')
const path = require('path')
const helper = require('../lib/helper')
const database = require('../lib/database')
const fs = require('fs')
const logger = require('../lib/logger')

describe('Migration', () => {
  before(() => {
    process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'migrationApp', 'server')
  })

  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'migrationApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Get file description', () => {
    it('should return the description on the first line', () => {
      let content = '/* Description here */\nINSERT INTO\n/* Commentaire */'

      let desc = migration.getFileDescription(content)
      assert.strictEqual(desc, 'Description here')
    })

    it('should not return description', () => {
      let content = 'Hello\n/* Description here */\nINSERT INTO\n/* Commentaire */'

      let desc = migration.getFileDescription(content)
      assert.strictEqual(desc, '')
    })

    it('should return an empty description', () => {
      let content = '/* */\nINSERT INTO\n/* Commentaire */'

      let desc = migration.getFileDescription(content)
      assert.strictEqual(desc, '')
    })
  })

  describe('Analyze', () => {
    before((done) => {
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)
        datasets.clean(() => {
          datasets.insert(['insertMigration'], done)
        })
      })
    })

    after((done) => {
      migration._state = []
      app.close(done)
    })

    it('should return state', (done) => {
      migration.analyze((err) => {
        assert.strictEqual(err, null)
        assert.strictEqual(migration._state.length, 3)
        assert.deepStrictEqual(migration._state[0], { filenameId: '1', description: 'Description 1', new: false, conflict: false, conflictType: null })
        assert.deepStrictEqual(migration._state[1], { filenameId: '2', description: 'Description 2', new: false, conflict: true, conflictType: 'up' })
        assert.deepStrictEqual(migration._state[2], { filenameId: '3', description: 'Description 3', new: true, conflict: false, conflictType: null })
        done()
      })
    })
  })

  describe('Execute', () => {
    before((done) => {
      app.run('test', process.env.HEARTH_SERVER_PATH, (err) => {
        assert.strictEqual(err, null)
        migration._directory = path.join(__dirname, 'datasets', 'migrations')
        datasets.clean(() => {
          datasets.insert(['executeMigration'], done)
        })
      })
    })

    afterEach((done) => {
      app.db.query('DROP TABLE IF EXISTS "Test", "Test2";', done)
    })

    after((done) => {
      app.close(done)
    })

    it('should execute up state', (done) => {
      let state = {
        filename: '1_up.sql'
      }

      migration._execute(state, () => {}, (err) => {
        assert.strictEqual(err, null)
        app.db.query('SELECT * FROM "Test"', (_, res, rows) => {
          assert.strictEqual(rows[0].label, 10)
          done()
        })
      })
    })

    it('should execute down state with file query', (done) => {
      let downState = {
        filename: '1_down.sql',
        choice: 'F'
      }
      let upState = {
        filename: '1_up.sql'
      }

      // Execute upState
      migration._execute(upState, () => {}, (err) => {
        assert.strictEqual(err, null)
        app.db.query('SELECT * FROM "Test"', (_, res, rows) => {
          assert.strictEqual(rows[0].label, 10)
          // Execute downState
          migration._execute(downState, () => {}, (err) => {
            assert.strictEqual(err, null)
            app.db.query('SELECT * FROM "Test"', (err, res, rows) => {
              assert.notStrictEqual(err, null)
              app.db.query('SELECT * FROM "Test2"', (_, res, rows) => {
                assert.strictEqual(rows[0].label, 100)
                done()
              })
            })
          })
        })
      })
    })

    it('should execute down state with db query with choice', (done) => {
      let downState = {
        filename: '1_down.sql',
        choice: 'f'
      }
      let upState = {
        filename: '1_up.sql'
      }

      // Execute upState
      migration._execute(upState, () => {}, (err) => {
        assert.strictEqual(err, null)
        app.db.query('SELECT * FROM "Test"', (_, res, rows) => {
          assert.strictEqual(rows[0].label, 10)
          // Execute downState
          migration._execute(downState, () => {}, (err) => {
            assert.strictEqual(err, null)
            app.db.query('SELECT * FROM "Test"', (err, res, rows) => {
              assert.notStrictEqual(err, null)
              app.db.query('SELECT * FROM "Test2"', (err, res, rows) => {
                assert.notStrictEqual(err, null)
                done()
              })
            })
          })
        })
      })
    })

    it('should execute down state with db query without choice', (done) => {
      let downState = {
        filename: '1_down.sql'
      }
      let upState = {
        filename: '1_up.sql'
      }

      // Execute upState
      migration._execute(upState, () => {}, (err) => {
        assert.strictEqual(err, null)
        app.db.query('SELECT * FROM "Test"', (_, res, rows) => {
          assert.strictEqual(rows[0].label, 10)
          // Execute downState
          migration._execute(downState, () => {}, (err) => {
            assert.strictEqual(err, null)
            app.db.query('SELECT * FROM "Test"', (err, res, rows) => {
              assert.notStrictEqual(err, null)
              app.db.query('SELECT * FROM "Test2"', (err, res, rows) => {
                assert.notStrictEqual(err, null)
                done()
              })
            })
          })
        })
      })
    })
  })

  describe('Update migration table', () => {
    const serverPath = path.join(__dirname, 'datasets', 'migrationApp2', 'server')
    const migrationDirectory = path.join(serverPath, 'migration')

    before((done) => {
      process.env.HEARTH_SERVER_PATH = serverPath

      helper.loadConfForDatabase('test', (err, databaseConf) => {
        assert.strictEqual(err, null)
        database.init(databaseConf, (err) => {
          assert.strictEqual(err, null)
          migration.init(serverPath, database, (err) => {
            assert.strictEqual(err, null)
            database.query('DELETE FROM hearthjs."migration";', (err) => {
              assert.strictEqual(err, null)
              createMigration(migrationDirectory, '1', 'Up content', 'Down content')
              createMigration(migrationDirectory, '2', 'Up content 2', 'Down content 2')
              createMigration(migrationDirectory, '3', 'Up content 3', 'Down content 3')
              done()
            })
          })
        })
      })
    })

    after((done) => {
      delete process.env.HEARTH_SERVER_PATH
      deleteMigration(migrationDirectory, '1')
      deleteMigration(migrationDirectory, '2')
      deleteMigration(migrationDirectory, '3')
      database.query('DELETE FROM hearthjs."migration";', (err) => {
        assert.strictEqual(err, null)
        database.close(() => {
          done()
        })
      })
    })

    afterEach((done) => {
      database.query('DELETE FROM hearthjs."migration";', (err) => {
        assert.strictEqual(err, null)
        done()
      })
    })

    it('should insert datasets in migration table', (done) => {
      migration._toAdd = [1, 2, 3]
      migration.updateMigrationTable((err) => {
        assert.strictEqual(err, null)
        database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
          assert.strictEqual(err, null)
          assert.strictEqual(result.rows.length, 3)
          assert.deepStrictEqual(result.rows[0], { filename: '1', up: 'Up content', down: 'Down content' })
          assert.deepStrictEqual(result.rows[1], { filename: '2', up: 'Up content 2', down: 'Down content 2' })
          assert.deepStrictEqual(result.rows[2], { filename: '3', up: 'Up content 3', down: 'Down content 3' })
          done()
        })
      })
    })

    it('should delete downgraded migration', (done) => {
      migration._toAdd = [1, 2, 3]
      migration._toDelete = [3, 2]
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration.updateMigrationTable((err) => {
          assert.strictEqual(err, null)
          database.query('SELECT "filename" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
            assert.strictEqual(err, null)
            assert.strictEqual(result.rows.length, 1)
            assert.deepStrictEqual(result.rows[0], { filename: '1' })
            done()
          })
        })
      })
    })
  })

  describe('Execute order', () => {
    const serverPath = path.join(__dirname, 'datasets', 'migrationApp2', 'server')

    before((done) => {
      process.env.HEARTH_SERVER_PATH = serverPath

      helper.loadConfForDatabase('test', (err, databaseConf) => {
        assert.strictEqual(err, null)
        database.init(databaseConf, (err) => {
          assert.strictEqual(err, null)
          migration.init(serverPath, database, (err) => {
            assert.strictEqual(err, null)
            database.query('DELETE FROM hearthjs."migration";', (err) => {
              assert.strictEqual(err, null)
              done()
            })
          })
        })
      })
    })

    after((done) => {
      delete process.env.HEARTH_SERVER_PATH
      database.close(() => {
        done()
      })
    })

    afterEach((done) => {
      migration._state = []
      migration._toExecute = []
      database.query('DELETE FROM hearthjs."migration";', (err) => {
        assert.strictEqual(err, null)
        done()
      })
    })

    it('should return the execute order and save it in migration', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
        { filenameId: '2', description: 'Description 2', new: false, conflict: true },
        { filenameId: '3', description: 'Description 3', new: true, conflict: false }]

      migration.getExecuteOrder(null, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 3)
        assert.strictEqual(order[0].filename, '2_down.sql')
        assert.strictEqual(order[1].filename, '2_up.sql')
        assert.strictEqual(order[2].filename, '3_up.sql')
        done()
      })
    })

    it('should ignore old without conflict and up new', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
        { filenameId: '2', description: 'Description 1', new: false, conflict: false },
        { filenameId: '3', description: 'Description 1', new: false, conflict: false },
        { filenameId: '4', description: 'Description 2', new: true, conflict: false },
        { filenameId: '5', description: 'Description 3', new: true, conflict: false }]

      migration.getExecuteOrder(undefined, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 2)
        assert.strictEqual(order[0].filename, '4_up.sql')
        assert.strictEqual(order[1].filename, '5_up.sql')
        done()
      })
    })

    it('should down and up everything', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: true },
        { filenameId: '2', description: 'Description 1', new: false, conflict: false },
        { filenameId: '3', description: 'Description 1', new: false, conflict: false },
        { filenameId: '4', description: 'Description 2', new: false, conflict: false },
        { filenameId: '5', description: 'Description 3', new: false, conflict: true }]

      migration.getExecuteOrder(null, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 10)
        assert.strictEqual(order[0].filename, '5_down.sql')
        assert.strictEqual(order[1].filename, '4_down.sql')
        assert.strictEqual(order[2].filename, '3_down.sql')
        assert.strictEqual(order[3].filename, '2_down.sql')
        assert.strictEqual(order[4].filename, '1_down.sql')
        assert.strictEqual(order[5].filename, '1_up.sql')
        assert.strictEqual(order[6].filename, '2_up.sql')
        assert.strictEqual(order[7].filename, '3_up.sql')
        assert.strictEqual(order[8].filename, '4_up.sql')
        assert.strictEqual(order[9].filename, '5_up.sql')
        done()
      })
    })

    it('should down and up everything 2', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: true },
        { filenameId: '2', description: 'Description 1', new: true, conflict: false },
        { filenameId: '3', description: 'Description 1', new: false, conflict: true }]

      migration.getExecuteOrder(null, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 5)
        assert.strictEqual(order[0].filename, '3_down.sql')
        assert.strictEqual(order[1].filename, '1_down.sql')
        assert.strictEqual(order[2].filename, '1_up.sql')
        assert.strictEqual(order[3].filename, '2_up.sql')
        assert.strictEqual(order[4].filename, '3_up.sql')
        done()
      })
    })

    it('should up everything', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: true, conflict: false },
        { filenameId: '2', description: 'Description 1', new: true, conflict: false },
        { filenameId: '3', description: 'Description 1', new: true, conflict: false }]

      migration.getExecuteOrder(null, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 3)
        assert.strictEqual(order[0].filename, '1_up.sql')
        assert.strictEqual(order[1].filename, '2_up.sql')
        assert.strictEqual(order[2].filename, '3_up.sql')
        done()
      })
    })

    it('should down and up only last', (done) => {
      migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
        { filenameId: '2', description: 'Description 1', new: false, conflict: false },
        { filenameId: '3', description: 'Description 1', new: false, conflict: true }]

      migration.getExecuteOrder(null, (err, order) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(order, migration._toExecute)
        assert.strictEqual(order.length, 2)
        assert.strictEqual(order[0].filename, '3_down.sql')
        assert.strictEqual(order[1].filename, '3_up.sql')
        done()
      })
    })

    it('should up to the second new version', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: true, conflict: false },
          { filenameId: '5', description: 'Description 1', new: true, conflict: false },
          { filenameId: '6', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('5', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 2)
          assert.strictEqual(order[0].filename, '4_up.sql')
          assert.strictEqual(order[1].filename, '5_up.sql')
          done()
        })
      })
    })

    it('should up to the last new version', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: true, conflict: false },
          { filenameId: '5', description: 'Description 1', new: true, conflict: false },
          { filenameId: '6', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('6', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 3)
          assert.strictEqual(order[0].filename, '4_up.sql')
          assert.strictEqual(order[1].filename, '5_up.sql')
          assert.strictEqual(order[2].filename, '6_up.sql')
          done()
        })
      })
    })

    it('should do nothing if we ask the current version', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: true, conflict: false },
          { filenameId: '5', description: 'Description 1', new: true, conflict: false },
          { filenameId: '6', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('3', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 0)
          done()
        })
      })
    })

    it('should down for conflict and up to the wanted version', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: true },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: true, conflict: false },
          { filenameId: '5', description: 'Description 1', new: true, conflict: false },
          { filenameId: '6', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('5', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 6)
          assert.strictEqual(order[0].filename, '3_down.sql')
          assert.strictEqual(order[1].filename, '2_down.sql')
          assert.strictEqual(order[2].filename, '2_up.sql')
          assert.strictEqual(order[3].filename, '3_up.sql')
          assert.strictEqual(order[4].filename, '4_up.sql')
          assert.strictEqual(order[5].filename, '5_up.sql')
          done()
        })
      })
    })

    it('should down of one version', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false }]

        migration.getExecuteOrder('2', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 1)
          assert.strictEqual(order[0].filename, '3_down.sql')
          done()
        })
      })
    })

    it('should down of one version and skip the last new', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\'), (\'4\'), (\'5\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: false, conflict: false },
          { filenameId: '5', description: 'Description 1', new: false, conflict: false },
          { filenameId: '6', description: 'Description 1', new: true, conflict: false },
          { filenameId: '7', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('4', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 1)
          assert.strictEqual(order[0].filename, '5_down.sql')
          done()
        })
      })
    })

    it('should down of two version and skip all new', (done) => {
      database.query('INSERT INTO hearthjs."migration" ("filename") VALUES (\'1\'), (\'2\'), (\'3\'), (\'5\'), (\'6\')', () => {
        migration._state = [{ filenameId: '1', description: 'Description 1', new: false, conflict: false },
          { filenameId: '2', description: 'Description 1', new: false, conflict: false },
          { filenameId: '3', description: 'Description 1', new: false, conflict: false },
          { filenameId: '4', description: 'Description 1', new: true, conflict: false },
          { filenameId: '5', description: 'Description 1', new: false, conflict: false },
          { filenameId: '6', description: 'Description 1', new: false, conflict: false },
          { filenameId: '7', description: 'Description 1', new: true, conflict: false }]

        migration.getExecuteOrder('3', (err, order) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(order, migration._toExecute)
          assert.strictEqual(order.length, 2)
          assert.strictEqual(order[0].filename, '6_down.sql')
          assert.strictEqual(order[1].filename, '5_down.sql')
          done()
        })
      })
    })
  })
})

function createMigration (filepath, name, up, down) {
  fs.writeFileSync(path.join(filepath, name + '_up.sql'), up)
  fs.writeFileSync(path.join(filepath, name + '_down.sql'), down)
}

function deleteMigration (filepath, name) {
  fs.unlinkSync(path.join(filepath, name + '_up.sql'))
  fs.unlinkSync(path.join(filepath, name + '_down.sql'))
}
