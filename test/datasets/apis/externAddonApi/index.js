const path = require('path')
const addonMail = require('../../addons/validateMailAddon')

let apiPath = path.join(__dirname, 'externApi.js')

module.exports = {
  apis: [apiPath],

  prefix: '',
  addons: [{
    addon: addonMail,
    schemaKeyName: 'checkMail'
  }],

  getName: function (apiName) {
    return this.prefix + '-' + apiName
  }
}
