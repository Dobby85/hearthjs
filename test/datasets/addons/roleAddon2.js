let roleAddon = {
  schemaKeyName: 'roles',

  init: function (database, callback) {
    return callback(null)
  },

  initSchema: function (addonValue, database, route, schema, callback) {
    return callback(null)
  },

  exec: function (addonValue, database, route, schema, req, res, next) {
    return next(null)
  }
}

module.exports = roleAddon
