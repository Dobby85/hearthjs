const helper = require('./helper')

const converter = {

  sqlToJson: function (model, data) {
    let current = (this._getColumnInfo(model, false) === 'TYPE_ARRAY') ? [] : {}
    let currentType = (this._getColumnInfo(model, false) === 'TYPE_ARRAY') ? 'TYPE_ARRAY' : 'TYPE_OBJECT'

    const result = this.parseModel(model, {}, [])
    const dataKeys = (data.length > 0) ? Object.keys(data[0]) : {}
    const parsedModel = result.info
    const primaryKeys = result.primaryKeys
    const complexPrimaryKeys = result.complexPrimaryKeys

    for (let i = 0; i < data.length; i++) {
      let level = 'root'

      const ids = this.getListOfNewId(data[i], complexPrimaryKeys, parsedModel, current)

      let objToUpdate = this.buildMissingItemWithIds(data[i], ids, parsedModel)

      // Loop on data keys
      for (let j = 0; j < dataKeys.length; j++) {
        let currentKey = dataKeys[j]

        if (parsedModel[currentKey] === undefined) {
          continue
        }

        const elemIsNew = ids.findIndex(item => item === currentKey) !== -1
        let startLevel = (currentKey === undefined) ? null : parsedModel[currentKey].parents[parsedModel[currentKey].parents.length - 1]

        if (elemIsNew) {
          this.setDeepProperty(objToUpdate, parsedModel[dataKeys[j]].path, data[i][dataKeys[j]], startLevel)
        } else {
          this.setDeepProperty(objToUpdate, parsedModel[dataKeys[j]].path, data[i][dataKeys[j]])
        }
      }

      if (currentType === 'TYPE_OBJECT' && i === 0) {
        current = objToUpdate
      } else {
        if (currentType === 'TYPE_OBJECT') {
          this.deepMergeObject(current, objToUpdate)
        }

        // If we have multiple ids, we are in an array
        for (let j = 0; j < ids.length; j++) {
          let currentArray = current
          let currentObjToUpdate = objToUpdate
          let nextIndex = -1
          let depthToGo = 0

          for (let k = 0; k < parsedModel[ids[j]].parents.length; k++) {
            if (nextIndex !== -1) {
              currentArray = currentArray[nextIndex]
              nextIndex = -1
            }

            if (parsedModel[ids[j]].parents[k + 1] === undefined) {
              // Check if it already exists
              if (parsedModel[ids[j]].parents[k] !== 'root') {
                if (Array.isArray(currentArray)) {
                  const itemPath = parsedModel[ids[j]].path
                  const itemKey = itemPath[itemPath.length - 1]

                  const index = currentArray.findIndex(item => item[itemKey] === currentObjToUpdate[itemKey])

                  if (index !== -1) {
                    currentArray = currentArray[index]
                  }
                }

                currentArray = currentArray[parsedModel[ids[j]].parents[k]]

                if (Array.isArray(currentObjToUpdate[parsedModel[ids[j]].parents[k]])) {
                  currentObjToUpdate = currentObjToUpdate[parsedModel[ids[j]].parents[k]]

                  if (currentObjToUpdate.length === 0) {
                    break
                  }

                  currentObjToUpdate = currentObjToUpdate[0]
                } else {
                  currentObjToUpdate = currentObjToUpdate[parsedModel[ids[j]].parents[k]]
                }
              }

              const itemPath = parsedModel[ids[j]].path
              const itemKey = itemPath[itemPath.length - 1]

              if (Array.isArray(currentArray)) {
                const index = currentArray.findIndex(item => item[itemKey] === currentObjToUpdate[itemKey])

                if (index === -1 &&
                  ((typeof currentObjToUpdate[itemKey] === 'string' && currentObjToUpdate[itemKey].length > 0) ||
                  (typeof currentObjToUpdate[itemKey] !== 'string' && currentObjToUpdate[itemKey] !== null))) {
                  currentArray.push(currentObjToUpdate)
                }
              }
            } else if (Array.isArray(currentArray) || currentArray[parsedModel[ids[j]].parents[k]] !== undefined) {
              depthToGo += 1

              if (currentArray[parsedModel[ids[j]].parents[k]] !== undefined) {

                currentArray = currentArray[parsedModel[ids[j]].parents[k]]
                currentObjToUpdate = currentObjToUpdate[parsedModel[ids[j]].parents[k]]

                if (Array.isArray(currentObjToUpdate)) {
                  currentObjToUpdate = currentObjToUpdate[0]
                  depthToGo += 1
                }
              }

              if (Array.isArray(currentArray)) {
                // We have to find the key object corresponding to the primary key of the level eg: [{ id: ['<<pk>>'], subObj: {} }] -> find id for subObj key
                const pks = complexPrimaryKeys.filter((item) => {
                  if (parsedModel[ids[j]].parents[k] === 'root') {
                    return item.keyPath.length === depthToGo
                  }

                  if (item.keyPath.length === depthToGo) {
                    // Finish at 1 to avoid checking root parent
                    for (let tmpK = k; tmpK >= 1; tmpK--) {
                      if (item.keyPath.includes(parsedModel[ids[j]].parents[tmpK]) === false) {
                        return false
                      }
                    }

                    return true
                  }

                  return false
                })

                if (pks.length === 0) {
                  throw new Error('One primary key could not be found, check your model is well constructed and has `<<` `>>` around its primary keys')
                }

                const itemKey = pks[0].objKey

                const index = currentArray.findIndex(item => item[itemKey] === currentObjToUpdate[itemKey])

                if (index !== -1) {
                  nextIndex = index
                }
              }
            }
          }
        }
      }

    }

    return current
  },

  // Merge two object to remove null values, it write the new result in obj1
  deepMergeObject: function (obj1, obj2) {
    for (let i = 0; i < Object.keys(obj1).length; i++) {
      const key = Object.keys(obj1)[i]

      if (obj1[key] === null && obj2[key] !== null) {
        obj1[key] = obj2[key]
      } else if (obj1[key] !== null && obj1[key] !== undefined && typeof obj1[key] === 'object' && Array.isArray(obj1[key]) === false && obj2[key] !== undefined) {
        this.deepMergeObject(obj1[key], obj2[key])
      }
    }
  },

  buildMissingItemWithIds (dataLine, missingIds, parsedModel) {
    if (missingIds.length === 0) {
      return {}
    }

    let obj = {}

    for (let i = 0; i < missingIds.length; i++) {
      if (dataLine[missingIds[i]] !== null) {
        this.setDeepProperty(obj, parsedModel[missingIds[i]].path, dataLine[missingIds[i]], null, true)
      }
    }

    return obj
  },

  getListOfNewId (dataLine, complexPrimaryKeys, parsedModel, current) {
    const ids = []

    for (let j = 0; j < complexPrimaryKeys.length; j++) {
      let tmpCurrent = current
      let depthToGo = 0

      if (dataLine[complexPrimaryKeys[j].sqlKey] === undefined) {
        continue
      }

      for (let k = 0; k < parsedModel[complexPrimaryKeys[j].sqlKey].path.length; k++) {
        if (parsedModel[complexPrimaryKeys[j].sqlKey].path[k - 1] === 0) {
          continue
        }

        if (parsedModel[complexPrimaryKeys[j].sqlKey].path[k] === 0 && Array.isArray(tmpCurrent)) {
          depthToGo += 1

          const pathIndex = complexPrimaryKeys.findIndex((item) => {
            if (k === 0) {
              return item.keyPath.length === depthToGo
            }

            if (item.keyPath.length === depthToGo) {
              for (let tmpK = k - 1; tmpK >= 0; tmpK--) {
                if (item.keyPath.includes(parsedModel[complexPrimaryKeys[j].sqlKey].path[tmpK]) === false) {
                  return false
                }
              }

              return true
            }

            return false
          })

          if (complexPrimaryKeys[pathIndex] === undefined) {
            throw new Error('One primary key could not be found, check your model is well constructed and has `<<` `>>` around its primary keys')
          }

          const itemKey = complexPrimaryKeys[pathIndex].objKey
          const index = tmpCurrent.findIndex(item => item[complexPrimaryKeys[pathIndex].objKey] === dataLine[complexPrimaryKeys[pathIndex].sqlKey])

          if (index === -1) {
            // Check to not push null id and check we are well on the last id of the row to not push useless ids
            if (dataLine[complexPrimaryKeys[pathIndex].sqlKey] !== null && dataLine[complexPrimaryKeys[j].sqlKey] !== null) {
              ids.push(complexPrimaryKeys[j].sqlKey)
            }
            break
          } else {
            tmpCurrent = tmpCurrent[index][parsedModel[complexPrimaryKeys[j].sqlKey].path[k + 1]]
            depthToGo += 1
          }
        } else if (tmpCurrent[parsedModel[complexPrimaryKeys[j].sqlKey].path[k]] !== undefined) {
          tmpCurrent = tmpCurrent[parsedModel[complexPrimaryKeys[j].sqlKey].path[k]]
          depthToGo += 1
        } else {
          if (dataLine[complexPrimaryKeys[j].sqlKey] !== null) {
            ids.push(complexPrimaryKeys[j].sqlKey)
          }
          break
        }
      }
    }

    return ids
  },

  setDeepProperty: function (obj, path, value, startLevel = null, isPK = false) {
    startLevel = (startLevel === 'root') ? null : startLevel
    var curr = obj;
    let startDepth = 0

    if (startLevel !== null) {
      const index = path.findIndex(item => item === startLevel)

      if (index !== -1) {
        startDepth = index + 1
      }

      let allExists = true

      for (let i = 0; i < startDepth; i++) {
        if (path[i] === 0) {
          continue
        }

        if (helper.isArray(curr) && curr[0] !== undefined && curr[0][path[i]] !== undefined) {
          curr = curr[0][path[i]]
        } else if (curr[path[i]] !== undefined) {
          curr = curr[path[i]]
        } else {
          allExists = false
        }

        if (path[i + 1] === 0 && curr[0] !== undefined) {
          curr = curr[0]
        }
      }

      if (allExists === false) {
        startDepth = 0
        curr = obj
      }
    }

    for (let depth = startDepth; depth < path.length - 1; depth++) {
      if (path[depth] === 0) {
        continue
      }

      if (Array.isArray(curr) || (Array.isArray(curr) === false && curr[path[depth]] === undefined)) {
        if (path[depth + 1] === 0) {
          if (helper.isArray(curr) && curr.length === 0) {
            if (isPK === true) {
              let toPush = {}

              toPush[path[depth]] = []
              curr.push(toPush)
              curr = curr[0][path[depth]]
            }
          } else if (helper.isArray(curr) && curr.length > 0) {
            if (curr[0][path[depth]] !== undefined) {
              curr = curr[0][path[depth]]
            } else {
              curr[0][path[depth]] = []
              curr = curr[0][path[depth]]
            }
          } else {
            curr[path[depth]] = []
            curr = curr[path[depth]]
          }
        } else if (Array.isArray(curr) === false) {
          curr[path[depth]] = {}
          curr = curr[path[depth]]
        } else {
          // The current depth is an object that we have to push in an array
          if (isPK === true) {
            let toPush = {}

            toPush[path[depth]] = {}
            curr.push(toPush)
            curr = curr[0][path[depth]]
          }
        }
      } else {
        curr = curr[path[depth]]

        if (path[depth + 1] === 0 && curr[0] !== undefined) {
          curr = curr[0]
        }
      }
    }

    if ((isPK === true && value !== null) || isPK === false) {
      if (helper.isArray(curr) && curr[0] === undefined && isPK === false) {
        // Only a primary key can create an object in an array
        return
      }

      if (helper.isArray(curr) && curr[0] === undefined) {
        let toPush = {}

        toPush[path[path.length - 1]] = value
        curr.push(toPush)
      } else if (helper.isArray(curr) && curr[0] !== undefined) {
        if (curr[0][path[path.length - 1]] == null) {
          curr[0][path[path.length - 1]] = value
        }
      } else {
        if (curr[path[path.length - 1]] == null) {
          curr[path[path.length - 1]] = value;
        }
      }
    }
  },

  parseModel: function (model, info, currentPath, primaryKeys = [], parents = ['root'], complexPrimaryKeys = [], previousColumnInfo = null) {
    let skeleton = null
    let columnInfo = this._getColumnInfo(model, false)

    if (columnInfo === 'TYPE_ARRAY') {
      skeleton = []
      let objectArray = (helper.isObject(model[0])) ? model[0] : model[1]
      const savePath = JSON.parse(JSON.stringify(currentPath))
      const saveParents = JSON.parse(JSON.stringify(parents))

      currentPath.push(0)

      const result = this.parseModel(objectArray, info, currentPath, primaryKeys, parents, complexPrimaryKeys, columnInfo)

      skeleton.push(result.skeleton)
      currentPath = savePath
      parents = saveParents
    } else if (columnInfo === 'TYPE_OBJECT') {
      skeleton = {}

      if (helper.isObject(model) === false) {
        model = model[1]
      }

      for (var k = 0; k < Object.keys(model).length; k++) {
        let objKey = Object.keys(model)[k]
        let columnInfo = this._getColumnInfo(model[objKey], false)
        let typeKey = this._getColumnInfo(model[objKey], true)

        if (columnInfo !== 'TYPE_ARRAY' && columnInfo !== 'TYPE_OBJECT') {
          const parent = (currentPath.length <= 1) ? 'root' : currentPath[currentPath.length - 2]

          if (typeKey === 'TYPE_PRIMARY_KEY' && previousColumnInfo === 'TYPE_ARRAY') {
            primaryKeys.push(columnInfo)
            complexPrimaryKeys.push({
              keyPath: JSON.parse(JSON.stringify(currentPath)),
              sqlKey: columnInfo,
              objKey
            })
          }

          info[columnInfo] = {
            isPrimaryKey: (typeKey === 'TYPE_PRIMARY_KEY' && previousColumnInfo === 'TYPE_ARRAY') ? true : false,
            parents: JSON.parse(JSON.stringify(parents)),
            path: currentPath.concat([objKey])
          }
          skeleton[objKey] = null
        } else if (columnInfo !== null) {
          const savePath = JSON.parse(JSON.stringify(currentPath))
          const saveParents = JSON.parse(JSON.stringify(parents))

          currentPath.push(objKey)
          parents.push(objKey)

          const result = this.parseModel(model[objKey], info, currentPath, primaryKeys, parents, complexPrimaryKeys, columnInfo)

          skeleton[objKey] = result.skeleton
          currentPath = savePath
          parents = saveParents
        }
      }
    }

    return { primaryKeys, complexPrimaryKeys, info, skeleton, parents }
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
      // console.log('COLUMN TYPE', model)
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
   * Return the name of the column
   * @param {Array} value Variable to parse
   */
  _getColumnInfo: function (value, wantType) {
    if ((value.length >= 2 && value[0] === 'object') || helper.isObject(value)) {
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
