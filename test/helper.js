/* eslint-env mocha */
const helper = require('../lib/helper')
const assert = require('assert')

describe('Helper', () => {
  describe('Assert array of object', () => {
    it('should assert arrays are equal if items are in the same order', () => {
      let actual = [
        { id: 1, name: 'toto', obj: { key: 'lala' } },
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } }
      ]
      let expected = [
        { id: 1, name: 'toto', obj: { key: 'lala' } },
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } }
      ]

      try {
        helper.assertTableOfObject(actual, expected, 'id')
        assert.strictEqual(true, true)
      } catch (e) {
        assert.strictEqual(true, false)
      }
    })

    it('should assert arrays are equal if items are not in the same order', () => {
      let actual = [
        { id: 1, name: 'toto', obj: { key: 'lala' } },
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } }
      ]
      let expected = [
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } },
        { id: 1, name: 'toto', obj: { key: 'lala' } }
      ]

      try {
        helper.assertTableOfObject(actual, expected, 'id')
        assert.strictEqual(true, true)
      } catch (e) {
        console.log(e)
        assert.strictEqual(true, false)
      }
    })

    it('should throw an error if on object is missing', () => {
      let actual = [
        { id: 1, name: 'toto', obj: { key: 'lala' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } }
      ]
      let expected = [
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } },
        { id: 1, name: 'toto', obj: { key: 'lala' } }
      ]

      try {
        helper.assertTableOfObject(actual, expected, 'id')
        assert.strictEqual(true, false)
      } catch (e) {
        assert.strictEqual(e.message, 'Object not found with key 2')
        assert.strictEqual(true, true)
      }
    })

    it('should throw an error if one value is different', () => {
      let actual = [
        { id: 1, name: 'toto', obj: { key: 'lala' } },
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'lili' } }
      ]
      let expected = [
        { id: 2, name: 'tata', obj: { key: 'lolo' } },
        { id: 3, name: 'titi', obj: { key: 'luli' } },
        { id: 1, name: 'toto', obj: { key: 'lala' } }
      ]

      try {
        helper.assertTableOfObject(actual, expected, 'id')
        assert.strictEqual(true, false)
      } catch (e) {
        assert.strictEqual(true, true)
      }
    })
  })

  describe('Handle promise error', () => {
    it('should return an error if promise return an error', async () => {
      let promise = new Promise((resolve, reject) => {
        return reject(new Error('Error with promise'))
      })

      let [error, data] = await helper.handlePromiseError(promise)
      assert.strictEqual(error.message, 'Error with promise')
      assert.strictEqual(data, null)
    })

    it('should return the result of the promise', async () => {
      let promise = new Promise((resolve, reject) => {
        return resolve({ id: 1 })
      })

      let [error, data] = await helper.handlePromiseError(promise)
      assert.strictEqual(error, null)
      assert.deepStrictEqual(data, { id: 1 })
    })
  })

  describe('Generic queue', () => {
    it('should concatenate a list of item', (done) => {
      let result = ''
      let items = ['Coucou', ' ', 'ca', ' ', 'va', ' ', '?']

      let queue = helper.genericQueue(items, (item, next) => {
        result += item
        return next()
      }, (err) => {
        assert.strictEqual(err, null)
      }, () => {
        assert.strictEqual(result, 'Coucou ca va ?')
        done()
      })

      assert.strictEqual(result, '')

      queue.start()
    })

    it('should return an error and never call callback', (done) => {
      let result = ''
      let items = ['Coucou', ' ', 'ca', ' ', 'va', ' ', '?']

      helper.genericQueue(items, (item, next) => {
        result += item
        return next(new Error('Nope'))
      }, (err) => {
        assert.notStrictEqual(err, null)
        assert.strictEqual(result, 'Coucou')
        done()
      }, () => {
        assert.strictEqual(1, 2)
      }).start()
    })

    it('should do nothing with an empty list', (done) => {
      let result = ''
      let items = ['']

      helper.genericQueue(items, (item, next) => {
        result += item
        return next()
      }, (err) => {
        assert.strictEqual(err, null)
      }, () => {
        assert.strictEqual(result, '')
        done()
      }).start()
    })
  })
})
