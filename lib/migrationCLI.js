const migration = require('./migration')
const helper = require('./helper')
const database = require('./database')
const fs = require('fs')
const path = require('path')
const jsdiff = require('diff')
const serverPath = process.env.HEARTH_SERVER_PATH
const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  white: '\u001b[37m',
  reset: '\u001b[0m'
}

/**
 * CLI function to create a migration
 * @param {Function} callback
 */
function create (callback) {
  console.log('Create a new migration\n')
  helper.ask('Description: ', null, (answer) => {
    migration.create(answer, callback)
  })
}

/**
 * CLI function to migrate a database
 * @param {String} mode Database mode
 * @param {String} version Migration version
 * @param {Function} callback
 */
function migrate (mode, version, callback) {
  helper.loadConfForDatabase(mode, (err, databaseConf) => {
    if (err) {
      return callback(err)
    }

    // Initialize the database for migration
    database.init(databaseConf, (err) => {
      if (err) {
        return callback(err)
      }

      // Initialize migration system
      migration.init(serverPath, database, (err) => {
        if (err) {
          return callback(err)
        }

        // Analyze all migration files
        migration.analyze((err) => {
          if (err) {
            return callback(err)
          }

          const totalConflict = calculateNumberOfConflicts(migration._state)

          migration.getExecuteOrder(version, (err) => {
            if (err) {
              return callback(err)
            }

            if (migration._toExecute.length === 0) {
              console.log(' - Nothing to do, database is synchronized')
              return callback(null)
            }

            // Loop on state and ask for conflict
            askAllConflicts(migration._state, migration._toExecute, 0, totalConflict, 1, (err) => {
              if (err) {
                return callback(err)
              }

              console.log('\n\nThe following migrations will be executed\n')
              console.log('      v')
              for (let i = 0; i < migration._toExecute.length; i++) {
                console.log(`      | ${migration._toExecute[i].filename}: ${migration._toExecute[i].description}`)
              }
              console.log('      ^\n')

              helper.ask('Would you apply changes? [Yn]', /[Yn]/, (answer) => {
                if (answer === 'n') {
                  console.log('Migration has been canceled')
                  return callback(null)
                }
                // Before begin SQL request, start a transaction
                migration.beginTransaction((err) => {
                  if (err) {
                    return callback(err)
                  }

                  console.log('\n      v')
                  migration.executeAllState((status) => {
                    if (status.success === null) {
                      console.log(`      - ${status.state.filename}: ${status.state.description}`)
                    } else if (status.success) {
                      console.log(`      \u2705 ${status.state.filename}: ${status.state.description}`)
                    } else {
                      console.log(`      \u274C ${status.state.filename}: ${status.state.description}`)
                    }
                  }, (err) => {
                    console.log('      ^\n')
                    if (err) {
                      // Rollback the transaction if an error occured
                      return migration.rollbackTransaction((rollbackErr) => {
                        if (err) {
                          console.log('An error occured, rollback changes: ', err)
                        }
                        return callback(err)
                      })
                    }

                    // Once we ask all conflict, update the migration table with all up and down content
                    migration.updateMigrationTable((err) => {
                      if (err) {
                        return callback(err)
                      }

                      // No error, commit transaction
                      migration.commitTransaction((err) => {
                        if (err) {
                          return callback(err)
                        }

                        console.log('Database has been migrated')
                        return process.exit()
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

/**
 * Loop on all migration states, check if there is a conflict and ask user
 * @param {Array} states Array of state migration
 * @param {Integer} index states index
 * @param {Function} callback
 */
function askAllConflicts (states, toExecute, index, totalConflict, numberConflict, callback) {
  if (index >= states.length) {
    return callback(null)
  }

  const _toExecuteIndex = toExecute.findIndex((item) => {
    return item.filename === `${states[index].filenameId}_${states[index].conflictType}.sql`
  })

  if (states[index].conflict && _toExecuteIndex !== -1) {
    return askOneConflict(states[index], totalConflict, numberConflict, (err) => {
      if (err) {
        return callback(err)
      }

      askAllConflicts(states, toExecute, index + 1, totalConflict, numberConflict + 1, callback)
    })
  }

  return askAllConflicts(states, toExecute, index + 1, totalConflict, numberConflict, callback)
}

/**
 * Ask user choice for conflict
 * @param {Object} state One migration state with conflict
 * @param {Integer} totalConflict Number of conflict
 * @param {Integer} numberConflict Current conflict number
 * @param {Function} callback
 */
function askOneConflict (state, totalConflict, numberConflict, callback) {
  // Get content in file
  fs.readFile(path.join(serverPath, 'migration', `${state.filenameId}_${state.conflictType}.sql`), 'utf8', (err, fileContent) => {
    if (err) {
      return callback(err)
    }

    database.query('SELECT "' + state.conflictType + '" FROM hearthjs."migration" WHERE "filename" = $1', [state.filenameId], (err, result) => {
      if (err) {
        return callback(err)
      }

      if (result.rows.length === 0) {
        return callback(new Error(`No migration in database for file ${state.filenameId}_${state.conflictType}.sql`))
      }

      const diff = jsdiff.diffLines(result.rows[0][state.conflictType], fileContent)

      console.log(`\n - There is a conflict for file ${state.filenameId}_${state.conflictType}.sql [${numberConflict}/${totalConflict}]\n`)
      diff.forEach((part) => {
        const color = part.added ? colors.green : part.removed ? colors.red : colors.white
        console.log(color + part.value + colors.reset)
      })
      console.log('\n      F: Down with file request')
      console.log('      f: Down with database request')
      console.log('      a: Don\'t execute migration, update the database\n')
      helper.ask('Choice [Ffa]: ', /[Ffa]/, (answer) => {
        migration.updateConflictChoice(state.filenameId, answer)
        return callback(null)
      })
    })
  })
}

/**
 * Return the number of conflict between all states
 * @param {Array} states Array of migration status
 */
function calculateNumberOfConflicts (states) {
  let totalConflict = 0

  for (let i = 0; i < states.length; i++) {
    if (states[i].conflict) {
      totalConflict += 1
    }
  }

  return totalConflict
}

module.exports = {
  migrate: migrate,
  create: create
}
