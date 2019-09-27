const fs = require('fs')
const path = require('path')
const cluster = require('cluster')
const debug = require('debug')('hearthjs')
const nanoid = require('nanoid')

const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  white: '\u001b[37m',
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  underline: '\u001b[4m',
  reverse: '\u001b[7m',
  cyan: '\u001b[36m',
  orange: '\u001b[38;5;208m',
  grey: '\u001b[38;5;242m',
  yellow: '\u001b[33m'
}

const levelColor = {
  info: colors.cyan,
  error: colors.red,
  warn: colors.orange
}

const logger = {
  _writeLogStream: null,
  _currentDate: null,
  _env: null,

  /**
   * Init logger system
   * @param {String} env test, dev or prod
   * @param {Function} callback
   */
  initLogger: function (env) {
    this._env = env

    this._createLogFile()
  },

  /**
   * This function must be used for test purpose ONLY
   */
  _stop: function () {
    this._writeLogStream.end()
  },

  /**
   * Create new log file with curren date
   */
  _createLogFile: function () {
    if (cluster.isMaster === false) {
      return
    }

    const _date = this._getCurrentDateTime(false)
    const _logFilePath = path.join(process.env.HEARTH_SERVER_PATH, 'logs', `${_date}.log`)
    this._currentDate = _date

    if (this._writeLogStream !== null) {
      this._writeLogStream.end()
    }

    this._writeLogStream = fs.createWriteStream(_logFilePath, { flags: 'a' })

    this._deleteOldLog()
  },

  /**
   * Delete log files too old
   */
  _deleteOldLog: function () {
    const _logsDirectory = path.join(process.env.HEARTH_SERVER_PATH, 'logs')

    fs.readdir(_logsDirectory, (err, files) => {
      if (err) {
        return this.log(err.toString(), 'error')
      }

      files = files.filter((elem) => elem[0] !== '.' && elem.endsWith('.log'))

      if (files.length > 8) {
        for (let i = 0; i < files.length - 8; i++) {
          fs.unlink(path.join(_logsDirectory, files[i]), () => {})
        }
      }
    })
  },

  /**
   * Log a message in log file, console.log it if we are in dev mode
   * @param {String} msg Message to log
   * @param {String} level Log level
   * @param {String} options {
   *   mustLog: true, A condition that must be true, else we don't log
   *   logDate: true Add log a the beginning of the log
   * }
   */
  log: function (msg, level, options) {
    if (options && options.mustLog === false) {
      return
    }

    // Is a worker wants log a message, send it to master
    if (cluster.isMaster === false) {
      return process.send({ type: 'LOG', message: msg, level: level, options: options })
    }

    if (level === undefined) {
      level = 'info'
    }

    const _colorLevelStart = levelColor[level] || ''
    const _colorLevelEnd = (_colorLevelStart) ? colors.reset : ''

    let _logFileMsg = `${this._getCurrentDateTime(true)} ${level.toUpperCase()} ${msg}`
    let _logConsoleMsg = `${colors.grey}${this._getCurrentDateTime(true)}${colors.reset} ${_colorLevelStart}${level.toUpperCase()}${_colorLevelEnd} ${msg}`

    if (options && options.logDate === false) {
      _logFileMsg = msg

      if (level === 'error') {
        _logConsoleMsg = `${colors.red}${msg}${colors.reset}`
      } else if (level === 'warn') {
        _logConsoleMsg = `${colors.orange}${msg}${colors.reset}`
      } else {
        _logConsoleMsg = msg
      }
    }

    // Check if the day has change
    if (this._currentDate === this._getCurrentDateTime(false)) {
      this._writeLogStream.write(`${_logFileMsg}\n`)

      if (this._env === 'dev' && level.toLowerCase() === 'error') {
        console.error(_logConsoleMsg)
      } else if (this._env === 'dev') {
        console.log(_logConsoleMsg)
      }
    } else {
      this._createLogFile()
      this.log(msg, level)
    }
  },

  /**
   * In dev, use debug lib, else log it in file
   * @param {String} msg Message to log
   */
  debug: function (msg) {
    if (cluster.isMaster === false) {
      return process.send({ type: 'LOG', message: msg })
    }

    if (this._env === 'dev') {
      return debug(msg)
    }
  },

  /**
   * Return the log middleware to log requests
   */
  _logMiddleware: function () {
    return (req, res, next) => {
      req.hearth_uid = nanoid(15)
      req.hearth_start = process.hrtime()

      this.log(`Request ${req.hearth_uid} => ${req.method} ${req.url} started`, 'info')

      res.on('finish', () => {
        let _duration = process.hrtime(req.hearth_start)

        this.log(`Request ${req.hearth_uid} => ${req.method} ${req.url} ended in ${_duration[1] / 1e6}ms (${res.statusCode})`)
      })
      next()
    }
  },

  /**
   * Return a stringify date or date time
   * @param {Boolean} needTime True if we want the time
   */
  _getCurrentDateTime: function (needTime) {
    const _currentDate = new Date()
    let _dateString = ''

    _dateString += ((_currentDate.getMonth() + 1).toString().length === 1) ? `0${_currentDate.getMonth() + 1}` : _currentDate.getMonth() + 1
    _dateString += '-'
    _dateString += (_currentDate.getDate().toString().length === 1) ? `0${_currentDate.getDate()}` : _currentDate.getDate()
    _dateString += '-'
    _dateString += _currentDate.getFullYear()

    if (needTime) {
      _dateString += ' '
      _dateString += (_currentDate.getHours().toString().length === 1) ? `0${_currentDate.getHours()}` : _currentDate.getHours()
      _dateString += ':'
      _dateString += (_currentDate.getMinutes().toString().length === 1) ? `0${_currentDate.getMinutes()}` : _currentDate.getMinutes()
      _dateString += ':'
      _dateString += (_currentDate.getSeconds().toString().length === 1) ? `0${_currentDate.getSeconds()}` : _currentDate.getSeconds()
    }

    return _dateString
  }
}

module.exports = logger
