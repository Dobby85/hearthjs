/* eslint-env mocha */
const mustache = require('../lib/mustache')
const assert = require('assert')

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

      it('should throw an error when bad closing tag 3', () => {
        const func = () => mustache.parse('Coucou {% myVar $}')
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
    it('should render simple variables', () => {
      let data = {
        firstname: 'John',
        lastname: 'Doe'
      }
      let result = mustache.render('Coucou {{ data.firstname }} {{ data.lastname }}', data)

      let expected = {
        string: 'Coucou $1 $2',
        data: ['John', 'Doe']
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should render constant', () => {
      let data = {
        firstname: 'John',
        lastname: 'Doe'
      }
      let result = mustache.render('{$ PRINT $}Coucou {{ data.firstname }} {{ data.lastname }}', data)

      let expected = {
        print: true,
        string: 'Coucou $1 $2',
        data: ['John', 'Doe']
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should not crash if same constant is render multiple times', () => {
      let data = {
        firstname: 'John'
      }
      let result = mustache.render('{$ PRINT $}Coucou {{ data.firstname }}{$PRINT$}{$    PRINT   $}', data)

      let expected = {
        print: true,
        string: 'Coucou $1',
        data: ['John']
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should render a condition', () => {
      let data = {
        age: 18
      }
      let result = mustache.render('{# data.age >= 18 #}Je suis {$PRINT$}majeur, {{ data.age }} ans{{#}}{# data.age < 18 #}Je suis mineur, {{ data.age }} ans{{#}}', data)

      let expected = {
        print: true,
        string: 'Je suis majeur, $1 ans',
        data: [18]
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should render a loop', () => {
      let data = {
        names: [
          'John',
          'Max',
          'Cre'
        ]
      }
      let result = mustache.render('{% data.names %} * {{ data.names[i] }}{$PRINT$}{{%}}', data)

      let expected = {
        print: true,
        string: ' * $1 * $2 * $3',
        data: ['John', 'Max', 'Cre']
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should render a loop with condition', () => {
      let data = {
        names: [
          'John',
          'Max',
          'Cre'
        ]
      }
      let result = mustache.render('{% data.names %}{{ data.names[i] }}{# data.names[i+1] !== undefined #}, {{#}}{{%}}', data)

      let expected = {
        string: '$1, $2, $3',
        data: ['John', 'Max', 'Cre']
      }
      assert.deepStrictEqual(result, expected)
    })

    it('should render a loop in a loop', () => {
      let data = {
        persons: [{
          age: 18,
          names: ['Cre', 'Patrick']
        }, {
          age: 16,
          names: ['John', 'Leo']
        }]
      }
      let result = mustache.render('{% data.persons %}{{ data.persons[i].age }} |{% data.persons[i].names %} {{ data.persons[i].names[j] }}{{%}}{{%}}', data)

      let expected = {
        string: '$1 | $2 $3$4 | $5 $6',
        data: [18, 'Cre', 'Patrick', 16, 'John', 'Leo']
      }
      assert.deepStrictEqual(result, expected)
    })

    describe('Hard replace', () => {
      it('should replace data directly', () => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let result = mustache.render('{{ data.firstname:hard }} {{ data.lastname:hard }}', data)

        let expected = {
          string: 'John Doe',
          data: []
        }
        assert.deepStrictEqual(result, expected)
      })

      it('should replace data directly only with hard extra token', () => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let result = mustache.render('{{ data.firstname:hard }} {{ data.lastname }}', data)

        let expected = {
          string: 'John $1',
          data: ['Doe']
        }
        assert.deepStrictEqual(result, expected)
      })
    })

    describe('Print', () => {
      it('should return print = true', () => {
        let result = mustache.render('Coucou {$ PRINT $}', {})
        assert.deepStrictEqual(result, {
          print: true,
          string: 'Coucou ',
          data: []
        })
      })

      it('should return print = true', () => {
        let data = {
          firstname: 'John',
          lastname: 'Doe',
          where: true,
          id: 2
        }
        let result = mustache.render('{$ PRINT $}SELECT{{ data.firstname}}::text as "firstname",{{ data.lastname}}::text as "lastname"{# data.where #}WHERE 1 = {{ data.id }}{{#}}', data)
        assert.deepStrictEqual(result, {
          string: 'SELECT$1::text as "firstname",$2::text as "lastname"WHERE 1 = $3',
          print: true,
          data: ['John', 'Doe', 2]
        })
      })

      it('should return print = true', () => {
        let data = {
          lines: ['one', 'two', 'three']
        }
        let result = mustache.render('{$ PRINT $}{% data.lines %}{{data.lines[i]}}{{%}}', data)
        assert.deepStrictEqual(result, {
          string: '$1$2$3',
          print: true,
          data: ['one', 'two', 'three']
        })
      })
    })

    describe('Order by', () => {
      it('should render order by with model PK', () => {
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
        let result = mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data, model)

        let expected = {
          string: '$1 $2ORDER BY "idAccount", "idUser"',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
      })

      it('should ignore order by if model is undefined', () => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let result = mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data)

        let expected = {
          string: '$1 $2',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
      })

      it('should ignore order by if there is no PK', () => {
        let data = {
          firstname: 'John',
          lastname: 'Doe'
        }
        let model = ['object', {
          firstname: ['<firstname>'],
          lastname: ['<lastname>']
        }]
        let result = mustache.render('{{ data.firstname }} {{ data.lastname }}{$  ORDER BY $}', data, model)

        let expected = {
          string: '$1 $2',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
      })

      it('should render order by at the right place', () => {
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
        let result = mustache.render('lala{{ data.firstname }} {$  ORDER BY  $} {{ data.lastname }}lala', data, model)

        let expected = {
          string: 'lala$1 ORDER BY "idAccount", "idUser" $2lala',
          data: ['John', 'Doe']
        }
        assert.deepStrictEqual(result, expected)
      })
    })

    describe('Errors', () => {
      it('should throw an error when extra is unknown', () => {
        let data = {
          name: 'John'
        }
        let func = () => mustache.render('Coucou {{ name:oups }}', data)
        assert.throws(func, Error)
      })

      it('should throw an error when eval of a variable does not work', () => {
        let data = {
          name: 'John'
        }
        let func = () => mustache.render('Coucou {{ name }}', data)
        assert.throws(func, Error)
      })

      it('should throw an error when eval of a bad array does not work', () => {
        let data = {
          names: 4
        }
        let func = () => mustache.render('Coucou {% data.names %}{{%}}', data)
        assert.throws(func, Error)
      })

      it('should throw an error when eval of a bad conditions does not work', () => {
        let data = {
          names: 4
        }
        let func = () => mustache.render('Coucou {# koko < kiki #}{{#}}', data)
        assert.throws(func, Error)
      })
    })
  })
})
