const api = require('./api')
const server = require('./server')
const db = require('./database')
const converter = require('./converter')
const datasets = require('./datasets')
const cron = require('./cron')
const t = require('./translate').t
const logger = require('./logger')
const testClient = require('./testClient')

const hearth = {
  server: server,
  api: api,
  db: db,
  converter: converter,
  datasets: datasets,
  t: t,
  logger: logger,
  cron: cron,
  httpClient: testClient,
  useAddon: function (addon, schemaKeyName) {
    server.useAddon(addon, schemaKeyName)
  },
  useApi: function (api, prefix) {
    server.useApi(api, prefix)
  },

  /**
   * Run the server
   * @param {String} env Environment
   * @param {Function} callback
   */
  run: function (env, serverPath, options, callback) {
    server.run(env, serverPath, options, callback)
  },

  /**
   * Close server and reset everything
   */
  close: function (callback) {
    api._reset()
    server.close(callback)
  }
}
module.exports = hearth
