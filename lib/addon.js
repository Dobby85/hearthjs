let addon = {
  /**
   * Init an addon
   * @param {Object} hearth Herathjs instance
   * @param {Object} addon Addon to add
   * @param {Function} callback
   */
  initAddon: function (database, addon, callback) {
    if (addon.init !== undefined) {
      return addon.init(database, callback)
    }
    return callback(null)
  },

  /**
   * Init addon for schema
   * @param {Object} addon Addon register in server
   * @param {Object} database Database object
   * @param {String} route Route associated with schema
   * @param {Object} schema Schema where the key has been used
   * @param {Function} callback
   */
  initSchemaAddon: function (addon, addonValue, database, route, schema, callback) {
    if (addon.initSchema !== undefined) {
      return addon.initSchema(addonValue, database, route, schema, callback)
    }
    return callback(null)
  },

  /**
   * Exec addon exec function
   * @param {Object} addon Addon register in server
   * @param {Object} database Database instance
   * @param {String} route Route called
   * @param {Object} schema Schema where the key has been used
   * @param {Object} req Req from request
   * @param {Object} res Res from request
   * @param {Function} callback
   */
  execAddon: function (addon, addonValue, database, route, schema, req, res, callback) {
    if (addon.exec !== undefined) {
      return addon.exec(addonValue, database, route, schema, req, res, callback)
    }
    return callback(null)
  }
}

module.exports = addon
