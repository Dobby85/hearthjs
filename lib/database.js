const { Pool } = require('pg')
const fs = require('fs')
const mustache = require('./mustache')
const converter = require('./converter')
const logger = require('./logger')
const cluster = require('cluster')

const database = {
  _pool: null,
  _sqlFiles: {}, // { filename: filepath }
  _defaultTimeout: 10000,

  /**
   * Connect the database pool
   * @param {String} user Database user
   * @param {String} host Database host
   * @param {String} database Database name
   * @param {String} password Database password
   * @param {INteger} port Database port
   * @param {Integer} timeout Database timeout
   * @param {Function} callback
   */
  init: function (conf, callback) {
    conf.timeout = (conf.timeout === undefined) ? this._defaultTimeout : parseInt(conf.timeout)

    // Conserve pour recycle() : permet de reconstruire un pool identique apres une panne
    this._initConf = conf

    this._pool = new Pool({
      user: (process.env.APP_DATABASE_USER === undefined) ? conf.user : process.env.APP_DATABASE_USER,
      host: (process.env.APP_DATABASE_HOST === undefined) ? conf.host : process.env.APP_DATABASE_HOST,
      database: (process.env.APP_DATABASE_NAME === undefined) ? conf.database : process.env.APP_DATABASE_NAME,
      password: (process.env.APP_DATABASE_PASSWORD === undefined) ? conf.password : process.env.APP_DATABASE_PASSWORD,
      port: (process.env.APP_DATABASE_PORT === undefined) ? conf.port : process.env.APP_DATABASE_PORT,
      max: (process.env.APP_DATABASE_POOL_MAX !== undefined) ? parseInt(process.env.APP_DATABASE_POOL_MAX) : (conf.poolMax !== undefined ? parseInt(conf.poolMax) : 10),
      keepAlive: conf.keepAlive !== undefined ? conf.keepAlive : true,
      keepAliveInitialDelayMillis: conf.keepAliveInitialDelayMillis !== undefined ? conf.keepAliveInitialDelayMillis : 10000,
      idleTimeoutMillis: conf.idleTimeoutMillis !== undefined ? conf.idleTimeoutMillis : 30000,
      connectionTimeoutMillis: conf.connectionTimeoutMillis !== undefined ? conf.connectionTimeoutMillis : 10000,
      maxLifetimeSeconds: conf.maxLifetimeSeconds !== undefined ? conf.maxLifetimeSeconds : 3600,
      // statement_timeout via le parametre de connexion 'options' : applique par le serveur a
      // CHAQUE connexion du pool des l'etablissement. L'ancien `SET statement_timeout` (une
      // requete au demarrage) ne couvrait que LA connexion qui l'avait executee : les autres
      // n'avaient aucun timeout et une requete pendue tenait son slot indefiniment.
      options: `-c statement_timeout=${conf.timeout}`,
      // Filet de securite cote client : si le serveur ne repond plus du tout (connexion a
      // moitie morte, proxy qui stalle), la requete erreure quand meme et rend son slot au
      // pool. Legerement superieur au statement_timeout pour laisser le serveur repondre
      // en premier avec une vraie erreur SQL.
      query_timeout: conf.queryTimeout !== undefined ? parseInt(conf.queryTimeout) : conf.timeout + 5000
    })

    this._pool.connect((err, client, done) => {
      if (err) {
        return callback(err)
      }

      done()

      // Verifie que le pool sait executer une requete (le statement_timeout est desormais
      // porte par chaque connexion via le parametre 'options' ci-dessus)
      this.query('SELECT 1;', (err, res) => {
        if (err) {
          return callback(err)
        }

        return callback(null)
      })
    })

    this._pool.on('error', (err) => {
      logger.log(JSON.stringify(err, null, 2), 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
    })

    // Un seul handler 'error' par connexion physique, pose a la creation du client (evenement
    // 'connect' du pool, emis une fois par nouvelle connexion). Empeche que le noop soit re-ajoute
    // a chaque queryCallback sur des clients reutilises (fuite de listeners -> MaxListenersExceeded
    // -> croissance memoire lente sur les connexions long-vivantes du pool).
    this._pool.on('connect', (client) => {
      client.on('error', () => {}) // noop : empeche le throw, le callback de query gere l'erreur
    })
  },

  /**
   * Recycle the pool : recree un pool neuf avec la configuration d'origine et abandonne
   * l'ancien. A utiliser quand le pool est irrecuperable (slots fuites ou pendus apres une
   * coupure reseau vers la base) : les nouvelles requetes repartent sur des connexions
   * saines sans redemarrer le process.
   * @param {Function} callback callback(err) — err si le nouveau pool ne peut pas se connecter
   */
  recycle: function (callback) {
    const oldPool = this._pool
    this._pool = null

    if (oldPool !== null) {
      // Fin de l'ancien pool en best-effort, SANS attendre : end() ne rend la main que
      // lorsque tous les clients sont revenus, or des clients fuites/pendus peuvent ne
      // jamais revenir — c'est precisement la raison du recyclage.
      oldPool.end(() => {
        logger.log('[Database recycle] old pool ended', 'info', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      })
    }

    return this.init(this._initConf || {}, callback)
  },

  /**
   * Close pool
   * @param {Function} callback
   */
  close: function (callback) {
    this._sqlFiles = {}

    if (this._pool !== null) {
      this._pool.end(() => {
        this._pool = null
        return callback()
      })
    } else {
      return callback()
    }
  },

  /**
   * Register a SQL file
   * @param {String} filePath SQL file to register
   */
  registerSQLFile: function (filePath) {
    let splitted = filePath.split('/')
    let name = splitted[splitted.length - 1].split('.')[0]

    if (this._sqlFiles[name] !== undefined) {
      logger.log(`${name}.sql already exists. Skipping it...`, 'warn', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
    } else {
      this._sqlFiles[name] = filePath
    }
  },

  /**
   * Register a SQL file if it does not already exists
   * @param {String} filePath SQL file to register
   */
  registerSQLFileIfNotExists: function (filePath) {
    let splitted = filePath.split('/')
    let name = splitted[splitted.length - 1].split('.')[0]

    if (this._sqlFiles[name] === undefined) {
      this._sqlFiles[name] = filePath
    }
  },

  /**
   * Exec query of a registered SQL file with callback if provided, else it uses promise
   * @param {String} name Filename
   * @param {Object} data Query params
   * @param {Object} model Model of data to return
   * @param {Function} callback
   */
  exec: function (name, data, model, callback) {
    if (typeof data === 'function') {
      callback = data
      data = {}
      model = null
    } else if (typeof model === 'function') {
      callback = model
      model = null
    }

    if (callback === undefined) {
      return new Promise((resolve, reject) => {
        this.execCallback(name, data, model, (err, result, object) => {
          if (err) {
            return reject(err)
          }

          return resolve({ result, object })
        })
      })
    }

    return this.execCallback(name, data, model, callback)
  },

  /**
   * Exec query of a registered SQL file
   * @param {String} name Filename
   * @param {Object} data Query params
   * @param {Object} model Model of data to return
   * @param {Function} callback
   */
  execCallback: function (name, data, model, callback) {
    if (this._sqlFiles[name] === undefined) {
      return callback(new Error(`Unknow SQL file ${name}`))
    }

    // Read SQL query
    fs.readFile(this._sqlFiles[name], 'utf-8', (err, content) => {
      if (err) {
        return callback(err)
      }

      mustache.render(content, data, model, this._sqlFiles, (err, obj) => {
        if (err) {
          return callback(err)
        }

        if (obj.print_ready) {
          console.log('-- SQL Request --')
          console.log(this.prepareRequestToPrint(obj.string, obj.data))
        }

        // Print for debug
        if (obj.print !== undefined && obj.print === true) {
          console.log('-- SQL Request --')
          console.log(obj.string)
          console.log('-- Transform data --')
          console.log(JSON.stringify(obj.data))
        }

        this.query(obj.string, obj.data, (err, res, rows) => {
          if (err) {
            return callback(new Error(`Error while executing query for file ${name}.sql. ${err.toString()} (${err.detail} | ${err.hint})`))
          }

          let formattedObject = rows
          if (model !== undefined && model !== null) {
            try {
              formattedObject = converter.sqlToJson(model, rows)
            } catch (e) {
              return callback(e + ` for model ${JSON.stringify(model)}`)
            }
          }

          return callback(null, res, formattedObject)
        })
      })
    })
  },

  /**
   * Execute a SQL query with callback if provided, else it uses promise
   * @param {String} query Query
   * @param {Array} params Params
   * @param {Function} callback
   */
  query: function (query, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    if (callback === undefined) {
      return new Promise((resolve, reject) => {
        this.queryCallback(query, params, (err, result, rows) => {
          if (err) {
            return reject(err)
          }

          return resolve({ result, rows })
        })
      })
    }

    return this.queryCallback(query, params, callback)
  },

  /**
   * Execute a SQL query
   * @param {String} query Query
   * @param {Array} params Params
   * @param {Function} callback
   */
  queryCallback: function (query, params, callback) {
    if (this._pool === null) {
      return callback(new Error('Pool is not connected'))
    }

    this._pool.connect((err, client, done) => {
      if (err) {
        return callback(err)
      }

      // Le handler 'error' noop est pose une seule fois a la creation du client (voir init,
      // pool.on('connect')), pas ici : sinon il s'empile a chaque requete sur les clients reutilises.

      try {
        client.query(query, params, (err, res) => {
          done()
          // Check query return rows else return an empty array
          let rows = []
          if (res !== undefined && res.rows !== undefined) {
            rows = res.rows
          }
          return callback(err, res, rows)
        })
      } catch (e) {
        // Throw synchrone de client.query (client dans un etat inconnu) : liberer ET detruire la
        // connexion (argument truthy => retiree du pool au lieu d'y revenir). Sans ce done(e), la
        // connexion fuit definitivement ; au bout de `max` fuites le pool est vide et tout
        // pool.connect() jette 'timeout exceeded when trying to connect' jusqu'au restart.
        done(e)
        return callback(e)
      }
    })
  },

  prepareRequestToPrint: function (query, params) {
    let tmpQuery = query

    for (let i = 0; i < params.length; i++) {
      if (typeof params[i] === 'string') {
        tmpQuery = tmpQuery.replace(`$${i + 1}`, `'${params[i]}'`)
      } else {
        tmpQuery = tmpQuery.replace(`$${i + 1}`, params[i])
      }
    }

    const newLines = []
    const lines = tmpQuery.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().length > 0) {
        newLines.push(lines[i])
      }
    }

    return newLines.join('\n')
  }
}

module.exports = database
