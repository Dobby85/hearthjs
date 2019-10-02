const server = {
  init: function (server, callback) {
    server.use((req, res, next) => {
      return res.send('Pass to middleware')
    })
    return callback(null)
  }
}

module.exports = server
