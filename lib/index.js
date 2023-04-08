const api = require('./api')
const server = require('./server')
const db = require('./database')
const converter = require('./converter')
const datasets = require('./datasets')
const cron = require('./cron')
const translate = require('./translate')
const logger = require('./logger')
const testClient = require('./testClient')
const express = require('express')
const helper = require('./helper')
const validation = require('./validation')
const mustache = require('./mustache')

const hearth = {
  server: server,
  express: express,
  api: api,
  db: db,
  converter: converter,
  datasets: datasets,
  t: translate.t,
  tr: translate.tr,
  logger: logger,
  cron: cron,
  httpClient: testClient,
  helpers: helper,
  validation: validation,
  mustache: mustache,
  env: server.getEnv(),
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

  getConfig: function (key) {
    return process.env[key] || server.config[key]
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
