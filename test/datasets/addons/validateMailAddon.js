let validateMailAddon = {
  schemaKeyName: 'validateMail',

  exec: function (addonValue, database, route, schema, req, res, next) {
    if (req.body.mail.includes('@') === false) {
      return next('Invalid mail')
    }
    return next()
  }
}

module.exports = validateMailAddon
