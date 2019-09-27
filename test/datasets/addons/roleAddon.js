let roleAddon = {
  schemaKeyName: 'roles',

  init: function (database, callback) {
    database.query('CREATE TABLE IF NOT EXISTS "RoleTest" ("id" SERIAL PRIMARY KEY, "role" VARCHAR(255), "route" VARCHAR(255))', (err, res) => {
      if (err) {
        return callback(err)
      }
      return callback(null)
    })
  },

  initSchema: function (addonValue, database, route, schema, callback) {
    this._insertRoles(database, route, addonValue, 0, callback)
  },

  _insertRoles: function (database, route, roles, index, callback) {
    if (index >= roles.length) {
      return callback(null)
    }

    database.query('INSERT INTO "RoleTest" ("role", "route") VALUES ($1, $2)', [roles[index], route], (err) => {
      if (err) {
        console.log('ERROR', err)
        return callback(err)
      }
      return this._insertRoles(database, route, roles, index + 1, callback)
    })
  },

  exec: function (addonValue, database, route, schema, req, res, next) {
    database.query('SELECT "role" FROM "RoleTest" WHERE "route" = $1', [route], (err, res, rows) => {
      if (err) {
        return next(err.toString())
      }

      let index = rows.findIndex(elem => elem.role === 'ADMIN')

      if (index !== -1) {
        return next()
      }
      return next('Only ADMIN can access')
    })
  }
}

module.exports = roleAddon
