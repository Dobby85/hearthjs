/* eslint-env mocha */
const validation = require('../lib//validation')
const assert = require('assert')

describe('Validation', () => {
  describe('Validate object', () => {
    describe('Object', () => {
      it('should validate simple object', () => {
        let schema = ['object', {
          firstname: ['>=', 4],
          age: ['>=', 18]
        }]
        let data = {
          firstname: 'John',
          age: 42
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate simple undetails object', () => {
        let schema = {
          firstname: ['>=', 4],
          age: ['>=', 18]
        }
        let data = {
          firstname: 'John',
          age: 42
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should return error on firstname', () => {
        let schema = ['object', {
          firstname: ['>=', 10],
          age: ['>=', 18]
        }]
        let data = {
          firstname: 'John',
          age: 42
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'firstname must be >= 10'
        })
      })

      it('should return error on age', () => {
        let schema = ['object', {
          firstname: ['>=', 4],
          age: ['>=', 18]
        }]
        let data = {
          firstname: 'John',
          age: 16
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'age must be >= 18'
        })
      })

      it('should validate object with array', () => {
        let schema = ['object', {
          name: ['>=', 2],
          users: ['array', {
            firstname: ['>', 2],
            age: ['>=', 18]
          }]
        }]
        let data = {
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 20
          }, {
            firstname: 'Mathieu',
            age: 25
          }]
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate undetails object with undetails array', () => {
        let schema = {
          name: ['>=', 2],
          users: [{
            firstname: ['>', 2],
            age: ['>=', 18]
          }]
        }
        let data = {
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 20
          }, {
            firstname: 'Mathieu',
            age: 25
          }]
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should not validate array of object', () => {
        let schema = ['object', {
          name: ['>=', 2],
          users: ['array', {
            firstname: ['>', 2],
            age: ['>=', 18, 'errorMessage', 'aie']
          }]
        }]
        let data = {
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 15
          }, {
            firstname: 'Mathieu',
            age: 25
          }]
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'aie'
        })
      })

      it('should not validate array of object 2', () => {
        let schema = ['object', {
          name: ['>=', 2],
          users: ['array', {
            firstname: ['>', 2],
            age: ['>=', 18, 'errorMessage', 'aie']
          }, '>', 1, 'error>Message', 'Must be greater']
        }]
        let data = {
          name: 'Account1',
          users: []
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Must be greater'
        })
      })

      it('should validate object when there are no constraints', () => {
        let schema = ['object', {
          name: [],
          users: ['array', {
            firstname: [],
            age: []
          }]
        }]
        let data = {
          name: 'Account1',
          users: []
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate object with object', () => {
        let schema = ['object', {
          name: ['>=', 2],
          user: ['object', {
            firstname: ['>', 2],
            age: ['>=', 18, 'errorMessage', 'aie']
          }]
        }]
        let data = {
          name: 'Account1',
          user: {
            firstname: 'John',
            age: 18
          }
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate undetails object with undetails object', () => {
        let schema = {
          name: ['>=', 2],
          user: {
            firstname: ['>', 2],
            age: ['>=', 18, 'errorMessage', 'aie']
          }
        }
        let data = {
          name: 'Account1',
          user: {
            firstname: 'John',
            age: 18
          }
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should not validate object with object', () => {
        let schema = ['object', {
          name: ['>=', 2],
          user: ['object', {
            firstname: ['>', 2, 'errorMessage', 'aie'],
            age: ['>=', 18]
          }]
        }]
        let data = {
          name: 'Account1',
          user: {
            firstname: 'Jo',
            age: 18
          }
        }
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'aie'
        })
      })
    })

    describe('Array', () => {
      it('should validate simple array', () => {
        let schema = ['array', {
          firstname: ['>=', 4],
          age: ['>=', 18]
        }]
        let data = [{
          firstname: 'John',
          age: 18
        }, {
          firstname: 'Johny',
          age: 42
        }, {
          firstname: 'Valid',
          age: 18
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate simple undetails array', () => {
        let schema = [{
          firstname: ['>=', 4],
          age: ['>=', 18]
        }]
        let data = [{
          firstname: 'John',
          age: 18
        }, {
          firstname: 'Johny',
          age: 42
        }, {
          firstname: 'Valid',
          age: 18
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should not validate undetails array with undetails object', () => {
        let schema = [{
          firstname: ['>=', 4],
          age: ['>=', 18],
          user: {
            mail: ['>', 4]
          }
        }]
        let data = [{
          firstname: 'John',
          age: 18,
          user: {
            mail: 'tototo'
          }
        }, {
          firstname: 'Johny',
          age: 42,
          user: {
            mail: 'tototo'
          }
        }, {
          firstname: 'Valid',
          age: 18,
          user: {
            mail: 'to'
          }
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'mail must be > 4'
        })
      })

      it('should return error simple array', () => {
        let schema = ['array', {
          firstname: ['>=', 4],
          age: ['>=', 18, 'error>=Message', 'Invalid age']
        }]
        let data = [{
          firstname: 'John',
          age: 18
        }, {
          firstname: 'Johny',
          age: 15 // INVALID
        }, {
          firstname: 'Valid',
          age: 18
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Invalid age'
        })
      })

      it('should return length error on simple array', () => {
        let schema = ['array', {
          firstname: ['>=', 4],
          age: ['>=', 18]
        }, '>', 1, 'errorMessage', 'bad length']
        let data = []
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'bad length'
        })
      })

      it('should validate array with array', () => {
        let schema = ['array', {
          name: ['>=', 4],
          users: ['array', {
            firstname: ['>', 2],
            age: ['<=', 60]
          }, '>=', 1]
        }]
        let data = [{
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 16
          }]
        }, {
          name: 'Account2',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }, {
            firstname: 'Bert',
            age: 30
          }]
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should validate undetails array with undetails array', () => {
        let schema = [{
          name: ['>=', 4],
          users: [{
            firstname: ['>', 2],
            age: ['<=', 60]
          }, '>=', 1]
        }]
        let data = [{
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 16
          }]
        }, {
          name: 'Account2',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }, {
            firstname: 'Bert',
            age: 30
          }]
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: true,
          newData: data
        })
      })

      it('should not validate undetails array with undetails array', () => {
        let schema = [{
          name: ['>=', 4],
          users: [{
            firstname: ['>', 2],
            age: ['<=', 60]
          }, '>=', 1]
        }]
        let data = [{
          name: 'Account1',
          users: [{
            firstname: 'John',
            age: 16
          }]
        }, {
          name: 'Account2',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }, {
            firstname: 'B',
            age: 30
          }]
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'firstname must be > 2'
        })
      })

      it('should not validate element in a nested array', () => {
        let schema = ['array', {
          name: ['>=', 4],
          users: ['array', {
            firstname: ['>', 2, 'errorMessage', 'Nope'],
            age: ['<=', 60]
          }, '>=', 1, 'error>=Message', 'Account must have at least one user']
        }]
        let data = [{
          name: 'Account1',
          users: []
        }, {
          name: 'Account2',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }, {
            firstname: 'Bert',
            age: 30
          }]
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Account must have at least one user'
        })
      })

      it('should not validate element in a nested array 2', () => {
        let schema = ['array', {
          name: ['>=', 4],
          users: ['array', {
            firstname: ['>', 2, 'errorMessage', 'Nope'],
            age: ['<=', 60]
          }, '>=', 1, 'error>=Message', 'Account must have at least one user']
        }]
        let data = [{
          name: 'Account1',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }]
        }, {
          name: 'Account2',
          users: [{
            firstname: 'Mathieu',
            age: 43
          }, {
            firstname: 'No',
            age: 30
          }]
        }]
        let result = validation.checkObject(schema, data)
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Nope'
        })
      })
    })
  })

  describe('Default value', () => {
    it('should add the key with the default value', () => {
      let schema = ['object', {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['default', '']
      }]
      let data = {
        firstname: 'John',
        age: 42
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: true,
        newData: {
          firstname: 'John',
          age: 42,
          phone: ''
        }
      })
    })

    it('should add the key with the default value for an undetails object', () => {
      let schema = {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['default', '']
      }
      let data = {
        firstname: 'John',
        age: 42
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: true,
        newData: {
          firstname: 'John',
          age: 42,
          phone: ''
        }
      })
    })

    it('should add the key with the default value 2', () => {
      let schema = ['object', {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['>=', 3, 'default', '']
      }]
      let data = {
        firstname: 'John',
        age: 42
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: true,
        newData: {
          firstname: 'John',
          age: 42,
          phone: ''
        }
      })
    })

    it('should not check validation for default value', () => {
      let schema = ['object', {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['default', '', '==', 10]
      }]
      let data = {
        firstname: 'John',
        age: 42
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: true,
        newData: {
          firstname: 'John',
          age: 42,
          phone: ''
        }
      })
    })

    it('should not set default value if a key is provided', () => {
      let schema = ['object', {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['default', '', '==', 10]
      }]
      let data = {
        firstname: 'John',
        age: 42,
        phone: '0000000000'
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: true,
        newData: {
          firstname: 'John',
          age: 42,
          phone: '0000000000'
        }
      })
    })

    it('should not validate a key even if it has a default value', () => {
      let schema = ['object', {
        firstname: ['>=', 4],
        age: ['>=', 18],
        phone: ['default', '', '==', 10, 'errorMessage', 'Oulala']
      }]
      let data = {
        firstname: 'John',
        age: 42,
        phone: '00000000'
      }
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: false,
        message: 'Oulala'
      })
    })
  })

  describe('Error management', () => {
    it('should return an error when key is missing', () => {
      let schema = ['array', {
        name: ['>=', 4],
        users: ['array', {
          firstname: ['>', 2, 'errorMessage', 'Nope'],
          age: ['<=', 60]
        }]
      }]
      let data = [{
        name: 'Account1',
        user: [{
          firstname: 'Mathieu',
          age: 43
        }]
      }]
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: false,
        message: 'Error: Missing key users in data'
      })
    })

    it('should return an error when key is missing in array', () => {
      let schema = ['array', {
        name: ['>=', 4],
        users: ['array', {
          firstname: ['>', 2, 'errorMessage', 'Nope'],
          age: ['<=', 60]
        }]
      }]
      let data = [{
        name: 'Account1',
        users: [{
          firstname: 'Mathieu',
          age: 43
        }, {
          firtname: 'Mathieu',
          age: 43
        }, {
          firstname: 'Mathieu',
          age: 43
        }]
      }]
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: false,
        message: 'Error: Missing key firstname in data'
      })
    })

    it('should return an error missing filter value', () => {
      let schema = ['array', {
        name: ['>=', 4],
        users: ['array', {
          firstname: ['>', 2, 'errorMessage'],
          age: ['<=', 60]
        }]
      }]
      let data = [{
        name: 'Account1',
        users: [{
          firstname: 'Mathieu',
          age: 43
        }, {
          firtname: 'Mathieu',
          age: 43
        }, {
          firstname: 'Mathieu',
          age: 43
        }]
      }]
      let result = validation.checkObject(schema, data)
      assert.deepStrictEqual(result, {
        valid: false,
        message: 'Error: Missing filter for firstname'
      })
    })
  })

  describe('Validate field', () => {
    describe('Comparaison operator', () => {
      it('number should not be <=', () => {
        let result = validation._validateField(['<=', 5], 6, 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be <= 5'
        })
      })

      it('string length should not be <=', () => {
        let result = validation._validateField(['<=', 5], 'Coucou', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be <= 5'
        })
      })

      it('should not be <', () => {
        let result = validation._validateField(['<', 3], 6, 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be < 3'
        })
      })

      it('should not be >=', () => {
        let result = validation._validateField(['>=', 10], 6, 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be >= 10'
        })
      })

      it('should not be >', () => {
        let result = validation._validateField(['>', 10], 'oups', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be > 10'
        })
      })

      it('should not be ==', () => {
        let result = validation._validateField(['==', 10], 'nope', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must be equals to 10'
        })
      })

      it('should be valid', () => {
        let result = validation._validateField(['==', 10], 10, 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })
    })

    describe('Regex', () => {
      it('should not match regex', () => {
        let result = validation._validateField(['regex', '\\S+\\.\\S+\\.\\S+'], 'test.mail', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key does not match regex \\S+\\.\\S+\\.\\S+'
        })
      })

      it('should match regex', () => {
        let result = validation._validateField(['regex', '\\S+\\.\\S+\\.\\S+'], 'test.mail.coucou', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })
    })

    describe('Type', () => {
      it('should be a valid date', () => {
        let result = validation._validateField(['type', 'date'], '10/09/1998', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should be a valid date if data is a new date', () => {
        let _date = new Date('10/09/1998')
        let result = validation._validateField(['type', 'date'], _date.toString(), 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should be a valid date if data is not on two digit', () => {
        let result = validation._validateField(['type', 'date'], '9/2/1998', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not match date regex', () => {
        let result = validation._validateField(['type', 'date'], '10-09-1998', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not validate date which does not exists', () => {
        let result = validation._validateField(['type', 'date'], '31/02/2018', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key is invalid. Check your date exists and respects the following format mm/dd/yyyy.'
        })
      })

      it('should not validate a string', () => {
        let result = validation._validateField(['type', 'date'], 'toto', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key is invalid. Check your date exists and respects the following format mm/dd/yyyy.'
        })
      })

      it('should be a valid mail', () => {
        let result = validation._validateField(['type', 'mail'], 'toto@toto.com', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not match mail regex', () => {
        let result = validation._validateField(['type', 'mail'], 'totototo.com', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key totototo.com is an invalid mail.'
        })
      })

      it('should be a valid url', () => {
        let result = validation._validateField(['type', 'url'], 'http://google.fr', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not match url regex', () => {
        let result = validation._validateField(['type', 'url'], 'http:/google.fr', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key http:/google.fr is an invalid url.'
        })
      })

      it('should be a valid id address', () => {
        let result = validation._validateField(['type', 'idAddress'], '127.0.0.1', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not match id address regex', () => {
        let result = validation._validateField(['type', 'idAddress'], '127.00.1', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key 127.00.1 is an invalid IP address.'
        })
      })

      it('should be a valid phone', () => {
        let result = validation._validateField(['type', 'phone'], '00 00 00 00 00', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not match phone regex', () => {
        let result = validation._validateField(['type', 'phone', 'errortypeMessage', 'Invalid phone'], 'a00 00 00 00 00', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Invalid phone'
        })
      })

      it('should return an error when type is unknown', () => {
        let result = validation._validateField(['type', 'unknow'], 'totototo.com', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Unknow type unknow for key key'
        })
      })
    })

    describe('Function', () => {
      it('should validate with function', () => {
        let func = (value) => {
          if (value.length < 3) {
            return {
              valid: false,
              message: 'Invalid...'
            }
          }
          return true
        }
        let result = validation._validateField(['function', func], 'coucou', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should return error message set in function', () => {
        let func = (value) => {
          if (value.length < 3) {
            return {
              valid: false,
              message: 'Invalid...'
            }
          }
          return true
        }
        let result = validation._validateField(['function', func], 'co', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Invalid...'
        })
      })

      it('should return errorfunctionMessage', () => {
        let func = (value) => {
          if (value.length < 3) {
            return {
              valid: false,
              message: 'Invalid...'
            }
          }
          return true
        }
        let result = validation._validateField(['function', func, 'errorfunctionMessage', 'Nope'], 'co', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Nope'
        })
      })

      it('should work if function return nothing', () => {
        let func = (value) => {
        }
        let result = validation._validateField(['function', func, 'errorfunctionMessage', 'Nope'], 'co', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'You must return a correct value in your function for key key'
        })
      })
    })

    describe('Start/End with', () => {
      it('should validate startsWith', () => {
        let result = validation._validateField(['startsWith', 'cou'], 'coucou', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not validate startsWith', () => {
        let result = validation._validateField(['startsWith', 'cou'], 'Hello', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'key must start with cou'
        })
      })

      it('should validate endsWith', () => {
        let result = validation._validateField(['endsWith', 'cou'], 'blacou', 'key')
        assert.deepStrictEqual(result, {
          valid: true
        })
      })

      it('should not validate endsWith', () => {
        let result = validation._validateField(['endsWith', 'cou', 'errorendsWithMessage', 'Aie'], 'Hello', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Aie'
        })
      })
    })

    describe('Error', () => {
      it('should return unknown filter', () => {
        let result = validation._validateField(['oups', 'cou'], 'Hello', 'key')
        assert.deepStrictEqual(result, {
          valid: false,
          message: 'Unknow filter oups'
        })
      })
    })
  })

  describe('Has default value', () => {
    it('should have a default value', () => {
      const rules = ['default', 'toto', '>=', 3]
      let result = validation._hasDefaultValue(rules)
      assert.strictEqual(result.has, true)
      assert.strictEqual(result.value, 'toto')
    })

    it('should not have a default value', () => {
      const rules = ['default']
      let result = validation._hasDefaultValue(rules)
      assert.strictEqual(result.has, false)
    })

    it('should not have a default value', () => {
      const rules = ['>=', 3, 'default']
      let result = validation._hasDefaultValue(rules)
      assert.strictEqual(result.has, false)
    })
  })

  describe('Error message', () => {
    it('should return a specific error message', () => {
      let errorMessage = validation._getErrorMessage(['>=', 5, 'error>=Message', 'Value must be >= 5'], '>=', 'Oups')
      assert.strictEqual(errorMessage, 'Value must be >= 5')
    })

    it('should return a specific error message 2', () => {
      let errorMessage = validation._getErrorMessage(['>=', 5, 'type', 'mail', 'error>=Message', 'Value must be >= 5', 'errortypeMessage', 'Value must be a mail'], 'type', 'Oups')
      assert.strictEqual(errorMessage, 'Value must be a mail')
    })

    it('should return error message', () => {
      let errorMessage = validation._getErrorMessage(['>=', 5, 'error>=Message', 'Value must be >= 5', 'errorMessage', 'My error message'], '==', 'Oups')
      assert.strictEqual(errorMessage, 'My error message')
    })

    it('should return default message', () => {
      let errorMessage = validation._getErrorMessage(['>=', 5, 'error>=Message', 'Value must be >= 5'], '==', 'Oups')
      assert.strictEqual(errorMessage, 'Oups')
    })
  })
})
