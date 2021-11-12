const database = require('./database')
const helper = require('./helper')

const datasets = {
  _isDatabaseInitialized: false,

  /**
   * Insert a set of data in database
   * @param {Array} datasetsName Datasets name to insert in database
   * @param {Function} callback
   */
  insert: function (datasetsName, callback) {
    // Check if database has been initialized
    if (this._isDatabaseInitialized === false) {
      return helper.loadConfForDatabase('test', (err, databaseConf) => {
        if (err) {
          return callback(err)
        }

        // Initialize the database for datasets
        database.init(databaseConf, (err) => {
          if (err) {
            return callback(err)
          }

          this._isDatabaseInitialized = true
          this._insertDatasets(datasetsName, 0, callback)
        })
      })
    }
    this._insertDatasets(datasetsName, 0, callback)
  },

  /**
   * Insert a list of datasets
   * @param {Array} datasetsName List of datasets to insert
   * @param {Integer} index Inder of datasetsName
   * @param {Function} callback
   */
  _insertDatasets: function (datasetsName, index, callback) {
    if (datasetsName[index] === undefined) {
      return callback(null)
    }

    // Insert dataset
    database.exec(datasetsName[index], (err) => {
      if (err) {
        return callback(err)
      }

      this._insertDatasets(datasetsName, index + 1, callback)
    })
  },

  /**
   * Clean all tables
   * @param {Function} callback
   */
  clean: function (callback) {
    database.exec('getTableList', (err, res, rows) => {
      if (err) {
        return callback(err)
      }

      if (rows.length === 0) {
        return callback(null)
      }

      // Construct query to truncate all tables
      let _queryToExecute = 'TRUNCATE TABLE '
      _queryToExecute += rows.map(elem => `"${elem.table_name}"`).join(', ')
      _queryToExecute += ' CASCADE;'

      // Clean table
      database.query(_queryToExecute, callback)
    })
  }
}

module.exports = datasets
