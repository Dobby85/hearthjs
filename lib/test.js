const Mocha = require('mocha')
const server = require('./server')
const path = require('path')
const fs = require('fs')
const watch = require('./watch')

const testFileRegex = /^test\.\S+\.js$/

const test = {
  _testFiles: [],

  /**
   * Launch a test server and run tests
   * @param {Object} options Mocha options
   * @param {Function} callback
   */
  runTest: function (options, callback) {
    this._testFiles = []

    // Read all tests files
    this._readTestDirectory('/', (err) => {
      if (err) {
        return callback(err)
      }

      let _files = this._filterTestFiles(this._testFiles, options.file)

      // Just print the list of test files and exit
      if (options.list) {
        this._printTestFiles(_files)
        return process.exit(0)
      }

      if (_files.length === 0) {
        console.log(`No test file matches ${JSON.stringify(options.file)}`)
        this._printTestFiles(this._testFiles)
        return process.exit(1)
      }

      this._testFiles = _files

      // One shot run: no need to watch files, the process exits at the end
      if (options.stop) {
        return server.run('test', process.env.HEARTH_SERVER_PATH, options, (err) => {
          if (err) {
            return callback(err)
          }

          this._runMocha(options)
        })
      }

      // Watch files for any change
      watch.watchServerFiles([/^\/api\/\S*\/test\/test\.\S*\.js$/, /^\/test\/test\.\S*\.js$/], (action, filename, filepath) => {
        // Delete cache of file which has been changed
        delete require.cache[filepath]

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
   * Keep only test files matching one of the given patterns
   * A pattern is matched against the file path relative to the server directory,
   * so "blog", "test.blog.js" and "api/blog/test" all work
   * @param {Array} files List of test file paths
   * @param {Array} patterns List of patterns given with --file
   * @return {Array} Filtered list of test file paths
   */
  _filterTestFiles: function (files, patterns) {
    if (patterns === undefined || patterns.length === 0) {
      return files
    }

    return files.filter((filepath) => {
      let _relative = path.relative(process.env.HEARTH_SERVER_PATH, filepath).split(path.sep).join('/').toLowerCase()

      return patterns.some((pattern) => {
        return _relative.includes(pattern.split(path.sep).join('/').toLowerCase())
      })
    })
  },

  /**
   * Print the given test files, relatively to the server directory
   * @param {Array} files List of test file paths
   */
  _printTestFiles: function (files) {
    console.log(`${files.length} test file(s):`)

    files.forEach((filepath) => {
      console.log(`  ${path.relative(process.env.HEARTH_SERVER_PATH, filepath).split(path.sep).join('/')}`)
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

    if (options.grep !== undefined) {
      mocha.grep(options.grep)
    }

    mocha
      .bail(options.bail !== false)
      .ui('bdd')
      .run((code) => {
        if (options.stop) {
          process.exit(code)
        }
      })
  },

  /**
   * Read recursively a directory and collect every test file in _testFiles
   * @param {String} directoryPath Directory path from server directory
   * @param {Function} callback
   */
  _readTestDirectory: function (directoryPath, callback) {
    try {
      this._checkFiles(directoryPath)
    } catch (err) {
      return callback(err)
    }

    return callback(null)
  },

  /**
   * Loop recursively on all server files and check if there is test files
   * @param {String} directoryPath Directory path from server directory
   */
  _checkFiles: function (directoryPath) {
    let _completePath = path.join(process.env.HEARTH_SERVER_PATH, directoryPath)
    let _files = fs.readdirSync(_completePath)

    for (let i = 0; i < _files.length; i++) {
      let _currentFile = _files[i]
      let _filePath = path.join(_completePath, _currentFile)
      let _isDirectory = fs.existsSync(_filePath) && fs.lstatSync(_filePath).isDirectory()

      // Check if path is a directory. If it is, parse it too
      if (_isDirectory) {
        if (_filePath.includes('uploads') === false) {
          this._checkFiles(path.join(directoryPath, _currentFile))
        }
      } else if (testFileRegex.test(_currentFile)) {
        // Check if file is a test file
        this._testFiles.push(_filePath)
      }
    }
  }
}

module.exports = test
