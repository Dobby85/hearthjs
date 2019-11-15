/* eslint-env mocha */
const converter = require('../lib/converter')
const assert = require('assert')

describe('Converter', () => {
  it('should not duplicate object containing Date object', () => {
    let model = [{
      id: ['<<idproduct>>'],
      dateCreated: ['<productdatecreated>'],
      subtype: {
        dateCreated: ['<subtypedatecreated>']
      }
    }]
    let data = [ { idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    { idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z'),
    },
    { idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z'),
    },
    { idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z'),
    },
    { idproduct: 2,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z'),
    },
    { idproduct: 3,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z'),
    } ]

    let result = converter.sqlToJson(model, data)
    assert.strictEqual(result.length, 3)
    assert.deepStrictEqual(result, [{
      id: 1,
      dateCreated: new Date('2014-03-21T23:00:00.000Z'),
      subtype: { dateCreated: new Date('2014-03-21T23:00:00.000Z') }
    }, {
      id: 2,
      dateCreated: new Date('2014-03-21T23:00:00.000Z'),
      subtype: { dateCreated: new Date('2014-03-21T23:00:00.000Z') }
    }, {
      id: 3,
      dateCreated: new Date('2014-03-21T23:00:00.000Z'),
      subtype: { dateCreated: new Date('2014-03-21T23:00:00.000Z') }
    }])
  })

  it('should make a simple object conversion', () => {
    let model = ['object', {
      id: ['<<id>>'],
      name: ['<name>']
    }]
    let data = [{ id: 1, name: 'A1' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      id: 1,
      name: 'A1'
    })
  })

  it('should make a simple undetails object conversion', () => {
    let model = {
      id: ['<<id>>'],
      name: ['<name>']
    }
    let data = [{ id: 1, name: 'A1' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      id: 1,
      name: 'A1'
    })
  })

  it('should make a simple array conversion', () => {
    let model = ['array', {
      id: ['<<id>>'],
      name: ['<name>']
    }]
    let data = [{ id: 1, name: 'A1' }, { id: 2, name: 'A2' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1'
    }, {
      id: 2,
      name: 'A2'
    }])
  })

  it('should make a simple undetails array conversion', () => {
    let model = [{
      id: ['<<id>>'],
      name: ['<name>']
    }]
    let data = [{ id: 1, name: 'A1' }, { id: 2, name: 'A2' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1'
    }, {
      id: 2,
      name: 'A2'
    }])
  })

  it('should make conversion of an array in another array', () => {
    let model = ['array', {
      id: ['<<idAccount>>'],
      name: ['<name>'],
      users: ['array', {
        id: ['<<idUser>>'],
        mail: ['<mail>']
      }]
    }]
    let data = [{ name: 'A1', idAccount: 1, mail: 'a.a', idUser: 1 },
      { name: 'A1', idAccount: 1, mail: 'a.b', idUser: 2 },
      { name: 'A1', idAccount: 1, mail: 'a.c', idUser: 3 },
      { name: 'A2', idAccount: 2, mail: 'b.a', idUser: 4 },
      { name: 'A2', idAccount: 2, mail: 'b.b', idUser: 5 }]
    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1',
      users: [{ id: 1, mail: 'a.a' }, { id: 2, mail: 'a.b' }, { id: 3, mail: 'a.c' }]
    }, {
      id: 2,
      name: 'A2',
      users: [{ id: 4, mail: 'b.a' }, { id: 5, mail: 'b.b' }]
    }])
  })

  it('should make conversion of an undetails array in another undetails array', () => {
    let model = [{
      id: ['<<idAccount>>'],
      name: ['<name>'],
      users: [{
        id: ['<<idUser>>'],
        mail: ['<mail>']
      }]
    }]
    let data = [{ name: 'A1', idAccount: 1, mail: 'a.a', idUser: 1 },
      { name: 'A1', idAccount: 1, mail: 'a.b', idUser: 2 },
      { name: 'A1', idAccount: 1, mail: 'a.c', idUser: 3 },
      { name: 'A2', idAccount: 2, mail: 'b.a', idUser: 4 },
      { name: 'A2', idAccount: 2, mail: 'b.b', idUser: 5 }]
    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1',
      users: [{ id: 1, mail: 'a.a' }, { id: 2, mail: 'a.b' }, { id: 3, mail: 'a.c' }]
    }, {
      id: 2,
      name: 'A2',
      users: [{ id: 4, mail: 'b.a' }, { id: 5, mail: 'b.b' }]
    }])
  })

  it('should convert an object in an object', () => {
    let model = ['object', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: ['object', {
        id: ['<<idParent>>'],
        mail: ['<mailParent>'],
        idAccount: ['<parentIdAccount>']
      }]
    }]
    let data = [{ idUser: 1, mailUser: 'a.a', userIdAccount: 1, idParent: 2, mailParent: 'b.b', parentIdAccount: 1 }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, { id: 1, mail: 'a.a', idAccount: 1, parent: { id: 2, mail: 'b.b', idAccount: 1 } })
  })

  it('should convert an undetails object in an undetails object', () => {
    let model = {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: {
        id: ['<<idParent>>'],
        mail: ['<mailParent>'],
        idAccount: ['<parentIdAccount>']
      }
    }
    let data = [{ idUser: 1, mailUser: 'a.a', userIdAccount: 1, idParent: 2, mailParent: 'b.b', parentIdAccount: 1 }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, { id: 1, mail: 'a.a', idAccount: 1, parent: { id: 2, mail: 'b.b', idAccount: 1 } })
  })

  it('should convert an array of object', () => {
    let model = ['array', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: ['object', {
        id: ['<<idParent>>'],
        mail: ['<mailParent>'],
        idAccount: ['<parentIdAccount>']
      }]
    }]
    let data = [{ idUser: 1, mailUser: 'a.a', userIdAccount: 1, idParent: 2, mailParent: 'b.b', parentIdAccount: 1 },
      { idUser: 2, mailUser: 'a.b', userIdAccount: 1, idParent: 3, mailParent: 'a.c', parentIdAccount: 1 },
      { idUser: 5, mailUser: 'b.b', userIdAccount: 2, idParent: null, mailParent: null, parentIdAccount: null }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{ id: 1, mail: 'a.a', idAccount: 1, parent: { id: 2, mail: 'b.b', idAccount: 1 } },
      { id: 2, mail: 'a.b', idAccount: 1, parent: { id: 3, mail: 'a.c', idAccount: 1 } },
      { id: 5, mail: 'b.b', idAccount: 2, parent: { id: null, mail: null, idAccount: null } }])
  })

  it('should convert an undetails array of undetails object', () => {
    let model = [{
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: {
        id: ['<<idParent>>'],
        mail: ['<mailParent>'],
        idAccount: ['<parentIdAccount>']
      }
    }]
    let data = [{ idUser: 1, mailUser: 'a.a', userIdAccount: 1, idParent: 2, mailParent: 'b.b', parentIdAccount: 1 },
      { idUser: 2, mailUser: 'a.b', userIdAccount: 1, idParent: 3, mailParent: 'a.c', parentIdAccount: 1 },
      { idUser: 5, mailUser: 'b.b', userIdAccount: 2, idParent: null, mailParent: null, parentIdAccount: null }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{ id: 1, mail: 'a.a', idAccount: 1, parent: { id: 2, mail: 'b.b', idAccount: 1 } },
      { id: 2, mail: 'a.b', idAccount: 1, parent: { id: 3, mail: 'a.c', idAccount: 1 } },
      { id: 5, mail: 'b.b', idAccount: 2, parent: { id: null, mail: null, idAccount: null } }])
  })

  it('should return an empty array when there is no data', () => {
    let model = ['array', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>']
    }]
    let data = []

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [])
  })

  it('should return an empty object when there is no data', () => {
    let model = ['object', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>']
    }]
    let data = []

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {})
  })

  it('should return an empty object when there is wrong data', () => {
    let model = ['object', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>']
    }]
    let data = [{ id: 1, mail: 'a.a', idAccount: 3 }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {})
  })

  it('should set null value', () => {
    let model = ['object', {
      id: ['<<idUser>>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>']
    }]
    let data = [{ idUser: 1, mailUser: null, userIdAccount: null }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      id: 1,
      mail: null,
      idAccount: null
    })
  })

  it('should convert an array of array with array', () => {
    let model = ['array', {
      id: ['<<idAccount>>'],
      name: ['<accountName>'],
      users: ['array', {
        id: ['<<idUser>>'],
        mail: ['<mailUser>'],
        relations: ['array', {
          id: ['<<idUserRelation>>'],
          mail: ['<mailUserRelation>']
        }]
      }]
    }]
    let data = [{ idUser: 1, mailUser: 'a.a', idAccount: 1, accountName: 'A1', idUserRelation: 3, mailUserRelation: 'a.c' },
      { idUser: 1, mailUser: 'a.a', idAccount: 1, accountName: 'A1', idUserRelation: 5, mailUserRelation: 'b.b' },
      { idUser: 2, mailUser: 'a.b', idAccount: 1, accountName: 'A1', idUserRelation: 1, mailUserRelation: 'a.a' },
      { idUser: 3, mailUser: 'a.c', idAccount: 1, accountName: 'A1', idUserRelation: 2, mailUserRelation: 'a.b' },
      { idUser: 3, mailUser: 'a.c', idAccount: 1, accountName: 'A1', idUserRelation: 4, mailUserRelation: 'b.a' },
      { idUser: 4, mailUser: 'b.a', idAccount: 2, accountName: 'A2', idUserRelation: 5, mailUserRelation: 'b.b' },
      { idUser: 5, mailUser: 'b.b', idAccount: 2, accountName: 'A2', idUserRelation: 1, mailUserRelation: 'a.a' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1',
      users: [{
        id: 1,
        mail: 'a.a',
        relations: [{ id: 3, mail: 'a.c' }, { id: 5, mail: 'b.b' }]
      }, {
        id: 2,
        mail: 'a.b',
        relations: [{ id: 1, mail: 'a.a' }]
      }, {
        id: 3,
        mail: 'a.c',
        relations: [{ id: 2, mail: 'a.b' }, { id: 4, mail: 'b.a' }]
      }]
    }, {
      id: 2,
      name: 'A2',
      users: [{
        id: 4,
        mail: 'b.a',
        relations: [{ id: 5, mail: 'b.b' }]
      }, {
        id: 5,
        mail: 'b.b',
        relations: [{ id: 1, mail: 'a.a' }]
      }]
    }])
  })

  it('should convert an undetails array of undetails array with undetails array', () => {
    let model = [{
      id: ['<<idAccount>>'],
      name: ['<accountName>'],
      users: [{
        id: ['<<idUser>>'],
        mail: ['<mailUser>'],
        relations: [{
          id: ['<<idUserRelation>>'],
          mail: ['<mailUserRelation>']
        }]
      }]
    }]
    let data = [{ idUser: 1, mailUser: 'a.a', idAccount: 1, accountName: 'A1', idUserRelation: 3, mailUserRelation: 'a.c' },
      { idUser: 1, mailUser: 'a.a', idAccount: 1, accountName: 'A1', idUserRelation: 5, mailUserRelation: 'b.b' },
      { idUser: 2, mailUser: 'a.b', idAccount: 1, accountName: 'A1', idUserRelation: 1, mailUserRelation: 'a.a' },
      { idUser: 3, mailUser: 'a.c', idAccount: 1, accountName: 'A1', idUserRelation: 2, mailUserRelation: 'a.b' },
      { idUser: 3, mailUser: 'a.c', idAccount: 1, accountName: 'A1', idUserRelation: 4, mailUserRelation: 'b.a' },
      { idUser: 4, mailUser: 'b.a', idAccount: 2, accountName: 'A2', idUserRelation: 5, mailUserRelation: 'b.b' },
      { idUser: 5, mailUser: 'b.b', idAccount: 2, accountName: 'A2', idUserRelation: 1, mailUserRelation: 'a.a' }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1',
      users: [{
        id: 1,
        mail: 'a.a',
        relations: [{ id: 3, mail: 'a.c' }, { id: 5, mail: 'b.b' }]
      }, {
        id: 2,
        mail: 'a.b',
        relations: [{ id: 1, mail: 'a.a' }]
      }, {
        id: 3,
        mail: 'a.c',
        relations: [{ id: 2, mail: 'a.b' }, { id: 4, mail: 'b.a' }]
      }]
    }, {
      id: 2,
      name: 'A2',
      users: [{
        id: 4,
        mail: 'b.a',
        relations: [{ id: 5, mail: 'b.b' }]
      }, {
        id: 5,
        mail: 'b.b',
        relations: [{ id: 1, mail: 'a.a' }]
      }]
    }])
  })

  describe('Get model primary keys', () => {
    it('should return one PK', () => {
      let model = ['array', {
        id: ['<<myPK>>'],
        name: ['<name>']
      }]
      let keys = converter.getModelPrimaryKeys(model)
      assert.deepStrictEqual(keys, ['myPK'])
    })

    it('should return one PK for an undetails array', () => {
      let model = [{
        id: ['<<myPK>>'],
        name: ['<name>']
      }]
      let keys = converter.getModelPrimaryKeys(model)
      assert.deepStrictEqual(keys, ['myPK'])
    })

    it('should return no PK', () => {
      let model = ['object', {
        id: ['<myPK>'],
        name: ['<name>']
      }]
      let keys = converter.getModelPrimaryKeys(model)
      assert.deepStrictEqual(keys, [])
    })

    it('should return a list of PK', () => {
      let model = ['array', {
        id: ['<<idAccount>>'],
        name: ['<name>'],
        users: ['array', {
          id: ['<<idUser>>'],
          mail: ['<mail>'],
          nested: ['array', {
            id: ['<<idNested>>'],
            renested: ['array', {
              id: ['<<idReNested>>']
            }]
          }]
        }]
      }]
      let keys = converter.getModelPrimaryKeys(model)
      assert.deepStrictEqual(keys, ['idAccount', 'idUser', 'idNested', 'idReNested'])
    })

    it('should return a list of PK for multiple undetails arrays', () => {
      let model = [{
        id: ['<<idAccount>>'],
        name: ['<name>'],
        users: [{
          id: ['<<idUser>>'],
          mail: ['<mail>'],
          nested: [{
            id: ['<<idNested>>'],
            renested: [{
              id: ['<<idReNested>>']
            }]
          }]
        }]
      }]
      let keys = converter.getModelPrimaryKeys(model)
      assert.deepStrictEqual(keys, ['idAccount', 'idUser', 'idNested', 'idReNested'])
    })
  })

  describe('Get column info', () => {
    describe('Get name', () => {
      it('should return object type', () => {
        let result = converter._getColumnInfo(['object', {}], false)
        assert.strictEqual(result, 'TYPE_OBJECT')
      })

      it('should return array type', () => {
        let result = converter._getColumnInfo(['array', {}], false)
        assert.strictEqual(result, 'TYPE_ARRAY')
      })

      it('should return column name without simple <>', () => {
        let result = converter._getColumnInfo(['<id>'], false)
        assert.strictEqual(result, 'id')
      })

      it('should return column name without double <>', () => {
        let result = converter._getColumnInfo(['<<column>>'], false)
        assert.strictEqual(result, 'column')
      })
    })

    describe('Get type', () => {
      it('should return object type', () => {
        let result = converter._getColumnInfo({}, false)
        assert.strictEqual(result, 'TYPE_OBJECT')
      })

      it('should return array type', () => {
        let result = converter._getColumnInfo([{}], false)
        assert.strictEqual(result, 'TYPE_ARRAY')
      })

      it('should return null type', () => {
        let result = converter._getColumnInfo([], false)
        assert.strictEqual(result, null)
      })

      it('should return object type', () => {
        let result = converter._getColumnInfo(['object', {}], false)
        assert(result === 'TYPE_OBJECT')
      })

      it('should return array type', () => {
        let result = converter._getColumnInfo(['array', {}], false)
        assert(result === 'TYPE_ARRAY')
      })

      it('should return array type 2', () => {
        let result = converter._getColumnInfo(['array', {}, '>=', 3], false)
        assert(result === 'TYPE_ARRAY')
      })

      it('should return key type', () => {
        let result = converter._getColumnInfo(['<column>'], true)
        assert.strictEqual(result, 'TYPE_KEY')
      })

      it('should return primary key type', () => {
        let result = converter._getColumnInfo(['<<column>>'], true)
        assert.strictEqual(result, 'TYPE_PRIMARY_KEY')
      })
    })
  })
})
