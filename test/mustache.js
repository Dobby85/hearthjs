/* eslint-env mocha */
const mustache = require('../lib/mustache')
const assert = require('assert')
const path = require('path')
const fsMock = require('file-mock')

describe('Mustache', () => {
  describe('Parser', () => {
    it('should tokenize a variable', () => {
      let expected = [['text', 'Coucou '], ['var', 'myVar'], ['text', ' !']]
      let result = mustache.parse('Coucou {{   myVar}} !')
      assert.deepStrictEqual(result, expected)
    })

    describe('HardParse token', () => {
      it('should tokenize a variable with extra', () => {
        let expected = [['text', 'Coucou '], ['var', 'myVar', 'hard'], ['text', ' !']]
        let result = mustache.parse('Coucou {{   myVar:hard}} !')
        assert.deepStrictEqual(result, expected)
      })

      it('should trim extra token', () => {
        let expected = [['text', 'Coucou '], ['var', 'myVar', 'hard'], ['text', ' !']]
        let result = mustache.parse('Coucou {{   myVar:hard   }} !')
        assert.deepStrictEqual(result, expected)
      })

      it('should interpret hardPaste token like text', () => {
        let expected = [['text', 'Coucou '], ['text', ':'], ['text', ' ca va?'], ['var', 'myVar']]
        let result = mustache.parse('Coucou : ca va?{{   myVar}}')
        assert.deepStrictEqual(result, expected)
      })

      it('should interpret multiple hardPaste token like text or var', () => {
        let expected = [['text', 'Coucou '], ['text', ':'], ['text', ':'], ['text', ' ca'], ['text', ':'], ['text', ' va?'], ['var', 'myVar', 'hard'], ['var', 'myVar2', 'oulaHard']]
        let result = mustache.parse('Coucou :: ca: va?{{   myVar:hard}}{{   myVar2:oulaHard}}')
        assert.deepStrictEqual(result, expected)
      })

      it('should add multiple extra to a var', () => {
        let expected = [['text', 'Coucou '], ['var', 'myVar', 'hard', 'oulaHard', 'nope'], ['text', ':'], ['text', 'nope']]
        let result = mustache.parse('Coucou {{   myVar:hard:oulaHard:nope}}:nope')
        assert.deepStrictEqual(result, expected)
      })
    })

    it('should tokenize an include', () => {
      let expected = [['text', 'coucou '], ['include', 'getCard'], ['text', ' nope']]
      let result = mustache.parse('coucou {-> getCard <-} nope')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize a condition', () => {
      let expected = [['text', 'Coucou '], ['cond', 'data.id', [['text', ' my condition ']]]]
      let result = mustache.parse('Coucou {# data.id #} my condition {{#}}')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize a loop', () => {
      let expected = [['text', 'Coucou '], ['cond', 'data.id', [['text', ' my condition ']]]]
      let result = mustache.parse('Coucou {# data.id #} my condition {{#}}')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize constant PRINT', () => {
      let expected = [['text', 'Coucou '], ['const', 'print']]
      let result = mustache.parse('Coucou {$ PRINT $}')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize constant ORDER BY', () => {
      let expected = [['text', 'Coucou '], ['const', 'orderby']]
      let result = mustache.parse('Coucou {$    ORDER BY   $}')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize a loop in a loop', () => {
      let expected = [['text', 'Coucou '], ['loop', 'data.id', [['loop', 'data.id2', [['text', 'Hello']]]]]]
      let result = mustache.parse('Coucou {% data.id %}{% data.id2 %}Hello{{%}}{{%}}')
      assert.deepStrictEqual(result, expected)
    })

    it('should tokenize a cond in a cond', () => {
      let expected = [['text', 'Coucou '], ['cond', 'data.id', [['cond', 'data.id2', [['text', 'Hello']]]]]]
      let result = mustache.parse('Coucou {# data.id #}{# data.id2 #}Hello{{#}}{{#}}')
      assert.deepStrictEqual(result, expected)
    })

    it('should return tokens with loop, condition and variable', () => {
      let expected = [
        ['text', 'INSERT INTO '],
        ['var', 'data.tableName'],
        ['text', ' ('],
        ['loop', 'data.columns', [
          ['var', 'data.columns[i]'],
          ['cond', 'data.columns[i+1]!==undefined', [
            ['text', ',']
          ]]
        ]],
        ['text', ' WHERE '],
        ['cond', 'data.id', [
          ['text', 'id='],
          ['var', 'data.id']
        ]]
      ]
      let result = mustache.parse('INSERT INTO {{ data.tableName }} ({% data.columns %}{{data.columns[i]}}{#data.columns[i+1]!==undefined#},{{#}}{{%}} WHERE {# data.id #}id={{data.id}}{{#}}')
      assert.deepStrictEqual(result, expected)
    })

    it('should return tokens for two conditions', () => {
      let expected = [['cond', 'data.age >= 18', [
        ['text', 'Je suis majeur, '],
        ['var', 'data.age'],
        ['text', ' ans']]],
      ['cond', 'data.age < 18', [
        ['text', 'Je suis mineur, '],
        ['var', 'data.age'],
        ['text', ' ans']]]
      ]
      let result = mustache.parse('{# data.age >= 18 #}Je suis majeur, {{ data.age }} ans{{#}}{# data.age < 18 #}Je suis mineur, {{ data.age }} ans{{#}}')
      assert.deepStrictEqual(result, expected)
    })

    describe('Errors', () => {
      it('should throw an error when no extra are passed to a variable', () => {
        const func = () => mustache.parse('Coucou {{ myVar: }}')
        assert.throws(func, Error)
      })

      it('should throw an error when bad closing tag', () => {
        const func = () => mustache.parse('Coucou {{ myVar %}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when bad closing tag 2', () => {
        const func = () => mustache.parse('Coucou {% myVar }}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when bad closing tag 3', () => {
        const func = () => mustache.parse('Coucou {% myVar #}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when bad closing tag 4', () => {
        const func = () => mustache.parse('Coucou {% myVar $}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when bad closing tag 5', () => {
        const func = () => mustache.parse('Coucou {-> myVar $}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when bad closing tag 6', () => {
        const func = () => mustache.parse('Coucou {{ myVar <-}')
        assert.throws(func, SyntaxError)
      })

      it('should throw an error when all variable are not closed', () => {
        const func = () => mustache.parse('Coucou {{ myVar')
        assert.throws(func, Error)
      })

      it('should throw an error when all constants are not closed', () => {
        const func = () => mustache.parse('Coucou {$ PRINT $} {$ orderby')
        assert.throws(func, Error)
      })

      it('should throw an error if all conditions are not closed', () => {
        const func = () => mustache.parse('Coucou {# first #} coucou {# second #} lala {{#}}')
        assert.throws(func, Error)
      })

      it('should throw an error if all loops are not closed', () => {
        const func = () => mustache.parse('Coucou {% first %} coucou {% second %} lala {{%}}')
        assert.throws(func, Error)
      })

      it('should throw an error if all includes are not closed', () => {
        const func = () => mustache.parse('Coucou {-> first <-} coucou {-> nope')
        assert.throws(func, Error)
      })

      describe('Can\'t open a variable if something else if open', () => {
        it('should throw an error when a variable is not closed and a new variable is being opening', () => {
          const func = () => mustache.parse('Coucou {{ myVar {{')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a condition is not closed and a new variable is being opening', () => {
          const func = () => mustache.parse('Coucou {# myVar {{')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop is not closed and a new variable is being opening', () => {
          const func = () => mustache.parse('Coucou {% myVar {{')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant is not closed and a new variable is being opening', () => {
          const func = () => mustache.parse('Coucou {$ PRINT {{')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include is not closed and a new variable is being opening', () => {
          const func = () => mustache.parse('Coucou {-> PRINT {{')
          assert.throws(func, SyntaxError)
        })
      })

      describe('Can\'t open a condition if something else if open', () => {
        it('should throw an error when a variable is not closed and a new condition is being opening', () => {
          const func = () => mustache.parse('Coucou {{ myVar {#')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a condition is not closed and a new condition is being opening', () => {
          const func = () => mustache.parse('Coucou {# myVar {#')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop is not closed and a new condition is being opening', () => {
          const func = () => mustache.parse('Coucou {% myVar {#')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant is not closed and a new condition is being opening', () => {
          const func = () => mustache.parse('Coucou {$ ORDER BY {#')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include is not closed and a new condition is being opening', () => {
          const func = () => mustache.parse('Coucou {-> ORDER BY {#')
          assert.throws(func, SyntaxError)
        })
      })

      describe('Can\'t open a loop if something else if open', () => {
        it('should throw an error when a variable is not closed and a new loop is being opening', () => {
          const func = () => mustache.parse('Coucou {{ myVar {%')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a condition is not closed and a new loop is being opening', () => {
          const func = () => mustache.parse('Coucou {# myVar {%')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop is not closed and a new loop is being opening', () => {
          const func = () => mustache.parse('Coucou {% myVar {%')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant is not closed and a new loop is being opening', () => {
          const func = () => mustache.parse('Coucou {$ PRINT {%')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include is not closed and a new loop is being opening', () => {
          const func = () => mustache.parse('Coucou {-> PRINT {%')
          assert.throws(func, SyntaxError)
        })
      })

      describe('Can\'t open a constant if something else if open', () => {
        it('should throw an error when a variable is not closed and a new constant is being opening', () => {
          const func = () => mustache.parse('Coucou {{ myVar {$')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a condition is not closed and a new constant is being opening', () => {
          const func = () => mustache.parse('Coucou {# myVar {$')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop is not closed and a new constant is being opening', () => {
          const func = () => mustache.parse('Coucou {% myVar {$')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant is not closed and a new constant is being opening', () => {
          const func = () => mustache.parse('Coucou {$ PRINT {$')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include is not closed and a new constant is being opening', () => {
          const func = () => mustache.parse('Coucou {-> PRINT {$')
          assert.throws(func, SyntaxError)
        })
      })

      describe('Can\'t open an include if something else if open', () => {
        it('should throw an error when a variable is not closed and an include is being opening', () => {
          const func = () => mustache.parse('Coucou {{ myVar {->')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a condition is not closed and an include is being opening', () => {
          const func = () => mustache.parse('Coucou {# myVar {->')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop is not closed and an include is being opening', () => {
          const func = () => mustache.parse('Coucou {% myVar {->')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant is not closed and an include is being opening', () => {
          const func = () => mustache.parse('Coucou {$ PRINT {->')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include is not closed and an include is being opening', () => {
          const func = () => mustache.parse('Coucou {-> PRINT {->')
          assert.throws(func, SyntaxError)
        })
      })

      describe('Check a tag has been open when a closing tag is encountered', () => {
        it('should throw an error when a var closing tag is encountered and not opening', () => {
          const func = () => mustache.parse('Coucou }}')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a loop closing tag is encountered and not opening', () => {
          const func = () => mustache.parse('Coucou %}')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a cond closing tag is encountered and not opening', () => {
          const func = () => mustache.parse('Coucou #}')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when a constant closing tag is encountered and not opening', () => {
          const func = () => mustache.parse('Coucou $}')
          assert.throws(func, SyntaxError)
        })

        it('should throw an error when an include closing tag is encountered and not opening', () => {
          const func = () => mustache.parse('Coucou <-}')
          assert.throws(func, SyntaxError)
        })
      })
    })
  })

  describe('Create indexes', () => {
    it('should return an empty string', () => {
      let string = mustache._createIndexes([])
      assert.strictEqual(string, '')
    })

    it('should return i', () => {
      let string = mustache._createIndexes([2])
      assert.strictEqual(string, 'let i = 2; ')
    })

    it('should return i and j', () => {
      let string = mustache._createIndexes([2, 1])
      assert.strictEqual(string, 'let i = 2; let j = 1; ')
    })

    it('should return i, j and k', () => {
      let string = mustache._createIndexes([0, 1, 2])
      assert.strictEqual(string, 'let i = 0; let j = 1; let k = 2; ')
    })
  })

  describe('Render', () => {
    it('should render simple variables', (done) => {
      let data = {
        firstname: 'John',
        lastname: 'Doe'
      }
      mustache.render('Coucou {{ data.firstname }} {{ data.lastname }}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          string: 'Coucou $1 $2',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    it('should render constant', (done) => {
      let data = {
        firstname: 'John',
        lastname: 'Doe'
      }
      mustache.render('{$ PRINT $}Coucou {{ data.firstname }} {{ data.lastname }}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)

        let expected = {
          print: true,
          string: 'Coucou $1 $2',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    it('should not crash if same constant is render multiple times', (done) => {
      let data = {
        firstname: 'John'
      }
      mustache.render('{$ PRINT $}Coucou {{ data.firstname }}{$PRINT$}{$    PRINT   $}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          print: true,
          string: 'Coucou $1',
          data: ['John']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    it('should render a condition', (done) => {
      let data = {
        age: 18
      }
      mustache.render('{# data.age >= 18 #}Je suis {$PRINT$}majeur, {{ data.age }} ans{{#}}{# data.age < 18 #}Je suis mineur, {{ data.age }} ans{{#}}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          print: true,
          string: 'Je suis majeur, $1 ans',
          data: [18]
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    describe('Render includes', () => {
      beforeEach(() => {
        fsMock.mock({
          'test/datasets': {
            'getCard.sql': 'Hello, Im {{ data.age }}',
            'loopInclude.sql': '{% data.names[i].values %} v: {{ data.names[i].values[j] }} {{%}}'
          }
        })
      })

      afterEach(() => {
        fsMock.restore()
      })

      it('should render an include', (done) => {
        let sqlFiles = {
          getCard: path.join(__dirname, 'datasets', 'getCard.sql')
        }
        let data = {
          firstname: 'toto',
          lastname: 'dupont',
          age: 18
        }
        mustache.render('{{ data.firstname }} {{ data.lastname }} {-> getCard <-}', data, {}, sqlFiles, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: '$1 $2 Hello, Im $3',
            data: ['toto', 'dupont', 18]
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should render multiple include', (done) => {
        let sqlFiles = {
          getCard: path.join(__dirname, 'datasets', 'getCard.sql')
        }
        let data = {
          firstname: 'toto',
          lastname: 'dupont',
          age: 18
        }
        mustache.render('{-> getCard <-} {-> getCard <-} {-> getCard <-}', data, {}, sqlFiles, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: 'Hello, Im $1 Hello, Im $2 Hello, Im $3',
            data: [18, 18, 18]
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should render multiple include', (done) => {
        let sqlFiles = {
          getCard: path.join(__dirname, 'datasets', 'getCard.sql')
        }
        let data = {
          firstname: 'toto',
          lastname: 'dupont',
          age: 18
        }
        mustache.render('{{ data.firstname }} {-> getCard <-} {{ data.firstname }} {-> getCard <-} {{ data.firstname }}', data, {}, sqlFiles, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: '$1 Hello, Im $2 $3 Hello, Im $4 $5',
            data: ['toto', 18, 'toto', 18, 'toto']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should render include with loops', (done) => {
        let sqlFiles = {
          loopInclude: path.join(__dirname, 'datasets', 'loopInclude.sql')
        }
        let data = {
          names: [{
            name: 'toto',
            values: [1, 2, 3]
          }, {
            name: 'tata',
            values: [4, 5, 6]
          }, {
            name: 'titi',
            values: [7, 8, 9]
          }]
        }
        mustache.render('{% data.names %} name: {{ data.names[i].name }} {-> loopInclude <-} {{%}}', data, {}, sqlFiles, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: ' name: $1  v: $2  v: $3  v: $4   name: $5  v: $6  v: $7  v: $8   name: $9  v: $10  v: $11  v: $12  ',
            data: ['toto', 1, 2, 3, 'tata', 4, 5, 6, 'titi', 7, 8, 9]
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })
    })

    it('should render a loop', (done) => {
      let data = {
        names: [
          'John',
          'Max',
          'Cre'
        ]
      }
      mustache.render('{% data.names %} * {{ data.names[i] }}{$PRINT$}{{%}}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          print: true,
          string: ' * $1 * $2 * $3',
          data: ['John', 'Max', 'Cre']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    it('should render a loop with condition', (done) => {
      let data = {
        names: [
          'John',
          'Max',
          'Cre'
        ]
      }
      mustache.render('{% data.names %}{{ data.names[i] }}{# data.names[i+1] !== undefined #}, {{#}}{{%}}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          string: '$1, $2, $3',
          data: ['John', 'Max', 'Cre']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    it('should render a loop in a loop', (done) => {
      let data = {
        persons: [{
          age: 18,
          names: ['Cre', 'Patrick']
        }, {
          age: 16,
          names: ['John', 'Leo']
        }]
      }
      mustache.render('{% data.persons %}{{ data.persons[i].age }} |{% data.persons[i].names %} {{ data.persons[i].names[j] }}{{%}}{{%}}', data, (err, result) => {
        delete result.varIndex
        delete result.loopIndexes
        assert.strictEqual(err, null)
        let expected = {
          string: '$1 | $2 $3$4 | $5 $6',
          data: [18, 'Cre', 'Patrick', 16, 'John', 'Leo']
        }
        assert.deepStrictEqual(result, expected)
        done()
      })
    })

    describe('Hard replace', () => {
      it('should replace data directly', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        mustache.render('{{ data.firstname:hard }} {{ data.lastname:hard }}', data, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: 'John Doe',
            data: []
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should replace data directly only with hard extra token', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        mustache.render('{{ data.firstname:hard }} {{ data.lastname }}', data, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: 'John $1',
            data: ['Doe']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })
    })

    describe('Print', () => {
      it('should return print = true', (done) => {
        mustache.render('Coucou {$ PRINT $}', {}, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          assert.deepStrictEqual(result, {
            print: true,
            string: 'Coucou ',
            data: []
          })
          done()
        })
      })

      it('should return print = true', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe',
          where: true,
          id: 2
        }
        mustache.render('{$ PRINT $}SELECT{{ data.firstname}}::text as "firstname",{{ data.lastname}}::text as "lastname"{# data.where #}WHERE 1 = {{ data.id }}{{#}}', data, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          assert.deepStrictEqual(result, {
            string: 'SELECT$1::text as "firstname",$2::text as "lastname"WHERE 1 = $3',
            print: true,
            data: ['John', 'Doe', 2]
          })
          done()
        })
      })

      it('should return print = true', (done) => {
        let data = {
          lines: ['one', 'two', 'three']
        }
        mustache.render('{$ PRINT $}{% data.lines %}{{data.lines[i]}}{{%}}', data, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          assert.deepStrictEqual(result, {
            string: '$1$2$3',
            print: true,
            data: ['one', 'two', 'three']
          })
          done()
        })
      })
    })

    describe('Order by', () => {
      it('should render order by with model PK', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let model = ['array', {
          id: ['<<idAccount>>'],
          users: ['array', {
            id: ['<<idUser>>']
          }]
        }]
        mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data, model, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: '$1 $2ORDER BY "idAccount", "idUser"',
            data: ['John', 'Doe']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should ignore order by if model is undefined', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: '$1 $2',
            data: ['John', 'Doe']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should ignore order by if there is no PK', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let model = ['object', {
          firstname: ['<firstname>'],
          lastname: ['<lastname>']
        }]
        mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data, model, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: '$1 $2',
            data: ['John', 'Doe']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })

      it('should render order by at the right place', (done) => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let model = ['array', {
          id: ['<<idAccount>>'],
          users: ['array', {
            id: ['<<idUser>>']
          }]
        }]
        mustache.render('lala{{ data.firstname }} {$  ORDER BY  $} {{ data.lastname }}lala', data, model, (err, result) => {
          delete result.varIndex
          delete result.loopIndexes
          assert.strictEqual(err, null)
          let expected = {
            string: 'lala$1 ORDER BY "idAccount", "idUser" $2lala',
            data: ['John', 'Doe']
          }
          assert.deepStrictEqual(result, expected)
          done()
        })
      })
    })

    describe('Errors', () => {
      it('should throw an error when extra is unknown', (done) => {
        let data = {
          name: 'John'
        }
        mustache.render('Coucou {{ name:oups }}', data, (err) => {
          assert.notStrictEqual(err, null)
          done()
        })
      })

      it('should throw an error when eval of a variable does not work', (done) => {
        let data = {
          name: 'John'
        }
        mustache.render('Coucou {{ name }}', data, (err) => {
          assert.notStrictEqual(err, null)
          done()
        })
      })

      it('should throw an error when eval of a bad array does not work', (done) => {
        let data = {
          names: 4
        }
        mustache.render('Coucou {% data.names %}{{%}}', data, (err) => {
          assert.notStrictEqual(err, null)
          done()
        })
      })

      it('should throw an error when eval of a bad conditions does not work', (done) => {
        let data = {
          names: 4
        }
        mustache.render('Coucou {# koko < kiki #}{{#}}', data, (err) => {
          assert.notStrictEqual(err, null)
          done()
        })
      })
    })
  })
})
