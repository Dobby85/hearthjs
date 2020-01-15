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

    this._pool = new Pool({
      user: (process.env.APP_DATABASE_USER === undefined) ? conf.user : process.env.APP_DATABASE_USER,
      host: (process.env.APP_DATABASE_HOST === undefined) ? conf.host : process.env.APP_DATABASE_HOST,
      database: (process.env.APP_DATABASE_NAME === undefined) ? conf.database : process.env.APP_DATABASE_NAME,
      password: (process.env.APP_DATABASE_PASSWORD === undefined) ? conf.password : process.env.APP_DATABASE_PASSWORD,
      port: (process.env.APP_DATABASE_PORT === undefined) ? conf.port : process.env.APP_DATABASE_PORT,
      max: 10
    })

    this._pool.connect((err, client, done) => {
      if (err) {
        return callback(err)
      }
      done()

      // Set timeout for requests
      this.query(`SET statement_timeout TO ${conf.timeout};`, (err, res) => {
        if (err) {
          return callback(err)
        }

        return callback(null)
      })
    })

    this._pool.on('error', (err) => {
      logger.log(JSON.stringify(err, null, 2), 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
    })
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
   * Exec query of a registered SQL file
   * @param {String} name Filename
   * @param {Object} data Query params
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

        // Print for debug
        if (obj.print !== undefined && obj.print === true) {
          console.log('-- SQL Request --')
          console.log(obj.string)
          console.log('-- req --')
          console.log(data)
          console.log('-- Transform data --')
          console.log(obj.data)
        }

        this.query(obj.string, obj.data, (err, res, rows) => {
          if (err) {
            return callback(new Error(`Error while executing query for file ${name}.sql. ${err.toString()}`))
          }

          let formattedObject = rows
          if (model !== undefined && model !== null) {
            formattedObject = converter.sqlToJson(model, rows)
          }

          return callback(null, res, formattedObject)
        })
      })
    })
  },

  /**
   * Execute a SQL query
   * @param {String} query Query
   * @param {Array} params Params
   * @param {Function} callback
   */
  query: function (query, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    if (this._pool === null) {
      return callback(new Error('Pool is not connected'))
    }

    this._pool.connect((err, client, done) => {
      if (err) {
        return callback(err)
      }

      client.query(query, params, (err, res) => {
        done()
        // Check query return rows else return an empty array
        let rows = []
        if (res !== undefined && res.rows !== undefined) {
          rows = res.rows
        }
        return callback(err, res, rows)
      })
    })
  }
}

module.exports = database
