const request = require('request')
const server = require('./server')

class TestClient {
  constructor (email, password) {
    this.email = email
    this.password = password
    this._cookie = null
    this._loginRoute = '/login'
    this._logoutRoute = '/logout'
  }

  get cookie () {
    return this._cookie
  }

  set cookie (cookie) {
    this._cookie = cookie
  }

  get loginRoute () {
    return this._loginRoute
  }

  set loginRoute (loginRoute) {
    this._loginRoute = loginRoute
  }

  get logoutRoute () {
    return this._logoutRoute
  }

  set logoutRoute (logoutRoute) {
    this._logoutRoute = logoutRoute
  }

  get (route, callback) {
    request.get({
      url: this.getCompleteUrl(route),
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      this._parseBody(response, body, callback)
    })
  }

  post (route, jsonData, callback) {
    request.post({
      url: this.getCompleteUrl(route),
      form: jsonData,
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      this._parseBody(response, body, callback)
    })
  }

  put (route, jsonData, callback) {
    request.put({
      url: this.getCompleteUrl(route),
      form: jsonData,
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      this._parseBody(response, body, callback)
    })
  }

  del (route, callback) {
    request.del({
      url: this.getCompleteUrl(route),
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      this._parseBody(response, body, callback)
    })
  }

  login (route, callback) {
    if (callback === undefined) {
      callback = route
      route = this._loginRoute
    }

    // Execute login request
    request.post({
      url: this.getCompleteUrl(route),
      form: {
        email: this.email,
        password: this.password
      }
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      if (body.success === false) {
        return callback(new Error(body.message))
      }

      // Check if cookie exists
      if (response.headers['set-cookie'] === undefined) {
        return callback(new Error('No cookies were found'))
      }

      this.cookie = response.headers['set-cookie'][0]
      this._parseBody(response, body, callback)
    })
  }

  logout (route, callback) {
    if (callback === undefined) {
      callback = route
      route = this._logoutRoute
    }

    // Execute logout request
    request.get({
      url: this.getCompleteUrl(route),
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      this.cookie = null
      this._parseBody(response, body, callback)
    })
  }

  _parseBody (response, body, callback) {
    try {
      body = JSON.parse(body)
      return callback(null, response, body)
    } catch (e) {
      return callback(null, response)
    }
  }

  getCompleteUrl (endRoute) {
    return `http://localhost:${server.config.APP_SERVER_PORT}${endRoute}`
  }

  getHeaders () {
    return {
      Cookie: this._cookie
    }
  }
}

module.exports = TestClient
