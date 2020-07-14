const helper = require('./helper')

const converter = {
  /**
   * Convert postgres rows in JSON object
   * @param {Object} model User model
   * @param {Object} data Rows returned by postgreSQL
   */
  sqlToJson: function (model, data) {
    let current = null

    if (data.length === 0) {
      let columnName = this._getColumnInfo(model, false)
      if (columnName === 'TYPE_OBJECT') {
        return {}
      } else if (columnName === 'TYPE_ARRAY') {
        return []
      } else {
        return null
      }
    }

    // Parse each line of data and send it to fill current
    for (var i = 0; i < data.length; i++) {
      let obj = data[i]

      current = this._fillCurrent(model, current, obj)
    }
    return current
  },

  /**
   * Return model primary keys
   * @param {Array} model Schema model
   */
  getModelPrimaryKeys: function (model) {
    let finalList = []
    let columnType = this._getColumnInfo(model, false)

    if (columnType === 'TYPE_OBJECT') {
      // Check how object was written
      if (helper.isObject(model)) {
        // Was written like {}, set columnName to null to parse all key
        columnType = null
      } else {
        finalList = finalList.concat(this.getModelPrimaryKeys(model[1]))
        return finalList
      }
    } else if (columnType === 'TYPE_ARRAY') {
      // Check how object was written [{}] => [0] / ['array', {}] => [1]
      let modelToUse = (helper.isObject(model[0])) ? model[0] : model[1]
      finalList = finalList.concat(this.getModelPrimaryKeys(modelToUse))
      return finalList
    }

    if (columnType === null) {
      for (var k = 0; k < Object.keys(model).length; k++) {
        let objKey = Object.keys(model)[k]

        let nextColumnType = this._getColumnInfo(model[objKey], true)

        if (nextColumnType === 'TYPE_OBJECT' || nextColumnType === 'TYPE_ARRAY') {
          finalList = finalList.concat(this.getModelPrimaryKeys(model[objKey]))
        } else if (nextColumnType === 'TYPE_PRIMARY_KEY') {
          finalList.push(model[objKey][0].split('<').join('').split('>').join(''))
        }
      }
    }
    return finalList
  },

  /**
   * Add a postgres line to the current object
   * @param {Object} model User model
   * @param {Object} current Object being created
   * @param {Object} obj One line of data returned by postgreSQL
   */
  _fillCurrent: function (model, current, obj) {
    let columnName = this._getColumnInfo(model, false)

    if (columnName === 'TYPE_OBJECT') {
      // User want an object, create and resend to fill current
      if (current === null) {
        current = {}
      }

      // Check how object was written
      if (helper.isObject(model)) {
        // Was written like {}, set columnName to null to parse all key
        columnName = null
      } else {
        current = this._fillCurrent(model[1], current, obj) // Was written like ['object', {}]
        return current
      }
    } else if (columnName === 'TYPE_ARRAY') {
      if (current === null) {
        current = []
      }

      // Check how object was written [{}] => [0] / ['array', {}] => [1]
      let objectArray = (helper.isObject(model[0])) ? model[0] : model[1]

      // User want an array, check if values are the same to check
      // if we must push a new object in the array or not
      var hasFound = false
      for (var i = 0; i < current.length; i++) {
        var isSame = true
        for (var j = 0; j < Object.keys(current[i]).length; j++) {
          let k = Object.keys(current[i])[j]
          let cn = this._getColumnInfo(objectArray[k], false)

          if (cn !== 'TYPE_OBJECT' && cn !== 'TYPE_ARRAY') {
            if (current[i][k] instanceof Date && obj[cn] instanceof Date) {
              // Two values are Date type, we can't compare them with !==
              if (current[i][k].getTime() !== obj[cn].getTime()) {
                isSame = false
              }
            } else if (helper.isObject(current[i][k]) && helper.isObject(obj[cn])) {
              if (JSON.stringify(current[i][k]) !== JSON.stringify(obj[cn])) {
                isSame = false
              }
            } else if (current[i][k] !== obj[cn]) {
              isSame = false
            }
          }
        }
        if (isSame === true) {
          hasFound = true
          current[i] = this._fillCurrent(objectArray, current[i], obj)
        }
      }

      // No correspondance found, push a new object
      if (hasFound === false) {
        let toPush = this._fillCurrent(objectArray, {}, obj)

        if (!this._areAllFieldEmpty(toPush)) {
          current.push(toPush)
        }
      }
      return current
    }

    // model is an object like {}
    if (columnName === null) {
      // Receive an object => fill value and recall fill current if
      // we found an object or an array
      for (var k = 0; k < Object.keys(model).length; k++) {
        let objKey = Object.keys(model)[k]

        let nextColumnName = this._getColumnInfo(model[objKey], false)

        if (nextColumnName === 'TYPE_OBJECT') {
          current[objKey] = this._fillCurrent(model[objKey], (current[objKey] === undefined) ? {} : current[objKey], obj)
        } else if (nextColumnName === 'TYPE_ARRAY') {
          current[objKey] = this._fillCurrent(model[objKey], (current[objKey] === undefined) ? [] : current[objKey], obj)
        } else {
          if (obj[nextColumnName] !== undefined) {
            if (current[objKey] === undefined) {
              current[objKey] = obj[nextColumnName]
            } else if (current[objKey] === null && obj[nextColumnName] !== null) {
              current[objKey] = obj[nextColumnName]
            }
          }
        }
      }
    }
    return current
  },

  /**
   * Check if an object contains only null value or not
   * @param {Object} obj Object to check
   */
  _areAllFieldEmpty: function (obj) {
    let isNotNull = true

    for (let i = 0; i < Object.keys(obj).length; i++) {
      let key = Object.keys(obj)[i]

      if (helper.isObject(obj[key])) {
        isNotNull = this._areAllFieldEmpty(obj[key])
      } else if ((helper.isArray(obj[key]) && obj[key].length !== 0) ||
        (!helper.isArray(obj[key]) && obj[key] !== null &&
          ((typeof obj[key] === 'string' && obj[key].length > 0) || (obj[key] instanceof Date) || (typeof obj[key] !== 'string' && obj[key] !== null)))) {
        isNotNull = false
      }

      if (!isNotNull) {
        return isNotNull
      }
    }

    return isNotNull
  },

  /**
   * Return the name of the column
   * @param {Array} value Variable to parse
   */
  _getColumnInfo: function (value, wantType) {
    if ((value.length === 2 && value[0] === 'object') || helper.isObject(value)) {
      return 'TYPE_OBJECT'
    } else if ((value.length >= 2 && value[0] === 'array') || (helper.isArray(value) && helper.isObject(value[0]))) {
      return 'TYPE_ARRAY'
    } else if (value[0] === undefined) {
      return null
    } else {
      if (wantType) {
        if (value[0].trim().startsWith('<<') && value[0].trim().endsWith('>>')) {
          return 'TYPE_PRIMARY_KEY'
        } else {
          return 'TYPE_KEY'
        }
      } else {
        return value[0].split('<').join('').split('>').join('')
      }
    }
  }
}

module.exports = converter
