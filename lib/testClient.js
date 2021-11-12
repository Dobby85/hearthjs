const request = require('request')
const server = require('./server')

class TestClient {
  constructor (email, password) {
    this.email = email
    this.password = password
    this._cookie = null
    this._loginRoute = '/login'
    this._logoutRoute = '/logout'
    this._headers = {}
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

  set headers (headers) {
    this._headers = headers
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
      json: jsonData,
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      return callback(null, response, body)
    })
  }

  put (route, jsonData, callback) {
    request.put({
      url: this.getCompleteUrl(route),
      json: jsonData,
      headers: this.getHeaders()
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      return callback(null, response, body)
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

    // Check if user is already logged to not call a useless route
    if (this.cookie !== null) {
      return callback(null)
    }

    // Execute login request
    request.post({
      url: this.getCompleteUrl(route),
      headers: this.getHeaders(),
      json: {
        email: this.email,
        password: this.password
      }
    }, (err, response, body) => {
      if (err) {
        return callback(err)
      }

      if (body.data && body.data.token !== undefined) {
        // Check if token is in body
        this.cookie = body.data.token
        return callback(null, response, body)
      } else if (response.headers['set-cookie'] !== undefined) {
        // Check if cookie exists
        this.cookie = response.headers['set-cookie'][0]
        return callback(null, response, body)
      }

      return callback(new Error('No token were found'))
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
    } catch (e) {
      return callback(null, response)
    }

    return callback(null, response, body)
  }

  getCompleteUrl (endRoute) {
    return `http://localhost:${server.config.APP_SERVER_PORT}${endRoute}`
  }

  getHeaders () {
    let toAssign = {}

    if (this._cookie !== null) {
      toAssign = {
        Cookie: this._cookie,
        Authorization: this._cookie
      }
    }

    return Object.assign(toAssign, this._headers)
  }
}

module.exports = TestClient
