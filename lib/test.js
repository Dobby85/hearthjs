const Mocha = require('mocha')
const server = require('./server')
const path = require('path')
const fs = require('fs')
const watch = require('./watch')

const testFileRegex = /^test\.\S+\.js$/

const test = {
  _testFiles: [],
  _nbCallStart: 0,
  _nbCallEnd: 0,

  /**
   * Launch a test server and run tests
   * @param {Object} options Mocha options
   * @param {Function} callback
   */
  runTest: function (options, callback) {
    // Watch files for any change
    watch.watchServerFiles([/^\/api\/\S*\/test\/test\.\S*\.js$/, /^\/test\/test\.\S*\.js$/], () => {
      server.close((err) => {
        if (err) {
          return callback(err)
        }

        server.run('test', process.env.HEARTH_SERVER_PATH, options, (err) => {
          if (err) {
            return callback(err)
          }

          // Run tests
          this._runMocha(options)
        })
      })
    }, (err) => {
      if (err) {
        return callback(err)
      }

      // Read all tests files
      this._readTestDirectory('/', (err) => {
        if (err) {
          return callback(err)
        }

        // Run server for tests
        server.run('test', process.env.HEARTH_SERVER_PATH, options, (err) => {
          if (err) {
            return callback(err)
          }

          // Run tests
          this._runMocha(options)
        })
      })
    })
  },

  /**
   * Run suite tests
   * @param {Options} options Cli options
   */
  _runMocha: function (options) {
    let mocha = new Mocha()

    mocha.suite.on('require', function (global, file) {
      delete require.cache[file]
    })

    this._testFiles.forEach((filepath) => {
      mocha.addFile(filepath)
    })

    mocha
      .bail(true)
      .ui('bdd')
      .run((code) => {
        if (options.stop) {
          process.exit(code)
        }
      })
  },

  /**
   * Read directory files
   * @param {String} directoryPath Directory path to read
   * @param {Function} callback
   */
  _readTestDirectory: function (directoryPath, callback) {
    let _completePath = path.join(process.env.HEARTH_SERVER_PATH, directoryPath)

    fs.readdir(_completePath, (err, files) => {
      if (err) {
        return callback(err)
      }

      this._nbCallStart += 1
      this._checkFiles(_completePath, directoryPath, files, 0, (err) => {
        if (err) {
          return callback(err)
        }

        this._nbCallEnd += 1

        // Check if we parse all files
        if (this._nbCallStart === this._nbCallEnd) {
          return callback(null)
        }
      })
    })
  },

  /**
   * Loop recursively on all server files and check if there is test files
   * @param {String} completePath Directory path of files list
   * @param {String} directoryPath Directory path from server directory
   * @param {Array} files List of file/directory to check
   * @param {Integer} index files index
   * @param {Function} callback
   */
  _checkFiles: function (completePath, directoryPath, files, index, callback) {
    if (index >= files.length) {
      return callback(null)
    }

    let _currentFile = files[index]
    let _filePath = path.join(completePath, _currentFile)
    let _isDirectory = fs.existsSync(_filePath) && fs.lstatSync(_filePath).isDirectory()

    // Check if path is a directory. If it is, parse it too
    if (_isDirectory && _filePath.includes('uploads') === false) {
      this._readTestDirectory(path.join(directoryPath, _currentFile), (err) => {
        if (err) {
          return callback(err)
        }
      })
    } else {
      // Check if file is a test file
      if (testFileRegex.test(_currentFile)) {
        this._testFiles.push(_filePath)
      }
    }

    this._checkFiles(completePath, directoryPath, files, index + 1, callback)
  }
}

module.exports = test
