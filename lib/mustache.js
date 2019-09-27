/* eslint-disable no-eval */
const converter = require('./converter')

const endLoop = '{{%}}'
const endCond = '{{#}}'
const openingLoop = '{%'
const closingLoop = '%}'
const openingVar = '{{'
const closingVar = '}}'
const openingConst = '{$'
const openingConstRegex = '{\\$'
const closingConst = '$}'
const closingConstRegex = '\\$}'
const openingCond = '{#'
const closingCond = '#}'
const hardPaste = ':'

const tagList = [endLoop, endCond, openingLoop, closingLoop, openingVar, closingVar, openingConst, closingConst, openingCond, closingCond, hardPaste]
const tagListRegex = [endLoop, endCond, openingLoop, closingLoop, openingVar, closingVar, openingConstRegex, closingConstRegex, openingCond, closingCond, hardPaste]
const extraToken = ['hard']

const mustache = {
  /**
   * Parse a string and return final string and final object
   * @param {String} template String to parse
   * @param {Object} data Data to inject
   * @param {Object} model Model for request
   */
  render: function (template, data, model) {
    let tokens = this.parse(template)

    if (model === undefined) {
      model = null
    }

    let result = this._buildString(tokens, data, 1, [], model)
    let finalObj = {}

    for (var i = 0; i < Object.keys(result).length; i++) {
      let key = Object.keys(result)[i]

      if (key === 'finalString') {
        finalObj.string = result[key]
      } else if (key === 'finalData') {
        finalObj.data = result[key]
      } else if (key !== 'varIndex') {
        finalObj[key] = result[key]
      }
    }

    return finalObj
  },

  /**
   * Build the final string with prepared value
   * @param {Array} tokens List of tokens
   * @param {Object} data Data to inject
   * @param {Integer} varIndex Index to increment for SQL request ($1, $2...)
   * @param {Integer} loopIndexes Index for loop, it start to i (0), j (1)
   * @param {Object} model Model for order by
   */
  _buildString: function (tokens, data, varIndex, loopIndexes, model) {
    let finalString = ''
    let finalData = []
    let stringIndex = this._createIndexes(loopIndexes)
    let finalObj = {}

    for (var j = 0; j < tokens.length; j++) {
      let token = tokens[j]

      if (token[0] === 'text') {
        finalString += token[1]
      } else if (token[0] === 'cond') {
        let condResult
        try {
          condResult = eval(stringIndex + token[1])
        } catch (e) {
          throw new Error(`Error while determining value of ${token[1]}. Error was ${e.toString()}`)
        }

        if (condResult) {
          let obj = this._buildString(token[2], data, varIndex, loopIndexes, model)
          finalString += obj.finalString
          varIndex = obj.varIndex
          finalData = finalData.concat(obj.finalData)
          finalObj = Object.assign(finalObj, obj)
        }
      } else if (token[0] === 'loop') {
        let length
        try {
          length = eval(stringIndex + token[1] + '.length')
          if (length === undefined) {
            throw new Error(`Length of ${token[1]} is undefined`)
          }
        } catch (e) {
          throw new Error(`Error while determining value of ${token[1]}.length. Error was ${e.toString()}`)
        }

        for (let i = 0; i < length; i++) {
          loopIndexes.push(i)
          let obj = this._buildString(token[2], data, varIndex, loopIndexes, model)
          loopIndexes.pop()
          finalString += obj.finalString
          varIndex = obj.varIndex
          finalData = finalData.concat(obj.finalData)
          finalObj = Object.assign(finalObj, obj)
        }
      } else if (token[0] === 'var') {
        if (token.length > 2) {
          // Only one extra at the moment (hard) so want replace value directly
          if (extraToken.indexOf(token[2]) === -1) {
            throw new Error(`Unknown extra token ${token[2]}`)
          }
          try {
            finalString += eval(stringIndex + token[1])
          } catch (e) {
            throw new Error(`Error while determining value of ${token[1]}. Error was ${e.toString()}`)
          }
        } else {
          // Want replace with $1, $2
          finalString += `$${varIndex}`
          try {
            finalData.push(eval(stringIndex + token[1]))
          } catch (e) {
            throw new Error(`Error while determining value of ${token[1]}. Error was ${e.toString()}`)
          }
          varIndex += 1
        }
      } else if (token[0] === 'const') {
        if (token[1] === 'orderby') {
          if (model !== null) {
            let pk = converter.getModelPrimaryKeys(model)
            if (pk.length > 0) {
              finalString += `ORDER BY ` + pk.map(value => `"${value}"`).join(', ')
            }
          }
        } else {
          finalObj[token[1]] = true
        }
      }
    }

    finalObj['finalString'] = finalString
    finalObj['finalData'] = finalData
    finalObj['varIndex'] = varIndex
    return finalObj
  },

  /**
   * Return a script with indexes
   * @param {Array} loopIndexes List of index
   */
  _createIndexes: function (loopIndexes) {
    let _stringIndex = ''

    for (var i = 0; i < loopIndexes.length; i++) {
      _stringIndex += `let ${String.fromCharCode(105 + i)} = ${loopIndexes[i]}; `
    }
    return _stringIndex
  },

  /**
   * Tokenize a string
   * @param {String} template String to tokenize
   */
  parse: function (template) {
    const regex = new RegExp('(' + tagListRegex.join('|') + ')')
    let tokens = template.split(regex)
    tokens = tokens.filter(value => value.length > 0)

    let result = this._buildTokens(tokens, 0, [], null)
    return result
  },

  /**
   * Fill the list of organized tokens
   * @param {Array} tokens Array ok pre-splitted tokens
   * @param {Integer} index Index of array
   * @param {Array} currentList List to fill
   * @param {String} returningTag Returning tag to check
   */
  _buildTokens: function (tokens, index, currentList, returningTag) {
    let nbOpenVar = 0
    let nbConstOpen = 0
    let isVarOpen = false
    let isLoopOpen = false
    let isCondOpen = false
    let isConstOpen = false
    let name = ''
    let extra = []
    let isExtraOpen = false

    for (var i = index; i < tokens.length; i++) {
      if (returningTag !== null) {
        if (tokens[i] === returningTag) {
          // End of loop or cond, returning list
          return {
            index: i,
            list: currentList
          }
        }
      }

      // Check no other token are open when opening new tag
      if ([openingVar, openingLoop, openingCond, openingConst].indexOf(tokens[i]) !== -1) {
        this._checkSyntax(isVarOpen, `unexpected token ${tokens[i]}, looking for ${closingVar} token`)
        this._checkSyntax(isLoopOpen, `unexpected token ${tokens[i]}, looking for ${closingLoop} token`)
        this._checkSyntax(isCondOpen, `unexpected token ${tokens[i]}, looking for ${closingCond} token`)
        this._checkSyntax(isConstOpen, `unexpected token ${tokens[i]}, looking for ${closingConst} token`)
      }

      // Check token
      if (tagList.indexOf(tokens[i]) === -1) {
        if (isExtraOpen) {
          if (tokens[i].trim().length > 0) {
            // Don't push spaces in extra
            extra.push(tokens[i].trim())
          }
        } else if (isVarOpen || isLoopOpen || isCondOpen || isConstOpen) {
          name += tokens[i]
        } else {
          currentList.push(['text', tokens[i]])
        }
      } else if (tokens[i] === openingVar) {
        nbOpenVar += 1
        isVarOpen = true
      } else if (tokens[i] === openingConst) {
        nbConstOpen += 1
        isConstOpen = true
      } else if (tokens[i] === openingLoop) {
        isLoopOpen = true
      } else if (tokens[i] === openingCond) {
        isCondOpen = true
      } else if (tokens[i] === closingVar) {
        // Check syntax error
        this._checkSyntax(isLoopOpen || isCondOpen || isConstOpen, `unexpected ${tokens[i]}`)
        this._checkSyntax(isVarOpen === false, `unexpected ${tokens[i]}`)

        if (isExtraOpen && extra.length === 0) {
          throw new Error(`Expected extra after ${hardPaste} for var ${name}`)
        }

        currentList.push(['var', name.trim()].concat(extra))
        name = ''
        nbOpenVar -= 1
        isVarOpen = false
        isExtraOpen = false
        extra = []
      } else if (tokens[i] === closingConst) {
        // Check syntax error
        this._checkSyntax(isLoopOpen || isCondOpen || isVarOpen, `unexpected ${tokens[i]}`)
        this._checkSyntax(isConstOpen === false, `unexpected ${tokens[i]}`)

        currentList.push(['const', name.split(' ').join('').toLowerCase()])
        name = ''
        nbConstOpen -= 1
        isConstOpen = false
      } else if (tokens[i] === closingLoop) {
        // Check syntax error
        this._checkSyntax(isVarOpen || isCondOpen || isConstOpen, `unexpected ${tokens[i]}`)
        this._checkSyntax(isLoopOpen === false, `unexpected ${tokens[i]}`)
        let obj = this._buildTokens(tokens, i + 1, [], endLoop)

        // Check we found a closing tag
        this._checkSyntax(Array.isArray(obj), `missing tag ${endLoop}`)

        i = obj.index
        currentList.push(['loop', name.trim(), obj.list])
        name = ''
        isLoopOpen = false
      } else if (tokens[i] === closingCond) {
        // Check syntax error
        this._checkSyntax(isVarOpen || isLoopOpen || isConstOpen, `unexpected ${tokens[i]}`)
        this._checkSyntax(isCondOpen === false, `unexpected ${tokens[i]}`)
        let obj = this._buildTokens(tokens, i + 1, [], endCond)

        // Check we found a closing tag
        this._checkSyntax(Array.isArray(obj), `missing tag ${endCond}`)

        i = obj.index
        currentList.push(['cond', name.trim(), obj.list])
        name = ''
        isCondOpen = false
      } else if (tokens[i] === hardPaste) {
        if (isVarOpen) {
          isExtraOpen = true
        } else {
          // There is `hardPaste` token in the text, let it in text
          currentList.push(['text', tokens[i]])
        }
      }
    }

    if (nbOpenVar > 0) {
      throw new Error(`Missing tag ${closingVar}`)
    } else if (nbConstOpen > 0) {
      throw new Error(`Missing tag ${closingConst}`)
    }
    return currentList
  },

  /**
   * Check value and throw message if necessary
   * @param {boolean} value Value to check
   * @param {String} message Message to throw
   */
  _checkSyntax: function (value, message) {
    if (value) {
      throw new SyntaxError(`Syntax error: ${message}`)
    }
  }
}

module.exports = mustache
