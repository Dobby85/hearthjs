/* eslint-env mocha */
const api = require('../lib/api')
const assert = require('assert')

describe('Router', () => {
  describe('Match route', () => {
    let routeList = ['GET /my/simple/route',
      'POST /my/simple/route',
      'DELETE /my/very/long/route/because/it/is/like/this',
      'POST /my/route/#/one/param',
      'PUT /my/route/#/#/param',
      'POST /my/route/#/#',
      'GET /my/#',
      'GET /my/#/#/#']

    it('should match a simple request', () => {
      let key = api.matchRoute(routeList, 'GET', '/my/simple/route')
      assert.strictEqual(key, 'GET /my/simple/route')
    })

    it('should match the correct route', () => {
      let routeList = ['GET /user/#',
        'GET /user/update-password']

      let key = api.matchRoute(routeList, 'GET', '/user/update-password')
      assert.strictEqual(key, 'GET /user/update-password')
    })

    it('should match the correct route 2', () => {
      let routeList = ['GET /user/#',
        'GET /user/update-password']

      let key = api.matchRoute(routeList, 'GET', '/user/1001')
      assert.strictEqual(key, 'GET /user/#')
    })

    it('should match a simple request with a different method', () => {
      let key = api.matchRoute(routeList, 'POST', '/my/simple/route')
      assert.strictEqual(key, 'POST /my/simple/route')
    })

    it('should not match with a different method', () => {
      let key = api.matchRoute(routeList, 'DEL', '/my/simple/route')
      assert.strictEqual(key, null)
    })

    it('should match a long route', () => {
      let key = api.matchRoute(routeList, 'DELETE', '/my/very/long/route/because/it/is/like/this')
      assert.strictEqual(key, 'DELETE /my/very/long/route/because/it/is/like/this')
    })

    it('should match a route with one param', () => {
      let key = api.matchRoute(routeList, 'POST', '/my/route/param/one/param')
      assert.strictEqual(key, 'POST /my/route/#/one/param')
    })

    it('should match a route with two param', () => {
      let key = api.matchRoute(routeList, 'PUT', '/my/route/param1/param2/param')
      assert.strictEqual(key, 'PUT /my/route/#/#/param')
    })

    it('should match a route with arguments at the end', () => {
      let key = api.matchRoute(routeList, 'POST', '/my/route/param1/param2?coucou=tata&tata=toto')
      assert.strictEqual(key, 'POST /my/route/#/#')
    })

    it('should match a route with one argument at the end', () => {
      let key = api.matchRoute(routeList, 'GET', '/my/param')
      assert.strictEqual(key, 'GET /my/#')
    })

    it('should match a route with three params', () => {
      let key = api.matchRoute(routeList, 'GET', '/my/param1/param2/param3')
      assert.strictEqual(key, 'GET /my/#/#/#')
    })
  })
})
