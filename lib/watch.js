const path = require('path')
const fs = require('fs')

let watchedDirectory = [
  /^\/api\/\S*\/api\.\S*\.js$/, // Watch all api.js file
  /^\/api\/\S*\/sql\/\S*\.sql$/ // Watch all api sql files
] // Add watched files in this list

const watch = {
  /**
   * Parse server diretory to watch files
   * @param {Function} callbackStatus Callback which will be called for each changes
   * @param {Function} callback
   */
  watchServerFiles: function (newWatchedDirectories, callbackStatus, callback) {
    if (callback === undefined) {
      callback = callbackStatus
      callbackStatus = newWatchedDirectories
      newWatchedDirectories = []
    }

    watchedDirectory = watchedDirectory.concat(newWatchedDirectories)
    this._parseDirectory('/', callbackStatus, callback)
  },

  /**
   * Parse recursively a directory to watch wanted files
   * @param {String} directoryPath Directory path from server
   * @param {Function} callbackStatus Callback which will be called for each changes
   * @param {Function} callback
   */
  _parseDirectory: function (directoryPath, callbackStatus, callback) {
    let _completePath = path.join(process.env.HEARTH_SERVER_PATH, directoryPath)

    fs.readdir(_completePath, (err, files) => {
      if (err) {
        return callback(err)
      }

      // Loop on files, check if it's a file or a directory
      for (let i = 0; i < files.length; i++) {
        let _filePath = path.join(_completePath, files[i])
        let _isDirectory = fs.existsSync(_filePath) && fs.lstatSync(_filePath).isDirectory()

        if (_isDirectory) {
          // Call this function again to parse the new directory
          this._parseDirectory(path.join(directoryPath, files[i]), callbackStatus, () => {})
        } else {
          for (let j = 0; j < watchedDirectory.length; j++) {
            if (watchedDirectory[j].test(path.join(directoryPath, files[i]))) {
              // This file must be watched
              fs.watchFile(path.join(_completePath, files[i]), { persistent: true, interval: 500 }, (oldStat, newStat) => {
                if (newStat.mtime.getTime() !== oldStat.mtime.getTime()) {
                  return callbackStatus('change', files[i])
                }
              })
            }
          }
        }
      }
      return callback(null)
    })
  }
}

module.exports = watch
