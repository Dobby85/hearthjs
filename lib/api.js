const server = require('./server')
const database = require('./database')
const validation = require('./validation')
const addon = require('./addon')
const logger = require('./logger')
const cluster = require('cluster')

const api = {
  _apiList: {},
  _currentApiName: '',
  _nbRouteDeclared: 0,
  _nbRouteServed: 0,

  /**
   * Reset all API variables
   */
  _reset: function () {
    this._apiList = {}
    this._currentApiName = ''
  },

  /**
   * Define all API routes defined by the user
   * @param {String} apiName Name of the API
   * @param {Function} definition Define all API routes
   */
  define: function (apiName, schemas, definition) {
    this._currentApiName = apiName

    if (this._apiList[apiName] !== undefined) {
      logger.log(`${apiName} has already been declared`, 'warn', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      this._checkApiIsReady()
      return
    }

    // Register API
    this._apiList[apiName] = {
      schemas: schemas,
      routes: {}
    }
    definition(this)
  },

  /**
   * Add a GET route to the server
   * @param {String} route Route like express
   * @param {Object} schemaName Route schema
   */
  get: function (route, schemaName) {
    this._addRoute('GET', route, schemaName)
  },

  /**
   * Add a POST route to the server
   * @param {String} route Route like express
   * @param {Object} schemaName Route schema
   */
  post: function (route, schemaName) {
    this._addRoute('POST', route, schemaName)
  },

  /**
   * Add a PUT route to the server
   * @param {String} route Route like express
   * @param {Object} schemaName Route schema
   */
  put: function (route, schemaName) {
    this._addRoute('PUT', route, schemaName)
  },

  /**
   * Add a DELETE route to the server
   * @param {String} route Route like express
   * @param {Object} schemaName Route schema
   */
  delete: function (route, schemaName) {
    this._addRoute('DELETE', route, schemaName)
  },

  /**
   * Add a route to the server
   * @param {String} method Route method
   * @param {String} route Route
   * @param {Object} schemaName Details of route
   */
  _addRoute: function (method, route, schemaName) {
    if (schemaName === undefined) {
      logger.log(`You must specify a function or a schema for ${route}`, 'warn', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      this._checkApiIsReady()
      return
    }

    // Check route begin with '/'
    if (route.startsWith('/') === false) {
      route = `/${route}`
    }

    if (this._apiList[this._currentApiName].routes[`${method} ${route}`] !== undefined) {
      logger.log(`${method} ${route} has already been defined`, 'warn', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      this._checkApiIsReady()
      return
    }

    // Check if an API with this name has already been defined
    if (this._apiList[this._currentApiName].routes[`${method} ${route}`] !== undefined) {
      logger.log(`${method} ${route} has already been defined`, 'warn', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return
    }

    this._nbRouteDeclared += 1

    // Register route with schema
    this._apiList[this._currentApiName].routes[`${method} ${route}`] = schemaName

    // Find schema
    let realSchema = this._apiList[this._currentApiName].schemas[schemaName]
    let middlewareList = realSchema.middleware || []

    // Loop on schema keys and check if an addon has been used
    this._initAllAddons(Object.keys(realSchema), 0, route, realSchema, (err) => {
      if (err) {
        logger.log(err.toString(), 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
        return
      }

      // Make addon function and call it as a middleware
      // The goal is to call addons before user defined middleware
      const _addonFunction = (req, res, next) => {
        let schema = this._apiList[req.hearthjs.apiName].schemas[req.hearthjs.schemaName]
        this._execAddons(Object.keys(schema), 0, req, res, schema, (err) => {
          if (err) {
            return next(err)
          }

          return next()
        })
      }

      // Create a middleware to get apiName and schemaName for all routes
      let _fnString = 'req.hearthjs = { apiName: "' + this._currentApiName + '", schemaName: "' + schemaName + '" }; next();'
      // eslint-disable-next-line no-new-func
      let func = new Function('req', 'res', 'next', _fnString)

      if (realSchema.function === undefined) {
        server._app[method.toLowerCase()](route, func, _addonFunction, middlewareList, (req, res) => {
          let apiName = req.hearthjs.apiName
          let schemaName = req.hearthjs.schemaName
          this._execRoute(req, res, this._apiList[apiName].schemas[schemaName])
        })
      } else {
        server._app[method.toLowerCase()](route, func, _addonFunction, middlewareList, realSchema.function)
      }

      this._nbRouteServed += 1
      this._checkApiIsReady()
    })
  },

  /**
   * Loop on all schema keys and init addons
   * @param {Array} keys List of schema key
   * @param {Integer} index Keys index
   * @param {String} route Route associated with the schema
   * @param {Object} schema Schema with keys and values
   * @param {Function} callback
   */
  _initAllAddons: function (keys, index, route, schema, callback) {
    if (index >= keys.length) {
      return callback(null)
    }

    let key = keys[index]
    let addonIndex = server._addons.findIndex(elem => elem.schemaKeyName === key)

    if (addonIndex !== -1) {
      addon.initSchemaAddon(server._addons[addonIndex], schema[key], database, route, schema, (err) => {
        if (err) {
          return callback(new Error(`Error while initializing schema for addon ${server._addons[addonIndex].schemaKeyName}: ${err.toString()}`))
        }

        return callback(null)
      })
    } else {
      return callback(null)
    }
  },

  /**
   * Check if all routes declared has been served and update server
   */
  _checkApiIsReady: function () {
    if (this._nbRouteDeclared === this._nbRouteServed) {
      server._setApiReady(true)
    }
  },

  /**
   * Execute the schema of the route
   * @param {Object} req Req from request
   * @param {Object} res Res from request
   * @param {Object} schema Details route
   */
  _execRoute: function (req, res, schema) {
    // TODO: remove this if
    if (typeof schema === 'function') {
      schema(req, res)
    } else {
      // If schema in is defined, check all fields are valid
      if (schema.in !== undefined) {
        let result = validation.checkObject(schema.in, req.body)

        // Return error if there is
        if (result.valid === false) {
          return res.json(this.createResponse(false, {}, result.message))
        }

        this._execBefore(req, res, schema)
      } else {
        this._execBefore(req, res, schema)
      }
    }
  },

  /**
   * Check all keys in schema and exec addons
   * @param {Array} keyArray Array of schema keys
   * @param {Integer} index keyArray index
   * @param {Object} req Req from request
   * @param {Object} res Res from request
   * @param {Object} schema Schema used
   * @param {Function} callback
   */
  _execAddons: function (keyArray, index, req, res, schema, callback) {
    if (index >= keyArray.length) {
      return callback(null)
    }

    let key = keyArray[index]
    let addonIndex = server._addons.findIndex(elem => elem.schemaKeyName === key)

    if (addonIndex !== -1) {
      // Exec addonc exec function
      addon.execAddon(server._addons[addonIndex], schema[key], database, req.originalUrl, schema, req, res, (err) => {
        if (err) {
          return callback(err)
        }

        return this._execAddons(keyArray, index + 1, req, res, schema, callback)
      })
    } else {
      return this._execAddons(keyArray, index + 1, req, res, schema, callback)
    }
  },

  _execBefore: function (req, res, schema) {
    // Execute before
    this._mayExec(req, res, schema.before, 'before', (err) => {
      if (err) {
        return res.json(this.createResponse(false, {}, err.toString()))
      }

      if (schema.query !== undefined) {
        // Execute user query
        let model = (schema.out === undefined) ? null : schema.out

        database.exec(schema.query, req.body, model, (err, result, formatted) => {
          if (err) {
            return res.json(this.createResponse(false, {}, err.toString()))
          }

          // Execute after
          this._execAfter(req, res, formatted, schema)
        })
      } else {
        // No query wanted, execute after
        this._execAfter(req, res, {}, schema)
      }
    })
  },

  /**
   * Execute route after function
   * @param {Object} req req from Request
   * @param {Object} res res from Request
   * @param {Object} data Data return by SQL query
   * @param {Object} schema Route schema
   */
  _execAfter: function (req, res, data, schema) {
    this._mayExec(req, res, schema.after, 'after', data, (err, newData) => {
      if (err) {
        return res.json(this.createResponse(false, {}, err.toString()))
      }
      data = (newData !== undefined) ? newData : data
      return res.json(this.createResponse(true, data, (schema.successMsg === undefined) ? '' : schema.successMsg))
    })
  },

  /**
   * Check the wanted function exists and execute it
   * @param {Object} req req from request
   * @param {Object} res res from request
   * @param {Function} func Function to execute if exists
   * @param {String} type before/after
   * @param {Object} data Object to pass if exists
   * @param {Function} callback
   */
  _mayExec: function (req, res, func, type, data, callback) {
    // Init var if there is no data
    if (typeof data === 'function') {
      callback = data
      data = {}
    }

    if (func === undefined) {
      return callback()
    }
    // Call function
    if (type === 'before') {
      func(req, res, callback)
    } else {
      func(req, res, data, callback)
    }
  },

  /**
   * Create a response object
   * @param {Boolean} success Request result
   * @param {Object} data Data to return
   * @param {String} message Message to send
   */
  createResponse: function (success, data, message) {
    return {
      success: success,
      data: data,
      message: message
    }
  },

  /**
   * Return the schema key of routeStorage if the route has been find
   * @param {Object} routeStorage Reference with all registered routes
   * @param {String} method Route method
   * @param {String} route Route
   */
  matchRoute: function (routeList, method, route) {
    let find = false
    let nbPartMatch = 0
    let bestMatch = null
    let bestPartMatch = 0

    // Loop on routes
    for (let j = 0; j < routeList.length; j++) {
      let splitted = routeList[j].split(' ')

      find = true
      nbPartMatch = 0

      if (splitted[0] === method) {
        let refRoute = splitted[1].split('?')[0]
        let splittedRefRoute = refRoute.split('/')
        let splittedRoute = route.split('/')

        if (splittedRefRoute.length === splittedRoute.length) {
          for (let k = 0; k < splittedRoute.length; k++) {
            if (splittedRefRoute[k] === splittedRoute[k]) {
              nbPartMatch += 1
            }

            if (splittedRefRoute[k] !== '#' && splittedRefRoute[k] !== splittedRoute[k]) {
              find = false
            }
          }
        } else {
          find = false
        }
      } else {
        find = false
      }

      if (find && nbPartMatch > bestPartMatch) {
        bestMatch = routeList[j]
        bestPartMatch = nbPartMatch
      }
    }

    if (bestMatch === null) {
      logger.log(`No match found for ${method} ${route}`, 'error', { mustLog: process.env.IS_LEADER_THREAD !== undefined || cluster.isMaster, logDate: false })
      return null
    }
    return bestMatch
  }
}

module.exports = api
