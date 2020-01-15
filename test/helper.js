/* eslint-env mocha */
const helper = require('../lib/helper')
const assert = require('assert')

describe('Helper', () => {
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
