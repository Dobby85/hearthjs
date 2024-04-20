const path = require('path')
const fs = require('fs')

module.exports = {
  /**
   * Init a config object from process.env if no file conf have been found
   * @param {String} env dev or prod
   * @param {Object} options Parameters that have been sent from CLI
   * @param {String} serverPath Server path
   * @param {Object} defaultConfig Config to set by default
   * @param {Function} callback
   */
  initConfigObject: function (env, options, serverPath, defaultConfig, callback) {
    let config = {}
    const configPath = path.join(serverPath, 'config', env + '.json')
    const cliKeys = [{ confName: 'APP_NB_CLUSTER', cliName: 'cluster', type: 'integer' },
      { confName: 'APP_SERVER_PORT', cliName: 'port', type: 'integer' },
      { confName: 'APP_DATABASE_USERNAME', cliName: 'db_username', type: 'string' },
      { confName: 'APP_DATABASE_HOST', cliName: 'db_host', type: 'string' },
      { confName: 'APP_DATABASE_NAME', cliName: 'db_name', type: 'string' },
      { confName: 'APP_DATABASE_PASSWORD', cliName: 'db_password', type: 'string' },
      { confName: 'APP_DATABASE_PORT', cliName: 'db_port', type: 'integer' },
      { confName: 'APP_SERVER_LANG', cliName: 'lang', type: 'string' }]

    fs.access(configPath, fs.F_OK, (err) => {
      if (err) {
        config = JSON.parse(JSON.stringify(defaultConfig))
        config = Object.assign(config, process.env)
        config = this._parseConfigObjectValues(config)

        return callback(null, config)
      } else {
        fs.readFile(configPath, 'utf-8', (err, data) => {
          if (err) {
            return callback(err)
          }

          try {
            config = JSON.parse(JSON.stringify(defaultConfig))
            config = Object.assign(config, process.env)
            config = Object.assign(config, JSON.parse(data))

            // Override keys sent via cli in conf
            for (let i = 0; i < cliKeys.length; i++) {
              if (options[cliKeys[i].cliName] !== undefined) {
                if (cliKeys[i].type === 'integer') {
                  config[cliKeys[i].confName] = parseInt(options[cliKeys[i].cliName])
                } else {
                  config[cliKeys[i].confName] = options[cliKeys[i].cliName]
                }
              }
            }

            return callback(null, config)
          } catch (e) {
            return callback(e)
          }
        })
      }
    })
  },

  /**
   * Check every keys in config and convert numbers and boolean if it can be converted
   * @param {Object} config Config object to parse
   * @returns Parsed config object
   */
  _parseConfigObjectValues: function (config) {
    const numberRegex = /^[0-9]+$/gm

    for (let i = 0; i < Object.keys(config).length; i++) {
      const key = Object.keys(config)[i]
      const checkNumber = numberRegex.exec(config[key])

      if (checkNumber !== null) {
        config[key] = parseInt(config[key], 10)
      } else if (config[key].toLowerCase() === 'true') {
        config[key] = true
      } else if (config[key].toLowerCase() === 'false') {
        config[key] = false
      }
    }

    return config
  }
}
