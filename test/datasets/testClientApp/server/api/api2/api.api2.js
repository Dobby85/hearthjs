const hearth = require('../../../../../../lib/index')

const schemas = {
  getTest: {
    before: (req, res, next) => {
      if (req.cookies.authToken === undefined) {
        return next('You are not login')
      }
      next()
    },
    successMsg: 'Yeah get'
  },

  postTest: {
    before: (req, res, next) => {
      if (req.cookies.authToken === undefined) {
        return next('You are not login')
      }
      return res.json({
        success: true,
        message: 'Yeah post ' + req.body.data
      })
    }
  },

  putTest: {
    before: (req, res, next) => {
      if (req.cookies.authToken === undefined) {
        return next('You are not login')
      }
      return res.json({
        success: true,
        message: 'Yeah put ' + req.body.data
      })
    }
  },

  delTest: {
    before: (req, res, next) => {
      if (req.cookies.authToken === undefined) {
        return next('You are not login')
      }
      next()
    },
    successMsg: 'Yeah del'
  },

  login: {
    before: (req, res, next) => {
      res.cookie('authToken', 'OK', {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
      })
      return res.json({
        success: true,
        message: 'Connected'
      })
    }
  },

  logout: {
    before: (req, res, next) => {
      res.clearCookie('authToken')
      next()
    },
    successMsg: 'Disconnected'
  }
}

hearth.api.define('testClient', schemas, (server) => {
  server.get('/test', 'getTest')
  server.post('/test', 'postTest')
  server.delete('/test', 'delTest')
  server.put('/test', 'putTest')
  server.post('/login', 'login')
  server.get('/logout', 'logout')
})
