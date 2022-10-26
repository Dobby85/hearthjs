const express = require('express')
const fs = require('fs')
const path = require('path')
const database = require('./database')
const addon = require('./addon')
const cookieParser = require('cookie-parser')
const migration = require('./migration')
const translate = require('./translate')
const cluster = require('cluster')
const cron = require('./cron')
const os = require('os')
const logger = require('./logger')
const helper = require('./helper')
const { Server } = require('socket.io')
const { createServer } = require('http')

const messageType = {
  startStatus: 'START_STATUS',
  close: 'CLOSE_APP',
  log: 'LOG',
  debug: 'DEBUG'
}

const modeName = {
  dev: 'DEVELOPMENT',
  prod: 'PRODUCTION',
  test: 'TEST'
}

const server = {
  _defaultConfig: {
    APP_SERVER_PORT: 8080,
    APP_SERVER_LANG: 'en'
  },

  config: null,
  io: null,

  _app: null,
  _httpServer: null,
  _server: null,
  _serverPath: null,
  _addons: [],
  _apis: [],
  _apiReady: true, // Api declaration has async calls, we need to be sure every API has been declared to run the server
  _workers: [],
  _currentLeaderWorker: null,
  _projectServerFile: null,
  _env: null,

  /**
   * Return the current env of the app
   */
  getEnv: function () {
    return this._env
  },

  /**
   * Return URL endpoint
   * @param {Boolean} https HTTPS variante
   */
  getEndpoint: function (https) {
    if (https) {
      return `https://localhost/`
    } else {
      return `http://localhost:${this.config.APP_SERVER_PORT}/`
    }
  },

  _reset: function () {
    this._app = null
    this._io = null
    this._httpServer = null
    this._server = null
    this._serverPath = null
    this._addons = []
    this._apis = []
    this._apiReady = true
    this._workers = []
    this._currentLeaderWorker = null
    this._projectServerFile = null
  },

  /**
   * Initialize the server
   * @param {Object} env Choosen envirenment dev/prod/test
   * @param {Function} callback
   */
  _init: function (env, callback) {
    // Call project beforeInit function
    this._callFunctionIfExists('beforeInit', [], (err) => {
      if (err) {
        return callback(err)
      }

      this._app = express()
      this._httpServer = createServer(this._app)

      const startSocketServer = this._projectServerFile?.['startSocketServer']

      if (startSocketServer !== undefined && startSocketServer === true) {
        const cors = (this._projectServerFile['socketCorsOptions'] !== undefined) ? this._projectServerFile['socketCorsOptions'] : null

        this.io = new Server(this._httpServer, { cors })
      }

      // Register hearthjs SQL files
      this._loopDirectory(path.join(__dirname, 'sqlRequest'), '^[a-zA-Z0-9]+\\.sql$', (filePath) => {
        database.registerSQLFile(filePath)
      })

      // Load all translations
      translate.initTranslations(this.config.APP_SERVER_LANG, (err) => {
        if (err) {
          return callback(err)
        }

        // Connect database
        database.init({
          user: this.config.APP_DATABASE_USERNAME,
          host: this.config.APP_DATABASE_HOST,
          database: this.config.APP_DATABASE_NAME,
          password: this.config.APP_DATABASE_PASSWORD,
          port: this.config.APP_DATABASE_PORT,
          timeout: this.config.APP_DATABASE_TIMEOUT
        }, (err) => {
          if (err) {
            return callback(err)
          }

          // Init migration system
          migration.init(this._serverPath, database, (err) => {
            if (err) {
              return callback(err)
            }

            this._initExternApi(this._apis, 0, (err) => {
              if (err) {
                return callback(err)
              }

              this._initMiddleware()

              // Call project init function, user can add middleware here
              this._callFunctionIfExists('init', [this._app], (err) => {
                if (err) {
                  return callback(err)
                }

                // Init all addons registered
                this._initAddons(this._addons, 0, (err) => {
                  if (err) {
                    return callback(err)
                  }

                  // Init the server/api directory
                  helper._createDirectoryIfNotExists(path.join(this._serverPath, 'api'))

                  // Register externs api
                  this._requireExternApis()

                  // Register all API
                  this._loopDirectory(path.join(this._serverPath, 'api'), 'api\\.\\S+\\.js', (filePath) => {
                    this._apiReady = false
                    if (require.cache[filePath]) {
                      delete require.cache[filePath]
                    }
                    require(filePath)
                  })

                  // Register all SQL files
                  this._loopDirectory(path.join(this._serverPath), '^[a-zA-Z0-9]+\\.sql$', (filePath) => {
                    database.registerSQLFile(filePath)
                  })

                  let interval = setInterval(() => {
                    if (this._apiReady) {
                      // When application is started, load all cron
                      cron.loadCron((err) => {
                        if (err) {
                          return callback(err)
                        }

                        clearInterval(interval)

                        // Call after init function from server project
                        this._callFunctionIfExists('afterInit', [this._app], (err) => {
                          if (err) {
                            return callback(err)
                          }

                          this._initErrorMiddleware()
                          return callback(null)
                        })
                      })
                    }
                  }, 120)
                })
              })
            })
          })
        })
      })
    })
  },

  /**
   * api.js calls this function to tell the server all API avec been declared and served
   * @param {Boolean} value
   */
  _setApiReady: function (value) {
    this._apiReady = value
  },

  /**
   * Load config file depends on environment
   * @param {String} env Choosen envirenment dev/prod/test
   * @param {Object} options Parameters send via CLI which can override the conf file
   */
  _loadConfig: function (env, options, callback) {
    const mandatoryKey = ['APP_SERVER_PORT'] // Add mandatory key here
    helper._createDirectoryIfNotExists(path.join(this._serverPath, 'config'))
    const configPath = path.join(this._serverPath, 'config', env + '.json')
    const cliKeys = [{ confName: 'APP_NB_CLUSTER', cliName: 'cluster', type: 'integer' },
      { confName: 'APP_SERVER_PORT', cliName: 'port', type: 'integer' },
      { confName: 'APP_DATABASE_USERNAME', cliName: 'db_username', type: 'string' },
      { confName: 'APP_DATABASE_HOST', cliName: 'db_host', type: 'string' },
      { confName: 'APP_DATABASE_NAME', cliName: 'db_name', type: 'string' },
      { confName: 'APP_DATABASE_PASSWORD', cliName: 'db_password', type: 'string' },
      { confName: 'APP_DATABASE_PORT', cliName: 'db_port', type: 'integer' },
      { confName: 'APP_SERVER_LANG', cliName: 'lang', type: 'string' }]

    // Check if file exists before reading it
    fs.access(configPath, fs.F_OK, (err) => {
      if (err) {
        return helper.createDefaultConfigFile(env, (err) => {
          if (err) {
            logger.log('An error occured while writing config file: ' + JSON.stringify(err, null, 2), 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
          }

          return callback(new Error('A config file has been created, please check values are correct'))
        })
      }

      fs.readFile(configPath, 'utf-8', (err, data) => {
        if (err) {
          return callback(err)
        }

        try {
          this.config = JSON.parse(JSON.stringify(this._defaultConfig))
          this.config = Object.assign(this.config, JSON.parse(data))

          // Override keys sent via cli in conf
          for (let i = 0; i < cliKeys.length; i++) {
            if (options[cliKeys[i].cliName] !== undefined) {
              if (cliKeys[i].type === 'integer') {
                this.config[cliKeys[i].confName] = parseInt(options[cliKeys[i].cliName])
              } else {
                this.config[cliKeys[i].confName] = options[cliKeys[i].cliName]
              }
            }
          }

          // Check if mandatory keys are missing
          for (let i = 0; i < mandatoryKey.length; i++) {
            if (this.config[mandatoryKey[i]] === undefined) {
              return callback(new Error(`Missing mandatory key ${mandatoryKey[i]} in ${configPath}`))
            }
          }

          // Check database key value
          return this._checkDatabaseConfiguration(env, (err) => {
            if (err) {
              return callback(err)
            }

            return callback(null)
          })
        } catch (e) {
          return callback(e)
        }
      })
    })
  },

  /**
   * Check if the database has a valid configuration, else write a basic sample
   * @param {String} env test, dev or prod
   * @param {Function} callback
   */
  _checkDatabaseConfiguration: function (env, callback) {
    /**
     * Check if key name has value in config file or in process.env
     * @param {String} keyName Key name to check
     */
    const _checkFunction = (keyName) => {
      if ((this.config[keyName] === undefined || this.config[keyName] === null) && (process.env[keyName] === undefined || process.env[keyName] === null)) {
        return new Error(`A valid value is missing for ${keyName}, open your configuration file and update it`)
      }

      return null
    }

    const _keys = ['APP_DATABASE_USERNAME', 'APP_DATABASE_HOST', 'APP_DATABASE_NAME', 'APP_DATABASE_PASSWORD', 'APP_DATABASE_PORT']
    let _error = null

    for (let i = 0; i < _keys.length; i++) {
      _error = _checkFunction(_keys[i])

      if (_error !== null) {
        break
      }
    }

    if (_error === null) {
      return callback(null)
    }

    return helper.createDefaultConfigFile(env, (err) => {
      if (err) {
        logger.log('An error occured while writing config file: ' + JSON.stringify(err, null, 2), 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      }

      return callback(_error)
    })
  },

  /**
   * Require all externs api
   */
  _requireExternApis: function () {
    for (let i = 0; i < this._apis.length; i++) {
      for (let j = 0; j < this._apis[i].apis.length; j++) {
        this._apiReady = false
        if (require.cache[this._apis[i].apis[j]]) {
          delete require.cache[this._apis[i].apis[j]]
        }
        require(this._apis[i].apis[j])
      }
    }
  },

  /**
   * Init all middlewares
   */
  _initMiddleware: function () {
    this._app.use(logger._logMiddleware())
    this._app.use(cookieParser())
  },

  /**
   * Init error middleware
   */
  _initErrorMiddleware: function () {
    this._app.use((err, req, res, next) => {
      let message = err.toString()
      let code = 400

      if (err.message !== undefined) {
        message = err.message

        if (typeof err.code === 'number') {
          code = err.code || 400
        }
      }

      return res.status(code).json({
        success: false,
        message: message
      })
    })
  },

  /**
   * Loop on all file and require all API
   * @param {String} dirPath Begin path
   * @param {String} stringRegex String regex to match files
   * @param {Function} toDo Function to call if match
   */
  _loopDirectory: function (dirPath, stringRegex, toDo) {
    const list = fs.readdirSync(dirPath)
    let regex = RegExp(stringRegex)

    for (let i = 0; i < list.length; i++) {
      let filePath = path.join(dirPath, list[i])
      let stat = fs.statSync(filePath)

      if (stat && stat.isDirectory() && filePath.includes('uploads') === false) {
        this._loopDirectory(filePath, stringRegex, toDo)
      } else if (regex.test(list[i])) {
        toDo(filePath)
      }
    }
  },

  /**
   * Register an addon in application
   * @param {Object} userAddon Addon to add
   * @param {String} schemaKeyName Name of the key in schema. This key override the schemaKeyName defined in userAddon
   */
  useAddon: function (userAddon, schemaKeyName) {
    if (userAddon.schemaKeyName === undefined && schemaKeyName === undefined) {
      logger.log('Error: all addons must have a schemaKeyName', 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return process.exit(1)
    }

    if (schemaKeyName !== undefined) {
      userAddon.schemaKeyName = schemaKeyName
    }

    // Check if an addon with this name already exists or not
    let index = this._addons.findIndex(elem => elem.schemaKeyName === userAddon.schemaKeyName)

    if (index !== -1) {
      logger.log(`An addon ${userAddon.schemaKeyName} has already been defined`, 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return process.exit(1)
    }

    // Register addon
    this._addons.push(userAddon)
  },

  /**
   * Register api in variable
   * @param {Object} userApi Api to register
   * @param {String} apiName Api name
   */
  useApi: function (userApi, prefix) {
    if (prefix === undefined) {
      logger.log('Error: you must specify a prefix when you use an API', 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return process.exit(1)
    }

    let index = this._apis.findIndex(elem => elem.prefix === prefix)

    if (index !== -1) {
      logger.log(`An API with prefix ${prefix} has already been defined`, 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return process.exit(1)
    }

    if (userApi.addons !== undefined) {
      for (let i = 0; i < userApi.addons.length; i++) {
        this.useAddon(userApi.addons[i].addon, userApi.addons[i].schemaKeyName)
      }
    }

    userApi.prefix = prefix
    this._apis.push(userApi)
  },

  /**
   * Initialize the database and call init functions for all externs API
   * @param {Array} apis Array of api model
   * @param {Integer} index apis index
   * @param {Function} callback
   */
  _initExternApi: function (apis, index, callback) {
    if (index >= apis.length) {
      return callback(null)
    }

    let currentApi = apis[index]

    this._initDatabaseApi(currentApi.initDatabase, (err) => {
      if (err) {
        return callback(err)
      }

      if (currentApi.init === undefined) {
        return this._initExternApi(apis, index + 1, callback)
      } else {
        currentApi.init(database, (err) => {
          if (err) {
            return callback(err)
          }

          return this._initExternApi(apis, index + 1, callback)
        })
      }
    })
  },

  /**
   * Init database with file provided in API if provided
   * @param {String} filePath Database init file path
   * @param {Function} callback
   */
  _initDatabaseApi: function (filePath, callback) {
    if (filePath === undefined || filePath === '') {
      return callback(null)
    }

    // Read initDatabase file
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return callback(new Error(`An error occured while reading file DB for api: ${err.toString()}`))
      }

      // Execute query to initialize database
      database.query(data, (err) => {
        if (err) {
          return callback(new Error(`An error occured while initializing database: ${err.toString()}`))
        }

        return callback(null)
      })
    })
  },

  /**
   * Init all addons registered
   * @param {Array} addons Array of addons
   * @param {Integer} index addons index
   * @param {Function} callback
   */
  _initAddons: function (addons, index, callback) {
    if (index >= addons.length) {
      return callback(null)
    }

    let currentAddon = addons[index]

    // Init the addon with it's init function if it exists
    addon.initAddon(database, currentAddon, (err) => {
      if (err) {
        logger.log(`Error while initializing addon ${currentAddon.schemaKeyName}: ${JSON.stringify(err, null, 2)}`, 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
        return process.exit(1)
      }

      this._initAddons(addons, index + 1, callback)
    })
  },

  /**
   * Run the server
   * @param {Object} newConfig Server config
   * @param {Function} callback
   */
  run: function (env, serverPath, options, callback) {
    if (callback === undefined) {
      callback = options
      options = {}
    }

    this._env = env

    // Check server path has been set
    this._serverPath = serverPath

    logger.initLogger(env)

    const _serverFilePath = path.join(this._serverPath, 'index.js')

    // Check if server.js exists to require it
    fs.access(_serverFilePath, fs.F_OK, (err) => {
      if (err) {
        // File does not exists, this is not a problem
        return this._initCluster(env, options, callback)
      }

      // File exists, require it
      if (require.cache[_serverFilePath]) {
        delete require.cache[_serverFilePath]
      }

      this._projectServerFile = require(_serverFilePath)
      return this._initCluster(env, options, callback)
    })
  },

  /**
   * Call a function of the project server file
   * @param {String} functionName Function name in project server file
   * @param {Array} args List of arguments to pass
   * @param {Function} callback
   */
  _callFunctionIfExists: function (functionName, args, callback) {
    if (this._projectServerFile === null) {
      return callback(null)
    }

    if (this._projectServerFile?.[functionName] !== undefined) {
      return this._projectServerFile[functionName].apply(null, args.concat([callback]))
    }

    return callback(null)
  },

  /**
   * Start clusters and server
   * @param {String} env test, dev or prod
   * @param {Function} callback
   */
  _initCluster: function (env, options, callback) {
    this._loadConfig(env, options, (err) => {
      if (err) {
        return callback(err)
      }

      const _initFunction = (env, callback) => {
        this._init(env, (err) => {
          if (err) {
            return callback(err)
          }

          this._server = this._httpServer.listen(this.config.APP_SERVER_PORT, () => {
            const _logOptions = {
              mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster,
              logDate: false
            }

            logger.log(` -- Max query timeout: ${this.config.APP_DATABASE_TIMEOUT || database._defaultTimeout}`, 'info', _logOptions)
            logger.log(` -- Starting application in ${modeName[env]} mode`, 'info', _logOptions)
            logger.log(`    Database : ${this.config.APP_DATABASE_NAME || process.env.APP_DATABASE_NAME}@${this.config.APP_DATABASE_HOST || process.env.APP_DATABASE_HOST}:${this.config.APP_DATABASE_PORT || process.env.APP_DATABASE_PORT}`, 'info', _logOptions)
            logger.log(`    Port     : ${this.config.APP_SERVER_PORT}`, 'info', _logOptions)
            logger.log(`    Clusters : ${this._getNbCluster()}`, 'info', _logOptions)
            logger.log(`    Lang     : ${this.config.APP_SERVER_LANG}`, 'info', _logOptions)
            return callback(null)
          })
        })
      }

      const _nbCluster = this._getNbCluster()
      let _nbClusterReady = 0

      if (_nbCluster === 0) {
        _initFunction(env, callback)
      } else {
        if (cluster.isMaster) {
          for (let i = 0; i < _nbCluster; i++) {
            let worker = null

            if (i === 0) {
              worker = cluster.fork({
                IS_LEADER_THREAD: true,
                IS_LEADER_THREAD_STARTING: true
              })
              this._currentLeaderWorker = worker.id
            } else {
              worker = cluster.fork()
            }

            worker.on('message', (message) => {
              if (message.type === undefined) {
                return
              }

              if (message.type === messageType.startStatus) {
                if (message.success === false) {
                  return callback(new Error('An error occured while starting cluster: ' + JSON.stringify(message.error, null, 2)))
                }

                _nbClusterReady += 1

                if (_nbClusterReady === _nbCluster) {
                  logger.log(' -- All clusters are ready', 'info', { logDate: false })
                  return callback(null)
                }
              }
            })

            // Add worker to list
            this._workers.push(worker)
          }

          cluster.on('message', (worker, message) => {
            if (message.type === messageType.log) {
              logger.log(message.message, message.level, message.options)
            } else if (message.type === messageType.debug) {
              logger.debug(message.message)
            }
          })

          cluster.on('exit', (worker, code, signal) => {
            // If signal is SIGTERM, we don't restart cluster because we are in debug mode
            // So we really want to kill them
            if (signal === 'SIGTERM') {
              return
            }

            logger.log(`Worker #${worker.id} pid: ${worker.process.pid} died (${code})... Restarting new worker...`, 'warn')

            // Find in the worker array, the one which is dead and remove it from the list
            const _workerIndex = this._workers.findIndex((elem) => elem.process.pid === worker.process.pid)

            if (_workerIndex !== -1) {
              this._workers.splice(_workerIndex, 1)
            }

            // Start a new cluster
            let _newWorker = null

            if (this._currentLeaderWorker === worker.id) {
              _newWorker = cluster.fork({
                IS_LEADER_THREAD: true
              })
              this._currentLeaderWorker = _newWorker.id
              logger.log(`Worker #${this._currentLeaderWorker} is the new leader`, 'info')
            } else {
              _newWorker = cluster.fork()
            }
            this._workers.push(_newWorker)
          })
        } else {
          _initFunction(env, (err) => {
            if (err) {
              return process.send({ type: messageType.startStatus, success: false, error: err })
            }

            return process.send({ type: messageType.startStatus, success: true, error: null })
          })
        }
      }
    })
  },

  /**
   * Return the number of cluster depends on user configuration
   */
  _getNbCluster: function () {
    if (this.config.APP_NB_CLUSTER === undefined) {
      return 0
    } else if (this.config.APP_NB_CLUSTER === -1) {
      return os.cpus().length
    } else if (this.config.APP_NB_CLUSTER >= 0) {
      return this.config.APP_NB_CLUSTER
    } else {
      return 1
    }
  },

  /**
   * @param {String} signal Signal to send to child, optional
   * Close the server
   */
  close: function (signal, callback) {
    if (callback === undefined) {
      callback = signal
      signal = 'SIGINT'
    }

    let _closeServer = (callback) => {
      // Require api file here because api require this file
      const _api = require('./api')

      cron.destroyCrons()
      _api._reset()
      database.close(() => {
        if (this._server !== null) {
          this._server.close((err) => {
            if (err) {
              return callback(err)
            }
            this._reset()
            this.config = JSON.parse(JSON.stringify(this._defaultConfig))
            return callback(null)
          })
        } else {
          return callback(null)
        }
      })
    }

    if (cluster.isMaster) {
      if (this._getNbCluster() === 0) {
        // No worker, juste close server
        _closeServer(callback)
      } else {
        // Workers run server, close them
        // If a master call this function, close all workers
        for (let i = 0; i < this._workers.length; i++) {
          process.kill(this._workers[i].process.pid, signal)
        }

        // Remove listeners to avoir memory leak
        cluster.removeAllListeners('exit')

        // Reset server
        this._reset()

        // Wait to be sure all workers are closed
        setTimeout(() => {
          return callback(null)
        }, 200)
      }
    }
  }
}

module.exports = server
