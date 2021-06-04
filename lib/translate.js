const fs = require('fs')
const path = require('path')
const colors = {
  green: '\u001b[32m',
  red: '\u001b[31m',
  white: '\u001b[37m',
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  underline: '\u001b[4m',
  reverse: '\u001b[7m',
  yellow: '\u001b[33m'
}
const directoryToIgnore = ['/uploads', '/migration', '/sql', '/config', '/datasets', '/logs']

let translations = {}
let defaultLanguage = null
let matchedKeys = []
let parseOptions = {
  verbose: 0,
  from: '/',
  recursive: true,
  delete: false
}
let indentation = 0

const translate = {
  /**
   * Use this function as a marker to find all your translations
   * @param {String} key Key to return
   */
  t: function (key) {
    return key
  },

  /**
   * Return the translated value for key in lang
   * @param {String} key Key to translate
   * @param {String} lang Optional lang
   */
  tr: function (key, lang) {
    if (translations[lang] === undefined && translations[defaultLanguage] === undefined) {
      // No language exists, return the key
      return key
    } else if (translations[lang] === undefined && translations[defaultLanguage] !== undefined) {
      // No language has been specified, use default language

      if (translations[defaultLanguage][key] === undefined || translations[defaultLanguage][key] === '') {
        // Key does not exists for default language, return the key
        return key
      }

      // Key exists, return the translated value
      return translations[defaultLanguage][key]
    } else if (translations[lang] !== undefined) {
      // A lang has been specified, use it

      if (translations[lang][key] === undefined || translations[lang][key] === '') {
        // Key does not exists for lang, return the key
        return key
      }

      // Key exists, return the translated value
      return translations[lang][key]
    } else {
      return key
    }
  },

  /**
   * Parse lang directory and register all translations
   * @param {String} defaultLanguage Server default language
   * @param {Function} callback
   */
  initTranslations: function (defaultLang, callback) {
    defaultLanguage = defaultLang
    const _langDirectory = path.join(process.env.HEARTH_SERVER_PATH, 'lang')

    // Read lang files
    fs.readdir(_langDirectory, (err, files) => {
      if (err) {
        return callback(err)
      }

      this._readLangFiles(files, 0, callback)
    })
  },

  /**
   * Read all lang files and parse their content
   * @param {Array} files Array of lang files name
   * @param {Integer} index files index
   * @param {Function} callback
   */
  _readLangFiles: function (files, index, callback) {
    if (index >= files.length) {
      return callback(null)
    }

    const _currentFile = files[index]

    // Ignore hidden files
    if (_currentFile[0] === '.') {
      return this._readLangFiles(files, index + 1, callback)
    }

    const _keyName = _currentFile.split('.')[0]
    const _filePath = path.join(process.env.HEARTH_SERVER_PATH, 'lang', _currentFile)

    // Read lang files
    fs.readFile(_filePath, 'utf8', (err, content) => {
      if (err) {
        return callback(err)
      }

      // Parse content file
      let _parsedContent = null

      try {
        _parsedContent = JSON.parse(content)
      } catch (e) {
        return callback(new Error(`Error while parsing ${_filePath}`))
      }

      translations[_keyName] = _parsedContent

      // Parse next file
      this._readLangFiles(files, index + 1, callback)
    })
  },

  /**
   * Find all translations token and update lang files
   * @param {String} lang The user wanted translation lang
   * @param {Object} options CLI options
   * @param {Function} callback
   */
  parseTokens: function (lang, options, callback) {
    parseOptions.verbose = parseOptions.verbose || options.verbose
    parseOptions.from = options.from || parseOptions.from
    parseOptions.recursive = options.recursive
    parseOptions.delete = parseOptions.delete || options.delete

    if (parseOptions.from[0] !== '/') {
      parseOptions.from = path.join('..', parseOptions.from)
    }

    // Find all keys
    this._parseDirectoryFiles(parseOptions.from, (err) => {
      if (err) {
        return callback(err)
      }

      this._verbose([3], '')
      return this._readLangDirectory(lang, callback)
    })
  },

  /**
   * Check if user specified a lang, else update all lang files
   * @param {String} lang Lang to update
   * @param {Function} callback
   */
  _readLangDirectory: function (lang, callback) {
    if (lang !== undefined) {
      return this._updateLangFiles([lang + '.json'], 0, callback)
    }

    // Read all lang files to update all of them
    fs.readdir(path.join(process.env.HEARTH_SERVER_PATH, 'lang'), (err, files) => {
      if (err) {
        return callback(err)
      }

      // Filter files to remove hidden files and keep only json file
      files = files.filter(elem => elem[0] !== '.' && elem.endsWith('.json'))

      this._updateLangFiles(files, 0, callback)
    })
  },

  /**
   * Loop on all lang files and update them with new keys
   * @param {Array} langs List of lang files to update
   * @param {Integer} index langs index
   * @param {Function} callback
   */
  _updateLangFiles: function (langs, index, callback) {
    if (index >= langs.length) {
      return callback(null)
    }

    let _currentFile = langs[index]
    let _filePath = path.join(process.env.HEARTH_SERVER_PATH, 'lang', _currentFile)

    if (index > 0) {
      this._verbose([1, 2, 3], '')
    }
    this._verbose([1, 2, 3], `${colors.reverse}${colors.bold} Update ${_currentFile} ${colors.reset}`)

    this._getLangFileContent(_filePath, (err, content) => {
      if (err) {
        return callback(err)
      }

      // Parse content
      let _parsedContent = null

      try {
        _parsedContent = JSON.parse(content)
      } catch (e) {
        return callback(new Error(`Cannot parse ${_filePath}`))
      }

      let _newKeys = {}
      let _makeAction = false

      // Loop on all parsed keys and create an object with new keys
      for (let i = 0; i < matchedKeys.length; i++) {
        if (_parsedContent[matchedKeys[i].token] === undefined) {
          _makeAction = true
          this._verbose([1], `  - ${colors.green}${matchedKeys[i].token}${colors.reset}`)
          this._verbose([2, 3], `  - ${colors.green}${matchedKeys[i].token}${colors.reset} from ${colors.underline}${matchedKeys[i].filePath}${colors.reset}`)
          _newKeys[matchedKeys[i].token] = ''
        }
      }

      // If user active the delete unused key option, delete them
      if (parseOptions.delete) {
        for (let key in _parsedContent) {
          if (matchedKeys.findIndex(elem => elem.token === key) === -1) {
            _makeAction = true
            this._verbose([1, 2, 3], `  - ${colors.red}${key}${colors.reset}`)
            delete _parsedContent[key]
          }
        }
      }

      if (_makeAction === false) {
        this._verbose([1, 2, 3], '  - Nothing to do')
      }

      let _newObject = Object.assign(_newKeys, _parsedContent)

      // write new object in lang file
      fs.writeFile(_filePath, JSON.stringify(_newObject, null, 2), (err) => {
        if (err) {
          return callback(err)
        }

        return this._updateLangFiles(langs, index + 1, callback)
      })
    })
  },

  /**
   * Check if file exists, return an empty object if not
   * @param {String} filePath File path to read
   * @param {Function} callback
   */
  _getLangFileContent: function (filePath, callback) {
    fs.access(filePath, fs.F_OK, (err) => {
      if (err) {
        return callback(null, '{}')
      }

      fs.readFile(filePath, 'utf8', callback)
    })
  },

  /**
   * Read all files of a directory
   * @param {String} directoryPath Directory to read
   * @param {Function} callback
   */
  _parseDirectoryFiles: function (directoryPath, callback) {
    let _completePath = path.join(process.env.HEARTH_SERVER_PATH, directoryPath)

    this._verbose([3], `${this._getIndentation()}${colors.underline}${_completePath}${colors.reset}`)
    fs.readdir(_completePath, (err, files) => {
      if (err) {
        return callback(err)
      }

      this._loopOnServerFiles(directoryPath, files, 0, (err) => {
        if (err) {
          return callback(err)
        }

        return callback(null)
      })
    })
  },

  /**
   * Loop recursively on all directory files
   * @param {String} directoryPath Directory path from server
   * @param {Array} files List of files in directoryPath
   * @param {Integer} index files index
   * @param {Function} callback
   */
  _loopOnServerFiles: function (directoryPath, files, index, callback) {
    for (let i = 0; i < directoryToIgnore.length; i++) {
      if (directoryPath.startsWith(directoryToIgnore[i])) {
        return callback(null)
      }
    }

    if (index >= files.length) {
      return callback(null)
    }

    let _currentFile = files[index]
    let _filePath = path.join(process.env.HEARTH_SERVER_PATH, directoryPath, _currentFile)
    let _isDirectory = fs.existsSync(_filePath) && fs.lstatSync(_filePath).isDirectory()

    // Check if file is a directory or a file to call the right function
    if (_isDirectory) {
      if (parseOptions.recursive) {
        indentation += 1
        return this._parseDirectoryFiles(path.join(directoryPath, _currentFile), (err) => {
          if (err) {
            return callback(err)
          }

          indentation -= 1
          this._loopOnServerFiles(directoryPath, files, index + 1, callback)
        })
      }

      return this._loopOnServerFiles(directoryPath, files, index + 1, callback)
    }

    indentation += 1
    this._verbose([3], `${this._getIndentation()}${colors.bold}${_currentFile}${colors.reset}`)
    // if it's a file, check if it contains translation key
    this._parseFile(_filePath, (err) => {
      if (err) {
        return callback(err)
      }

      indentation -= 1
      this._loopOnServerFiles(directoryPath, files, index + 1, callback)
    })
  },

  /**
   * Read a file and match all occurence of the t function
   * @param {String} filePath File to read
   * @param {Function} callback
   */
  _parseFile: function (filePath, callback) {
    const _translateRegex = /[^a-su-zA-Z0-9][t|tr]\(['|"]{1}([a-zA-Z0-9. ,/\\|?!:+\-*=]+)['|"]{1},?['|"]? ?['|"]?\S*?['|"]?\)/g

    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return callback(err)
      }

      let _match = null
      indentation += 1

      // Find all occurence of the t function
      do {
        _match = _translateRegex.exec(content)

        if (_match && matchedKeys.findIndex(elem => elem.token === _match[1]) === -1) {
          this._verbose([3], `${this._getIndentation()}${colors.yellow}${_match[1]}${colors.reset}`)
          matchedKeys.push({ token: _match[1], filePath: filePath })
        }
      } while (_match)

      indentation -= 1
      return callback(null)
    })
  },

  /**
   * Return a string with spaces to display the indentation
   */
  _getIndentation: function () {
    let _spaces = ''

    for (let i = 0; i < indentation; i++) {
      _spaces += '   '
    }

    return _spaces
  },

  /**
   * Display the message if user ask this level of verbosity
   * @param {Array} level List of level where the message must be display
   * @param {Function} message
   */
  _verbose: function (level, message) {
    if (level.indexOf(parseOptions.verbose) !== -1) {
      console.log(message)
    }
  },

  // ******************************************** //
  // FOLLOWING FUNCTION ARE FOR TEST PURPOSE ONLY //
  // ******************************************** //

  _getDefaultLanguage: function () {
    return defaultLanguage
  },

  _setDefaultLanguage: function (value) {
    defaultLanguage = value
  },

  _getTranslations: function () {
    return translations
  },

  _setTranslations: function (value) {
    translations = value
  },

  _getOptions: function () {
    return parseOptions
  },

  _setKeyParseOptions: function (key, value) {
    parseOptions[key] = value
  },

  _getMatchedKeys: function () {
    return matchedKeys
  },

  _setMatchedKeys: function (list) {
    matchedKeys = list
  }
}

module.exports = translate
