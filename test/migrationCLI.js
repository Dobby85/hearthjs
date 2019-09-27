/* eslint-env mocha */
const fs = require('fs')
const helper = require('../lib/helper')
const database = require('../lib/database')
const suppose = require('suppose')
const path = require('path')
const assert = require('assert')
const migration = require('../lib/migration')
const binPath = path.join(__dirname, '..', 'bin', 'hearthjs')

describe('Execute CLI', () => {
  describe('Execute migration on App2', () => {
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
            database.query('DROP TABLE IF EXISTS "Test"; DELETE FROM hearthjs."migration";', (err) => {
              assert.strictEqual(err, null)
              done()
            })
          })
        })
      })
    })

    afterEach((done) => {
      database.query('DROP TABLE IF EXISTS "Test"; DELETE FROM hearthjs."migration";', (err) => {
        assert.strictEqual(err, null)
        done()
      })
    })

    after((done) => {
      delete process.env.HEARTH_SERVER_PATH
      database.close(() => {
        done()
      })
    })

    describe('Should execute a simple up', () => {
      const contentMUP1 = '/* My description */CREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\');'
      const contentMDOWN1 = 'DROP TABLE "Test";'

      before(() => {
        createMigration(migrationDirectory, '1', contentMUP1, contentMDOWN1)
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 1)
              assert.strictEqual(result.rows[0].name, 'toto')
              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 1)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentMUP1, down: contentMDOWN1 })
                done()
              })
            })
          })
      })
    })

    describe('Should execute two ups', () => {
      const contentMUP1 = 'CREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\');'
      const contentMDOWN1 = 'DROP TABLE "Test";'
      const contentMUP2 = 'ALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentMDOWN2 = 'DROP TABLE "Test";'

      before(() => {
        createMigration(migrationDirectory, '1', contentMUP1, contentMDOWN1)
        createMigration(migrationDirectory, '2', contentMUP2, contentMDOWN2)
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto', age: 1 })
              assert.deepStrictEqual(result.rows[1], { id: 2, name: 'tata', age: 18 })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 2)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentMUP1, down: contentMDOWN1 })
                assert.deepStrictEqual(result.rows[1], { filename: '2', up: contentMUP2, down: contentMDOWN2 })
                done()
              })
            })
          })
      })
    })

    describe('Should ask for conflict for first migration and resolve with f, down two migrations and up two migrations, and on second call it must have nothing to do', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentInDbMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentInDbMDOWN2 = '/* 2 description */\nALTER TABLE "Test" DROP COLUMN "age"; DELETE FROM "Test" WHERE "name" = \'tata\''
      const contentMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL, "age2" INTEGER NOT NULL DEFAULT 2); INSERT INTO "Test" (name, age2) VALUES (\'toto\', 15);'

      before((done) => {
        createMigration(migrationDirectory, '1', contentMUP1, contentInDbMDOWN1)
        createMigration(migrationDirectory, '2', contentInDbMUP2, contentInDbMDOWN2)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3), ($4, $5, $6)', [
          1, contentInDbMUP1, contentInDbMDOWN1, 2, contentInDbMUP2, contentInDbMDOWN2
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1 + contentInDbMUP2, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Choice [Ffa]: ', 'f\n')
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto', age: 1, age2: 15 })
              assert.deepStrictEqual(result.rows[1], { id: 2, name: 'tata', age: 18, age2: 2 })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 2)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentMUP1, down: contentInDbMDOWN1 })
                assert.deepStrictEqual(result.rows[1], { filename: '2', up: contentInDbMUP2, down: contentInDbMDOWN2 })
                suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/check.txt') })
                  .on('error', (err) => { assert.strictEqual(err, null) })
                  .end((code) => {
                    assert.strictEqual(code, 0)
                    let content = fs.readFileSync('/tmp/check.txt', 'utf8')
                    assert.strictEqual(content.includes('Nothing to do, database is synchronized'), true)
                    done()
                  })
              })
            })
          })
      })
    })

    describe('Should ask for conflict for first migration and resolve with F because down database request does not work', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Toto";'
      const contentMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'

      before((done) => {
        createMigration(migrationDirectory, '1', contentInDbMUP1, contentMDOWN1)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3)', [
          1, contentInDbMUP1, contentInDbMDOWN1
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/check.txt') })
          .when('Choice [Ffa]: ', 'f\n')
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 1)
            assertDisplay('/tmp/check.txt', 'error: table "Toto" does not exist')
            suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
              .when('Choice [Ffa]: ', 'F\n')
              .when('Would you apply changes? [Yn]', 'Y\n')
              .on('error', (err) => {
                assert.strictEqual(err, null)
              })
              .end((code) => {
                assert.strictEqual(code, 0)
                database.query('SELECT * FROM "Test";', (err, result) => {
                  assert.strictEqual(err, null)
                  assert.strictEqual(result.rows.length, 1)
                  assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto' })

                  database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                    assert.strictEqual(err, null)
                    assert.strictEqual(result.rows.length, 1)
                    assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentInDbMUP1, down: contentMDOWN1 })
                    done()
                  })
                })
              })
          })
      })
    })

    describe('Should ask for conflict and skip it if user choose a', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentMDOWN1 = '/* 1 description */\nDROP TABLE "Toto";'

      before((done) => {
        createMigration(migrationDirectory, '1', contentInDbMUP1, contentMDOWN1)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3)', [
          1, contentInDbMUP1, contentInDbMDOWN1
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1 + 'INSERT INTO "Test" (name) VALUES (\'tata\');', (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Choice [Ffa]: ', 'a\n')
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto' })
              assert.deepStrictEqual(result.rows[1], { id: 2, name: 'tata' })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 1)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentInDbMUP1, down: contentMDOWN1 })
                done()
              })
            })
          })
      })
    })

    describe('Should ask for conflict for second migration and insert new migration', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentInDbMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentInDbMDOWN2 = '/* 2 description */\nALTER TABLE "Test" DROP COLUMN "age"; DELETE FROM "Test" WHERE "name" = \'tata\''
      const contentMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age2" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age2) VALUES (\'tata\', 19);'
      const contentMDOWN2 = '/* 2 description */\nALTER TABLE "Test" DROP COLUMN "age2"; DELETE FROM "Test" WHERE "name" = \'tata\''
      const contentMUP3 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "first" BOOLEAN NOT NULL DEFAULT true;'
      const contentMDOWN3 = '/* 2 description */\nALTER TABLE "Test" DROP COLUMN "first";'

      before((done) => {
        createMigration(migrationDirectory, '1', contentInDbMUP1, contentInDbMDOWN1)
        createMigration(migrationDirectory, '2', contentMUP2, contentMDOWN2)
        createMigration(migrationDirectory, '3', contentMUP3, contentMDOWN3)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3), ($4, $5, $6)', [
          1, contentInDbMUP1, contentInDbMDOWN1, 2, contentInDbMUP2, contentInDbMDOWN2
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1 + contentInDbMUP2, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
        deleteMigration(migrationDirectory, '3')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Choice [Ffa]: ', 'f\n')
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto', age2: 1, first: true })
              assert.deepStrictEqual(result.rows[1], { id: 3, name: 'tata', age2: 19, first: true })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 3)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentInDbMUP1, down: contentInDbMDOWN1 })
                assert.deepStrictEqual(result.rows[1], { filename: '2', up: contentMUP2, down: contentMDOWN2 })
                assert.deepStrictEqual(result.rows[2], { filename: '3', up: contentMUP3, down: contentMDOWN3 })
                done()
              })
            })
          })
      })
    })

    describe('Should resolve first migration with f and second migration with F', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentInDbMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentInDbMDOWN2 = '/* 2 description */\nDROP TABLE "Test";'
      const contentMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL, "age2" INTEGER NOT NULL DEFAULT 2); INSERT INTO "Test" (name, age2) VALUES (\'toto\', 15);'
      const contentMDOWN2 = 'ALTER TABLE "Test" DROP COLUMN "age"; DELETE FROM "Test" WHERE "name" = \'tata\';'

      before((done) => {
        createMigration(migrationDirectory, '1', contentMUP1, contentInDbMDOWN1)
        createMigration(migrationDirectory, '2', contentInDbMUP2, contentMDOWN2)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3), ($4, $5, $6)', [
          1, contentInDbMUP1, contentInDbMDOWN1, 2, contentInDbMUP2, contentInDbMDOWN2
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1 + contentInDbMUP2, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Choice [Ffa]: ', 'f\n')
          .when('Choice [Ffa]: ', 'F\n')
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto', age: 1, age2: 15 })
              assert.deepStrictEqual(result.rows[1], { id: 2, name: 'tata', age: 18, age2: 2 })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 2)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentMUP1, down: contentInDbMDOWN1 })
                assert.deepStrictEqual(result.rows[1], { filename: '2', up: contentInDbMUP2, down: contentMDOWN2 })
                done()
              })
            })
          })
      })
    })

    describe('Should resolve first migration with f and second migration with F', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentInDbMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentInDbMDOWN2 = 'ALTER TABLE "Test" DROP COLUMN "age"; DELETE FROM "Test" WHERE "name" = \'tata\';'

      before((done) => {
        createMigration(migrationDirectory, '1', contentInDbMUP1, contentInDbMDOWN1)
        createMigration(migrationDirectory, '2', contentInDbMUP2, contentInDbMDOWN2)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3), ($4, $5, $6)', [
          1, contentInDbMUP1, contentInDbMDOWN1, 2, contentInDbMUP2, contentInDbMDOWN2
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1 + contentInDbMUP2, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test', '-v', '1'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 1)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto' })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 1)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentInDbMUP1, down: contentInDbMDOWN1 })
                done()
              })
            })
          })
      })
    })

    describe('Should up of only one migration', () => {
      const contentInDbMUP1 = '/* 1 description */\nCREATE TABLE "Test" ("id" SERIAL NOT NULL PRIMARY KEY, "name" VARCHAR(255) NOT NULL); INSERT INTO "Test" (name) VALUES (\'toto\'); '
      const contentInDbMDOWN1 = '/* 1 description */\nDROP TABLE "Test";'
      const contentMUP2 = '/* 2 description */\nALTER TABLE "Test" ADD COLUMN "age" INTEGER NOT NULL DEFAULT 1; INSERT INTO "Test" (name, age) VALUES (\'tata\', 18);'
      const contentMDOWN2 = 'ALTER TABLE "Test" DROP COLUMN "age"; DELETE FROM "Test" WHERE "name" = \'tata\';'
      const contentMUP3 = '/* 3 description */\nINSERT INTO "Test" (name) VALUES (\'titi\');'
      const contentMDOWN3 = 'DELETE FROM "Test" WHERE "name" = \'titi\';'

      before((done) => {
        createMigration(migrationDirectory, '1', contentInDbMUP1, contentInDbMDOWN1)
        createMigration(migrationDirectory, '2', contentMUP2, contentMDOWN2)
        createMigration(migrationDirectory, '3', contentMUP3, contentMDOWN3)

        // Add migration in database
        database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down") VALUES ($1, $2, $3)', [
          1, contentInDbMUP1, contentInDbMDOWN1
        ], (err) => {
          assert.strictEqual(err, null)

          // Add the migration result in database
          database.query(contentInDbMUP1, (err) => {
            assert.strictEqual(err, null)
            done()
          })
        })
      })

      after(() => {
        deleteMigration(migrationDirectory, '1')
        deleteMigration(migrationDirectory, '2')
        deleteMigration(migrationDirectory, '3')
      })

      it('Execute migration', (done) => {
        suppose(binPath, ['migrate', 'test', '-v', '2'], { debug: fs.createWriteStream('/tmp/debug.txt') })
          .when('Would you apply changes? [Yn]', 'Y\n')
          .on('error', (err) => {
            assert.strictEqual(err, null)
          })
          .end((code) => {
            assert.strictEqual(code, 0)
            database.query('SELECT * FROM "Test";', (err, result) => {
              assert.strictEqual(err, null)
              assert.strictEqual(result.rows.length, 2)
              assert.deepStrictEqual(result.rows[0], { id: 1, name: 'toto', age: 1 })
              assert.deepStrictEqual(result.rows[1], { id: 2, name: 'tata', age: 18 })

              database.query('SELECT "filename", "up", "down" FROM hearthjs."migration" ORDER BY "filename"', (err, result) => {
                assert.strictEqual(err, null)
                assert.strictEqual(result.rows.length, 2)
                assert.deepStrictEqual(result.rows[0], { filename: '1', up: contentInDbMUP1, down: contentInDbMDOWN1 })
                assert.deepStrictEqual(result.rows[1], { filename: '2', up: contentMUP2, down: contentMDOWN2 })
                done()
              })
            })
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

function assertDisplay (filename, toInclude) {
  let content = fs.readFileSync(filename, 'utf8')
  assert.strictEqual(content.includes(toInclude), true, `The content file ${filename} does not include ${toInclude}\n${content}`)
}
