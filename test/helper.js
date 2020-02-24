/* eslint-env mocha */
const helper = require('../lib/helper')
const assert = require('assert')

describe('Helper', () => {
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
