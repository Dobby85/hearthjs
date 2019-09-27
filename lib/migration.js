const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

let migration = {
  _serverPath: null,
  _database: null,
  _state: [],
  _toExecute: [],
  _directory: null,
  _toDelete: [],
  _toAdd: [],

  /**
   * Init server path
   * @param {String} serverPath Server path
   * @param {Function} callback
   */
  init: function (serverPath, database, callback) {
    this._serverPath = serverPath || process.env.HEARTH_SERVER_PATH
    this._database = database
    this._directory = path.join(this._serverPath, 'migration')

    // Register migration file
    database.registerSQLFileIfNotExists(path.join(__dirname, 'sqlRequest', 'migration.sql'))

    // Create table
    database.exec('migration', (err) => {
      if (err) {
        return callback(err)
      }

      return callback(null)
    })
  },

  /**
   * Update the conflict choice of a state
   * @param {Integer} filenameId Migration id
   * @param {String} choice User choice
   */
  updateConflictChoice: function (filenameId, choice) {
    for (let i = 0; i < this._toExecute.length; i++) {
      if (this._toExecute[i].filename.startsWith(filenameId)) {
        this._toExecute[i].choice = choice
      }
    }
  },

  /**
   * Begin a transaction
   * @param {Function} callback
   */
  beginTransaction: function (callback) {
    this._database.query('BEGIN;', (err) => {
      if (err) {
        return callback(err)
      }

      return callback(null)
    })
  },

  /**
   * Commit a transaction
   * @param {Function} callback
   */
  commitTransaction: function (callback) {
    this._database.query('COMMIT;', (err) => {
      if (err) {
        return callback(err)
      }

      return callback(null)
    })
  },

  /**
   * Rollback a transaction
   * @param {Function} callback
   */
  rollbackTransaction: function (callback) {
    this._database.query('ROLLBACK;', (err) => {
      if (err) {
        return callback(err)
      }

      return callback(null)
    })
  },

  /**
   * Loop on all states and execute them
   * This function must be called with a callback only
   * @param {Object} states All states ordered to execute
   * @param {Integer} index states index
   * @param {Function} callback
   */
  executeAllState: function (states, index, callbackStatus, callback) {
    if (callback === undefined) {
      // Recall function with all parameters
      return this.executeAllState(this._toExecute, 0, states, index)
    }

    if (index >= states.length) {
      return callback(null)
    }

    let _currentState = states[index]

    // Execute state
    this._execute(_currentState, callbackStatus, (err) => {
      if (err) {
        return callback(err)
      }
      this.executeAllState(states, index + 1, callbackStatus, callback)
    })
  },

  /**
   * Execute script of one file or script in database
   * @param {Object} state Contain the filename and the user choice for down script
   * @param {Function} callback
   */
  _execute: function (state, callbackStatus, callback) {
    if (state.choice === 'a') {
      callbackStatus({ state: state, success: null })
      return callback(null)
    }

    if (state.filename.includes('up')) {
      // Read up file and execute it
      this._readFileAndExecuteQuery(state.filename, (err) => {
        if (err) {
          callbackStatus({ state: state, success: false })
          return callback(err)
        }
        callbackStatus({ state: state, success: true })
        return callback(null)
      })
    } else {
      // Down migration
      if (state.choice !== undefined && state.choice === 'F') {
        // Down with file script
        this._readFileAndExecuteQuery(state.filename, (err) => {
          if (err) {
            callbackStatus({ state: state, success: false })
            return callback(err)
          }
          callbackStatus({ state: state, success: true })
          return callback(null)
        })
      } else {
        let _id = state.filename.split('_')[0]

        // Down with database script
        this._database.query('SELECT "down" FROM hearthjs."migration" WHERE "filename" = $1', [_id], (err, res, rows) => {
          if (err) {
            return callback(new Error(`Error while querying down script for ${state.filename}: ${err.toString()}`))
          }

          // Apply database down script
          this._database.query(rows[0].down, (err) => {
            if (err) {
              callbackStatus({ state: state, success: false })
              return callback(new Error(`Error while execute down database script for ${state.filename}: ${err.toString()}`))
            }
            callbackStatus({ state: state, success: true })
            return callback(null)
          })
        })
      }
    }
  },

  /**
   * Read a migration file and execute it in database
   * @param {String} filename Filename to execute
   * @param {Function} callback
   */
  _readFileAndExecuteQuery: function (filename, callback) {
    fs.readFile(path.join(this._directory, filename), 'utf8', (err, content) => {
      if (err) {
        return callback(new Error(`Error while reading ${filename}: ${err.toString()}`))
      }

      // Execute up migration
      this._database.query(content, (err) => {
        if (err) {
          return callback(new Error(`Error while applying script ${filename}: ${err.toString()}`))
        }

        return callback(null)
      })
    })
  },

  /**
   * Update migration table
   * This function must be call with a callback only
   * @param {String} filename Migration filename
   * @param {String} content Migration content
   * @param {String} type up or down
   * @param {Function} callback
   */
  updateMigrationTable: function (states, index, callback) {
    if (callback === undefined) {
      callback = states
      states = (this._toDelete.length === 0) ? this._toAdd : this._toDelete
      index = 0
    }

    if (index >= states.length) {
      return callback(null)
    }

    // We are downgrading, delete migrations in table
    if (this._toDelete.length > 0) {
      return this._database.query('DELETE FROM hearthjs."migration" WHERE "filename" = $1', [states[index]], (err) => {
        if (err) {
          return callback(err)
        }

        return this.updateMigrationTable(states, index + 1, callback)
      })
    }

    // We are not downgrading, insert new migration
    fs.readFile(path.join(this._directory, `${states[index]}_up.sql`), 'utf8', (err, upContent) => {
      if (err) {
        return callback(err)
      }

      fs.readFile(path.join(this._directory, `${states[index]}_down.sql`), 'utf8', (err, downContent) => {
        if (err) {
          return callback(err)
        }

        this._updateOneMigration(states[index], upContent, downContent, (err) => {
          if (err) {
            return callback(err)
          }

          this.updateMigrationTable(states, index + 1, callback)
        })
      })
    })
  },

  /**
   * Insert or update one line of the migration table
   * @param {String} filename Filename ID of the migration file
   * @param {String} upContent Up content to update in base
   * @param {String} downContent Down content to update in base
   * @param {Function} callback
   */
  _updateOneMigration: function (filename, upContent, downContent, callback) {
    // Check if a line with this filename has already been inserted
    this._database.query('SELECT "id" FROM hearthjs."migration" WHERE "filename" = $1', [filename], (err, result) => {
      if (err) {
        return callback(err)
      }

      if (result.rows.length === 0) {
        // No line has been inserted for this file
        return this._database.query('INSERT INTO hearthjs."migration" ("filename", "up", "down", "dateApplied") VALUES ($1, $2, $3, NOW())', [filename, upContent, downContent], (err) => {
          if (err) {
            return callback(err)
          }

          return callback(null)
        })
      }

      // A line exists, update the content
      this._database.query('UPDATE hearthjs."migration" SET "up" = $1, "down" = $2 WHERE "id" = $3', [upContent, downContent, result.rows[0].id], (err) => {
        if (err) {
          return callback(err)
        }

        return callback(null)
      })
    })
  },

  /**
   * Loop on _state and list all files to execute
   * in the right order
   */
  getExecuteOrder: function (version, callback) {
    let _downList = []
    let _upList = []

    // Check there are multiples elements in the state
    if (this._state.length === 0) {
      return callback(null)
    }

    this._checkUpOrDownForVersion(version, (err, result) => {
      if (err) {
        return callback(err)
      }

      if (result === 'up') {
        for (let i = 0; i < this._state.length; i++) {
          let _currentState = this._state[i]

          let _newList = this._analizeCurrentState(_currentState, _downList, _upList)
          _downList = _newList.downList
          _upList = _newList.upList

          if (_currentState.filenameId === version) {
            break
          }
        }
      } else if (result === 'down') {
        let _newStateList = this._state.reverse()

        for (let i = 0; i < _newStateList.length; i++) {
          let _currentState = _newStateList[i]

          // Don't down the wanted version
          if (_currentState.filenameId === version) {
            break
          }

          // Ignore new, there is nothing to down
          if (_currentState.new) {
            continue
          }

          _downList.push({ filename: `${_currentState.filenameId}_down.sql`, description: _currentState.description, choice: '' })
          this._toDelete.push(_currentState.filenameId)
        }
      } else {
        // We don't want a specific version, order all files
        // Loop on all files in state
        for (let i = 0; i < this._state.length; i++) {
          let _currentState = this._state[i]

          let _newList = this._analizeCurrentState(_currentState, _downList, _upList)
          _downList = _newList.downList
          _upList = _newList.upList
        }
      }

      this._toExecute = this._toExecute.concat(_downList)
      this._toExecute = this._toExecute.concat(_upList)
      return callback(null, this._toExecute)
    })
  },

  /**
   * Check the state configuration and push the right files in list
   * @param {Object} currentState Item of the state array
   * @param {Array} downList List of state to down
   * @param {Array} upList List of state to up
   */
  _analizeCurrentState: function (currentState, downList, upList) {
    if (currentState.conflict) {
      downList.unshift({ filename: `${currentState.filenameId}_down.sql`, description: currentState.description, choice: '' })
      upList.push({ filename: `${currentState.filenameId}_up.sql`, description: currentState.description, choice: '' })
      this._toAdd.push(currentState.filenameId)
    } else if (currentState.new) {
      upList.push({ filename: `${currentState.filenameId}_up.sql`, description: currentState.description, choice: '' })
      this._toAdd.push(currentState.filenameId)
    } else if (upList.length > 0) {
      downList.unshift({ filename: `${currentState.filenameId}_down.sql`, description: currentState.description, choice: '' })
      upList.push({ filename: `${currentState.filenameId}_up.sql`, description: currentState.description, choice: '' })
      this._toAdd.push(currentState.filenameId)
    }

    return {
      downList: downList,
      upList: upList
    }
  },

  /**
   * Check if we will have to up or down of version
   * @param {String} version Version we want to go
   * @param {Function} callback
   */
  _checkUpOrDownForVersion: function (version, callback) {
    if (version === undefined || version === null) {
      return callback(null, null)
    }

    // Check if this version has been migrated
    this._database.query('SELECT "filename" FROM hearthjs."migration" WHERE "filename" = $1', [version], (err, result) => {
      if (err) {
        return callback(err)
      }

      if (result.rows.length === 0) {
        // The wanted version has not be migrated, UP
        return callback(null, 'up')
      }

      // The wanted version has been migrated, DOWN
      return callback(null, 'down')
    })
  },

  /**
   * Analyze the state of all files and return a state
   * for each file
   * @param {Function} callback
   */
  analyze: function (callback) {
    fs.readdir(this._directory, (err, files) => {
      if (err) {
        return callback(new Error(`Unable to scan migration directory: ${err.toString()}`))
      }

      this._analyzeFiles(files, 0, callback)
    })
  },

  /**
   * Loop on all files and detect each state
   * @param {Array} files Files to read
   * @param {Integer} index files index
   * @param {Function} callback
   */
  _analyzeFiles: function (files, index, callback) {
    if (index >= files.length) {
      return callback(null)
    }

    let filename = files[index]
    let filenameId = filename.split('_')[0]
    let type = filename.includes('up') ? 'up' : 'down'
    let fileState = {
      filenameId: filenameId,
      description: '',
      new: false,
      conflict: false,
      conflictType: null
    }

    // Check file is not a hidden file
    if (filename[0] === '.') {
      return this._analyzeFiles(files, index + 1, callback)
    }

    // Read file content
    fs.readFile(path.join(this._directory, filename), 'utf8', (err, content) => {
      if (err) {
        return callback(new Error(`Cannot read migration file ${filename}: ${err.toString()}`))
      }

      // Check migration exists in database
      this._database.query('SELECT * FROM hearthjs."migration" WHERE "filename" = $1', [filenameId], (err, result, rows) => {
        if (err) {
          return callback(new Error(`Database error: ${err.toString()}`))
        }

        // Get current state index if it already exists
        let _stateIndex = this._state.findIndex((value) => value.filenameId === filenameId)

        if (result.rowCount === 0) {
          if (_stateIndex === -1) {
            // File has never been migrate and is not in current state
            fileState.description = this.getFileDescription(content)
            fileState.new = true

            // Push state
            this._state.push(fileState)
          } else if (this._state[_stateIndex].description === '') {
            // Check if we have a description, else find it in the other file (up or down)
            this._state[_stateIndex].description = this.getFileDescription(content)
          }
        } else {
          // Not new, check with hashs if there is a conflict
          let _fileHash = crypto.createHash('md5').update(content).digest('hex')
          let _upHash = crypto.createHash('md5').update(rows[0].up).digest('hex')
          let _downHash = crypto.createHash('md5').update(rows[0].down).digest('hex')

          if ((type === 'up' && _fileHash !== _upHash) || (type === 'down' && _fileHash !== _downHash)) {
            // There is a conflict
            if (_stateIndex === -1) {
              fileState.description = this.getFileDescription(content)
              fileState.conflict = true
              fileState.conflictType = type

              // Push state
              this._state.push(fileState)
            } else {
              this._state[_stateIndex].conflict = true
              this._state[_stateIndex].conflictType = type
            }
          } else {
            // Not new and no conflict
            if (_stateIndex === -1) {
              fileState.description = this.getFileDescription(content)

              // Push state
              this._state.push(fileState)
            }
          }
        }

        this._analyzeFiles(files, index + 1, callback)
      })
    })
  },

  /**
   * Return the description between comment on the first line
   * @param {String} content File content
   */
  getFileDescription: function (content) {
    let regex = /^\/\*(.+)\*\/$/g
    let firstline = content.split('\n')[0]
    let found = regex.exec(firstline)

    if (found === null) {
      return ''
    } else {
      return found[1].trim()
    }
  },

  /**
   * Create up and down migration file
   * @param {String} description Migration description
   * @param {Function} callback
   */
  create: function (description, callback) {
    // Don't use this._serverPath because when we create a migration, we don't call the init method because we don't need it
    const _serverPath = process.env.HEARTH_SERVER_PATH
    let name = this._getMigrationName()

    this._createMigrationDirectory(_serverPath, (err) => {
      if (err) {
        return callback(err)
      }

      // Create up migration file
      fs.writeFile(path.join(_serverPath, 'migration', `${name}_up.sql`), `/* ${description} */\n\n`, 'utf8', (err) => {
        if (err) {
          return callback(err)
        }

        // Create down migration file
        fs.writeFile(path.join(_serverPath, 'migration', `${name}_down.sql`), `/* ${description} */\n\n`, 'utf8', (err) => {
          if (err) {
            return callback(err)
          }

          return callback()
        })
      })
    })
  },

  /**
   * Check if migration directory exists and create it if necessary
   * @param {Function} callback
   */
  _createMigrationDirectory: function (serverPath, callback) {
    let migrationPath = path.join(serverPath, 'migration')

    // Check migration directory exists
    fs.access(migrationPath, fs.constants.F_OK, (err) => {
      if (err) {
        // Directory does not exists, create it
        fs.mkdir(migrationPath, (err) => {
          if (err) {
            return callback(err)
          }

          return callback()
        })
      } else {
        return callback()
      }
    })
  },

  /**
   * Return a new migration name
   */
  _getMigrationName: function () {
    let currentDate = new Date()
    let year = currentDate.getFullYear()
    let month = (currentDate.getMonth() + 1 < 10 ? '0' : '') + currentDate.getMonth() + 1
    let day = (currentDate.getDate() < 10 ? '0' : '') + currentDate.getDate()
    let hours = (currentDate.getHours() + 1 < 10 ? '0' : '') + currentDate.getHours() + 1
    let minutes = (currentDate.getMinutes() < 10 ? '0' : '') + currentDate.getMinutes()
    let seconds = (currentDate.getSeconds() < 10 ? '0' : '') + currentDate.getSeconds()
    let milliseconds = (currentDate.getMilliseconds() < 10 ? '0' : '') + currentDate.getMilliseconds()

    let name = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`
    return name
  }
}

module.exports = migration
