/* eslint-env mocha */
const assert = require('assert')
const translate = require('../lib/translate')
const path = require('path')
const fs = require('fs')
const logger = require('../lib/logger')

describe('Translate', () => {
  after(() => {
    const _logFile = path.join(__dirname, 'datasets', 'myApp', 'server', 'logs', `${logger._getCurrentDateTime(false)}.log`)

    if (fs.existsSync(_logFile)) {
      fs.unlinkSync(_logFile)
    }
  })

  describe('Load translation files', () => {
    it('should load fr and en lang files', (done) => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
      translate.initTranslations('en', (err) => {
        assert.strictEqual(err, null)
        assert.strictEqual(translate._getDefaultLanguage(), 'en')
        assert.deepStrictEqual(translate._getTranslations(), {
          en: { hello: 'hi', me: 'me' },
          fr: { hello: 'salut', me: 'moi' }
        })
        done()
      })
    })

    it('should return an error if a file cannot be parsed', (done) => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'errorApp', 'server')
      translate.initTranslations('en', (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })

    it('should return an error if the lang directory does not exists', (done) => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'errorConfigApp', 'server')
      translate.initTranslations('en', (err) => {
        assert.notStrictEqual(err, null)
        done()
      })
    })
  })

  describe('Get translation', () => {
    before(() => {
      translate._setTranslations({
        en: { hello: 'hi', me: 'me' },
        fr: { hello: 'salut', me: 'moi' }
      })
    })

    it('should return the key if lang and defaultLanguage does not exist in translations', () => {
      translate._setDefaultLanguage('eu')
      assert.strictEqual(translate.t('hello', 'be'), 'hello')
    })

    it('should return the key if default language exists but not the key', () => {
      translate._setDefaultLanguage('en')
      assert.strictEqual(translate.t('nope'), 'nope')
    })

    it('should return the value if the key and default language exists', () => {
      translate._setDefaultLanguage('en')
      assert.strictEqual(translate.t('hello'), 'hi')
    })

    it('should return the key lang exists but not the key', () => {
      translate._setDefaultLanguage('en')
      assert.strictEqual(translate.t('nope', 'fr'), 'nope')
    })

    it('should return the value if the key and the lang exists', () => {
      translate._setDefaultLanguage('en')
      assert.strictEqual(translate.t('me', 'fr'), 'moi')
    })
  })

  describe('Parse file', () => {
    beforeEach(() => {
      translate._setMatchedKeys([])
    })

    it('should parse file and find all translated key', (done) => {
      translate._parseFile(path.join(__dirname, 'datasets', 'translations', 'keys.js'), (err) => {
        assert.strictEqual(err, null)
        const _keys = translate._getMatchedKeys()
        assert.strictEqual(_keys.length, 3)
        assert.strictEqual(_keys[0].token, 'Error...')
        assert.strictEqual(_keys[1].token, 'Hello')
        assert.strictEqual(_keys[2].token, 'Hello  |/ \\\\ my,?!:+-*=0 1 2 3 frien')
        done()
      })
    })

    it('should not return an error if the file is empty', (done) => {
      translate._parseFile(path.join(__dirname, 'datasets', 'translations', 'empty.js'), (err) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(translate._getMatchedKeys(), [])
        done()
      })
    })
  })

  describe('Parse directory files', () => {
    before(() => {
      process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'myApp', 'server')
    })

    beforeEach(() => {
      translate._setMatchedKeys([])
    })

    it('should find token of all server one time', (done) => {
      translate._parseDirectoryFiles('/', (err) => {
        assert.strictEqual(err, null)
        const _keys = translate._getMatchedKeys()
        assert.strictEqual(_keys[0].token, 'Error...')
        assert.strictEqual(_keys[1].token, 'Hello')
        assert.strictEqual(_keys[2].token, 'Coucou')
        assert.strictEqual(_keys[3].token, 'ououlala')
        assert.strictEqual(_keys[4].token, 'Great!')
        assert.strictEqual(_keys[5].token, 'OK')
        assert.strictEqual(_keys[6].token, 'OK!')
        done()
      })
    })

    it('should find the keys of only one directory', (done) => {
      translate._parseDirectoryFiles('/api/api2', (err) => {
        assert.strictEqual(err, null)
        const _keys = translate._getMatchedKeys()
        assert.strictEqual(_keys[0].token, 'Error...')
        assert.strictEqual(_keys[1].token, 'Hello')
        done()
      })
    })

    it('should not find keys because we does not want recursivity', (done) => {
      translate._setKeyParseOptions('recursive', false)

      translate._parseDirectoryFiles('/', (err) => {
        assert.strictEqual(err, null)
        assert.deepStrictEqual(translate._getMatchedKeys(), [])
        done()
      })
    })
  })

  describe('Read lang directory', () => {
    describe('Create lang file', () => {
      const _enPath = path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang', 'en.json')
      before(() => {
        translate._setMatchedKeys([{ token: 'Hello' }, { token: 'me' }, { token: 'you' }, { token: 'no' }, { token: 'yes' }])
        process.env.HEARTH_SERVER_PATH = path.join(__dirname, 'datasets', 'translationApp', 'server')
      })

      after(() => {
        if (fs.existsSync(_enPath)) {
          fs.unlinkSync(_enPath)
        }
      })

      it('should do nothing if lang directory is empty and no lang is specified', (done) => {
        translate._readLangDirectory(undefined, (err) => {
          assert.strictEqual(err, null)
          fs.readdir(path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang'), (err, files) => {
            assert.strictEqual(err, null)

            files = files.filter(file => file[0] !== '.')
            assert.strictEqual(files.length, 0)
            done()
          })
        })
      })

      it('should create lang file if it does not exist', (done) => {
        translate._readLangDirectory('en', (err) => {
          assert.strictEqual(err, null)
          let parsed = JSON.parse(fs.readFileSync(_enPath, 'utf8'))
          assert.deepStrictEqual(parsed, {
            Hello: '',
            me: '',
            you: '',
            no: '',
            yes: ''
          })
          done()
        })
      })
    })

    describe('Update lang file', () => {
      const _enPath = path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang', 'en.json')
      const _frPath = path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang', 'fr.json')

      before(() => {
        translate._setMatchedKeys([{ token: 'hello' }, { token: 'me' }, { token: 'you' }, { token: 'no' }, { token: 'yes' }])
      })

      beforeEach(() => {
        fs.writeFileSync(_enPath, JSON.stringify({
          hello: 'hello',
          yes: 'yes',
          no: 'no'
        }))
        fs.writeFileSync(_frPath, JSON.stringify({
          hello: 'bonjour',
          yes: 'oui',
          no: 'non'
        }))
      })

      after(() => {
        fs.unlinkSync(_enPath)
        fs.unlinkSync(_frPath)
      })

      it('should update one lang file', (done) => {
        translate._readLangDirectory('en', (err) => {
          assert.strictEqual(err, null)
          let parsedEn = JSON.parse(fs.readFileSync(_enPath, 'utf8'))
          assert.deepStrictEqual(parsedEn, {
            hello: 'hello',
            me: '',
            you: '',
            no: 'no',
            yes: 'yes'
          })
          let parsedFr = JSON.parse(fs.readFileSync(_frPath, 'utf8'))
          assert.deepStrictEqual(parsedFr, {
            hello: 'bonjour',
            no: 'non',
            yes: 'oui'
          })
          done()
        })
      })

      it('should update all lang files', (done) => {
        translate._readLangDirectory(undefined, (err) => {
          assert.strictEqual(err, null)
          let parsedEn = JSON.parse(fs.readFileSync(_enPath, 'utf8'))
          assert.deepStrictEqual(parsedEn, {
            hello: 'hello',
            me: '',
            you: '',
            no: 'no',
            yes: 'yes'
          })
          let parsedFr = JSON.parse(fs.readFileSync(_frPath, 'utf8'))
          assert.deepStrictEqual(parsedFr, {
            hello: 'bonjour',
            me: '',
            you: '',
            no: 'non',
            yes: 'oui'
          })
          done()
        })
      })
    })

    describe('Delete keys', () => {
      const _enPath = path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang', 'en.json')
      const _frPath = path.join(__dirname, 'datasets', 'translationApp', 'server', 'lang', 'fr.json')

      before(() => {
        translate._setMatchedKeys([{ token: 'hello' }, { token: 'me' }, { token: 'you' }])
        translate._setKeyParseOptions('delete', true)
      })

      beforeEach(() => {
        fs.writeFileSync(_enPath, JSON.stringify({
          hello: 'hello',
          yes: 'yes',
          no: 'no'
        }))
        fs.writeFileSync(_frPath, JSON.stringify({
          hello: 'bonjour',
          yes: 'oui',
          no: 'non'
        }))
      })

      after(() => {
        fs.unlinkSync(_enPath)
        fs.unlinkSync(_frPath)
      })

      it('should delete key of en lang file', (done) => {
        translate._readLangDirectory('en', (err) => {
          assert.strictEqual(err, null)
          let parsedEn = JSON.parse(fs.readFileSync(_enPath, 'utf8'))
          assert.deepStrictEqual(parsedEn, {
            hello: 'hello',
            me: '',
            you: ''
          })
          let parsedFr = JSON.parse(fs.readFileSync(_frPath, 'utf8'))
          assert.deepStrictEqual(parsedFr, {
            hello: 'bonjour',
            no: 'non',
            yes: 'oui'
          })
          done()
        })
      })

      it('should delete keys of all lang files', (done) => {
        translate._readLangDirectory(undefined, (err) => {
          assert.strictEqual(err, null)
          let parsedEn = JSON.parse(fs.readFileSync(_enPath, 'utf8'))
          assert.deepStrictEqual(parsedEn, {
            hello: 'hello',
            me: '',
            you: ''
          })
          let parsedFr = JSON.parse(fs.readFileSync(_frPath, 'utf8'))
          assert.deepStrictEqual(parsedFr, {
            hello: 'bonjour',
            me: '',
            you: ''
          })
          done()
        })
      })
    })
  })
})
