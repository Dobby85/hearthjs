const converter = require('./converter')
const helper = require('./helper')

const validation = {
  /**
   * Check all elements in schema are valid. Return error if necessary.
   * @param {Array} schemaIn Schema in
   * @param {Object} data Data to check
   */
  checkObject: function (schemaIn, data) {
    try {
      let result = this._validateObject(schemaIn, data, false)

      // If result.valid is false, remove newData key
      if (result.valid === false) {
        delete result.newData
      }
      return result
    } catch (e) {
      return {
        valid: false,
        message: e.toString()
      }
    }
  },

  /**
   * Loop on schema and check if all eleements are valid
   * @param {Array} schemaIn Schema in
   * @param {Object} data Data to check
   * @param {Boolean} isArray Is current element in data is an array?
   */
  _validateObject: function (schemaIn, data, isArray) {
    let newData = data
    let result = {
      valid: true
    }

    if (isArray) {
      for (let i = 0; i < data.length; i++) {
        result = this._checkColumnName(schemaIn, data[i])
        newData[i] = result.newData

        if (result.valid === false) {
          return result
        }
      }
    } else {
      result = this._checkColumnName(schemaIn, data)
      newData = result.newData
    }
    result.newData = newData
    return result
  },

  /**
   * Parse schema and check if value are valid
   * @param {Array} schemaIn In schema
   * @param {Object} data Data to check
   */
  _checkColumnName: function (schemaIn, data) {
    let newData = data
    let result = {
      valid: true
    }
    let columnName = converter._getColumnInfo(schemaIn, true)

    if (columnName === 'TYPE_OBJECT') {
      // Check how object was written
      if (helper.isObject(schemaIn)) {
        // Was written like {}, set columnName to null to parse all key
        columnName = null
      } else {
        return this._validateObject(schemaIn[1], data, false) // Was written like ['object', {}]
      }
    } else if (columnName === 'TYPE_ARRAY') {
      let nbToSlice = (helper.isObject(schemaIn[0])) ? 1 : 2
      result = this._validateField(schemaIn.slice(nbToSlice), data, 'root')

      if (result.valid === false) {
        return result
      }

      // Check how object was written [{}] => [0] / ['array', {}] => [1]
      let schemaToUse = (helper.isObject(schemaIn[0])) ? schemaIn[0] : schemaIn[1]
      return this._validateObject(schemaToUse, data, true)
    }

    // schemaIn is an object like {}
    if (columnName === null) {
      for (let key in schemaIn) {
        let type = converter._getColumnInfo(schemaIn[key], true)
        let hasDefaultValue = this._hasDefaultValue(schemaIn[key])

        if (data[key] === undefined && hasDefaultValue.has === true) {
          data[key] = hasDefaultValue.value
          continue
        }

        // Check key exists in data if it has not default value
        if ((type === 'TYPE_KEY' && data[key] === undefined) || (type !== 'TYPE_KEY' && data[key] === undefined)) {
          throw new Error(`Missing key ${key} in data`)
        }

        if (type === 'TYPE_OBJECT') {
          // Check how object was written
          if (helper.isObject(schemaIn)) {
            result = this._validateObject(schemaIn[key], data[key], false) // Was written like {}
          } else {
            result = this._validateObject(schemaIn[key][1], data[key], false) // Was written like ['object', {}]
          }
          newData[key] = result.newData
        } else if (type === 'TYPE_ARRAY') {
          let nbToSlice = (helper.isObject(schemaIn[key][0])) ? 1 : 2
          result = this._validateField(schemaIn[key].slice(nbToSlice), data[key], key)

          if (result.valid === false) {
            return result
          }

          // Check how object was written [{}] => [0] / ['array', {}] => [1]
          let schemaToUse = (helper.isObject(schemaIn[key][0])) ? schemaIn[key][0] : schemaIn[key][1]
          result = this._validateObject(schemaToUse, data[key], true)
          newData[key] = result.newData
        } else if (type === null || type === 'TYPE_KEY') {
          // Validate value
          if (schemaIn[key].length > 0) {
            result = this._validateField(schemaIn[key], data[key], key)
          }
        }

        // If valid is false, return the error
        if (result.valid === false) {
          return result
        }
      }
    }
    result.newData = newData
    return result
  },

  /**
   * Check if a key as a default value
   * @param {Array} rules Key rules
   */
  _hasDefaultValue: function (rules) {
    for (let i = 0; i < rules.length; i++) {
      if (rules[i] === 'default' && rules[i + 1] !== undefined) {
        return {
          has: true,
          value: rules[i + 1]
        }
      }
    }
    return {
      has: false
    }
  },

  /**
   * Apply rules on data and return error message if necessary
   * @param {Array} rules List of rules to apply
   * @param {Object} data Data to check
   * @param {String} key Current object key
   */
  _validateField: function (rules, data, key) {
    if (rules.length % 2 !== 0) {
      throw new Error(`Missing filter for ${key}`)
    }

    const comparaisonRule = [{
      operator: '<',
      errMessage: `must be <`,
      func: (val1, val2) => {
        return val1 < val2
      }
    }, {
      operator: '>',
      errMessage: `must be >`,
      func: (val1, val2) => {
        return val1 > val2
      }
    }, {
      operator: '<=',
      errMessage: `must be <=`,
      func: (val1, val2) => {
        return val1 <= val2
      }
    }, {
      operator: '>=',
      errMessage: `must be >=`,
      func: (val1, val2) => {
        return val1 >= val2
      }
    }, {
      operator: '==',
      errMessage: `must be equals to`,
      func: (val1, val2) => {
        return val1 === val2
      }
    }]

    const typeRegex = [{
      type: 'mail',
      regex: '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-.]+\\.[a-zA-Z0-9-.]{2,20}$',
      errMessage: 'is an invalid mail.'
    }, {
      type: 'phone',
      regex: '^(\\d{2}(\\.| |)){4}\\d{2}$',
      errMessage: 'is an invalid phone number.'
    }, {
      type: 'idAddress',
      regex: '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      errMessage: 'is an invalid IP address.'
    }, {
      type: 'url',
      regex: '^(?:(?:https?|ftp):\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!10(?:\\.\\d{1,3}){3})(?!127(?:\\.\\d{1,3}){3})(?!169\\.254(?:\\.\\d{1,3}){2})(?!192\\.168(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\\.(?:[a-z\u00a1-\uffff]{2,})))(?::\\d{2,5})?(?:\\/[^\\s]*)?$',
      errMessage: 'is an invalid url.'
    }]

    for (let i = 0; i < rules.length; i += 2) {
      let comparaisonIndex = comparaisonRule.findIndex((element) => {
        return element.operator === rules[i]
      })

      if (comparaisonIndex !== -1) {
        let length = (!isNaN(data)) ? data : data.length

        if (comparaisonRule[comparaisonIndex].func(length, rules[i + 1]) === false) {
          return {
            valid: false,
            message: this._getErrorMessage(rules, rules[i], `${key} ${comparaisonRule[comparaisonIndex].errMessage} ${rules[i + 1]}`)
          }
        }
      } else if (rules[i] === 'regex') {
        let regex = RegExp(rules[i + 1])

        if (regex.test(data) === false) {
          return {
            valid: false,
            message: this._getErrorMessage(rules, rules[i], `${key} does not match regex ${rules[i + 1]}`)
          }
        }
      } else if (rules[i] === 'type') {
        if (rules[i + 1] === 'date') {
          let _userDate = new Date(data)

          if (_userDate instanceof Date === false || isNaN(_userDate)) {
            return {
              valid: false,
              message: this._getErrorMessage(rules, rules[i], `${key} is invalid. Check your date exists and respects the following format mm/dd/yyyy.`)
            }
          }
        } else {
          let typeRegexIndex = typeRegex.findIndex((element) => {
            return element.type === rules[i + 1]
          })

          if (typeRegexIndex !== -1) {
            let regex = RegExp(typeRegex[typeRegexIndex].regex)

            if (regex.test(data) === false) {
              return {
                valid: false,
                message: this._getErrorMessage(rules, rules[i], `${key} ${data} ${typeRegex[typeRegexIndex].errMessage}`)
              }
            }
          } else {
            return {
              valid: false,
              message: `Unknow type ${rules[i + 1]} for key ${key}`
            }
          }
        }
      } else if (rules[i] === 'function') {
        let result = rules[i + 1](data)

        if (result === undefined) {
          return {
            valid: false,
            message: `You must return a correct value in your function for key ${key}`
          }
        }
        if (result.valid !== undefined && result.valid === false) {
          let msg = (result.message !== undefined) ? result.message : `${key} is invalid`
          return {
            valid: false,
            message: this._getErrorMessage(rules, rules[i], msg)
          }
        }
      } else if (rules[i] === 'startsWith') {
        if (data.startsWith(rules[i + 1]) === false) {
          return {
            valid: false,
            message: this._getErrorMessage(rules, rules[i], `${key} must start with ${rules[i + 1]}`)
          }
        }
      } else if (rules[i] === 'endsWith') {
        if (data.endsWith(rules[i + 1]) === false) {
          return {
            valid: false,
            message: this._getErrorMessage(rules, rules[i], `${key} must end with ${rules[i + 1]}`)
          }
        }
      } else if ((rules[i].startsWith('error') === false || rules[i].endsWith('Message') === false) && rules[i] !== 'default') {
        // Filter is unknown
        return {
          valid: false,
          message: `Unknow filter ${rules[i]}`
        }
      }
    }
    return {
      valid: true
    }
  },

  /**
   * Return specific error message if exists
   * @param {Array} rules Rules to applied
   * @param {String} keyRule Key rule
   * @param {String} defaultMessage Default message
   */
  _getErrorMessage: function (rules, keyRule, defaultMessage) {
    if (rules.indexOf(`error${keyRule}Message`) !== -1) {
      return rules[rules.indexOf(`error${keyRule}Message`) + 1]
    } else if (rules.indexOf('errorMessage') !== -1) {
      return rules[rules.indexOf('errorMessage') + 1]
    } else {
      return defaultMessage
    }
  }
}

module.exports = validation
