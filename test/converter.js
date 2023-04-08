/* eslint-env mocha */
const converter = require('../lib/converter')
const assert = require('assert')

describe('Converter', () => {
  it('should set right data when using UNION in query', () => {
    let model = {
      id: ['<idproduct>'],
      value: ['<value>']
    }
    let data = [{
      idproduct: 1,
      value: null
    },
    {
      idproduct: null,
      value: 5
    }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      id: 1,
      value: 5
    })
  })

  it('should not duplicate object containing Date object', () => {
    let model = [{
      id: ['<<idproduct>>'],
      dateCreated: ['<productdatecreated>'],
      subtype: {
        dateCreated: ['<subtypedatecreated>']
      }
    }]
    let data = [{
      idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    {
      idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    {
      idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    {
      idproduct: 1,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    {
      idproduct: 2,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    },
    {
      idproduct: 3,
      productdatecreated: new Date('2014-03-21T23:00:00.000Z'),
      subtypedatecreated: new Date('2014-03-21T23:00:00.000Z')
    }]

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

  it('should not duplicate object containing object (Column of type JSONB)', () => {
    let model = [{
      id: ['<<idproduct>>'],
      carrier: ['<carrier>'],
      subtype: {
        subCarrier: ['<subcarrier>']
      }
    }]
    let data = [{
      idproduct: 1,
      carrier: { id: 1 },
      subcarrier: { id: 4 }
    },
    {
      idproduct: 1,
      carrier: { id: 1 },
      subcarrier: { id: 4 }
    },
    {
      idproduct: 1,
      carrier: { id: 1 },
      subcarrier: { id: 4 }
    },
    {
      idproduct: 1,
      carrier: { id: 1 },
      subcarrier: { id: 4 }
    },
    {
      idproduct: 2,
      carrier: { id: 'toto', sub: { id: 6 } },
      subcarrier: {}
    },
    {
      idproduct: 3,
      carrier: { id: 'toto', sub: { id: 6 } },
      subcarrier: {}
    }]

    let result = converter.sqlToJson(model, data)
    assert.strictEqual(result.length, 3)
    assert.deepStrictEqual(result, [{
      id: 1,
      carrier: { id: 1 },
      subtype: { subCarrier: { id: 4 } }
    }, {
      id: 2,
      carrier: { id: 'toto', sub: { id: 6 } },
      subtype: { subCarrier: {} }
    }, {
      id: 3,
      carrier: { id: 'toto', sub: { id: 6 } },
      subtype: { subCarrier: {} }
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
      id: ['<id>'],
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

  it('should not push object with only null values', () => {
    let model = [{
      id: ['<<id>>'],
      name: ['<name>']
    }]
    let data = [{ id: 1, name: 'A1' }, { id: 2, name: null }, { id: null, name: null }]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1'
    }, {
      id: 2,
      name: null
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

  it('should convert an object with array', () => {
    let model = {
      id: ['<idAccount>'],
      name: ['<name>'],
      users: ['array', {
        id: ['<<idUser>>'],
        mail: ['<mail>']
      }]
    }
    let data = [{ name: 'A1', idAccount: 1, mail: 'a@a', idUser: 1 },
    { name: 'A1', idAccount: 1, mail: 'b@b', idUser: 2 },
    { name: 'A1', idAccount: 1, mail: 'c@c', idUser: 3 }]
    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      id: 1,
      name: 'A1',
      users: [
        { id: 1, mail: 'a@a' },
        { id: 2, mail: 'b@b' },
        { id: 3, mail: 'c@c' }
      ]
    })
  })

  it('should push zero object in sub array if all users are null', () => {
    let model = ['array', {
      id: ['<<idAccount>>'],
      name: ['<name>'],
      users: ['array', {
        id: ['<<idUser>>'],
        mail: ['<mail>']
      }]
    }]
    let data = [{ name: 'A1', idAccount: 1, mail: null, idUser: null },
    { name: 'A1', idAccount: 1, mail: null, idUser: null },
    { name: 'A1', idAccount: 1, mail: null, idUser: null },
    { name: 'A2', idAccount: 2, mail: null, idUser: null },
    { name: 'A2', idAccount: 2, mail: null, idUser: null }]
    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [{
      id: 1,
      name: 'A1',
      users: []
    }, {
      id: 2,
      name: 'A2',
      users: []
    }])
  })

  it('should push zero values in first array if everything is null', () => {
    let model = ['array', {
      id: ['<<idAccount>>'],
      name: ['<name>'],
      users: ['array', {
        id: ['<<idUser>>'],
        mail: ['<mail>']
      }]
    }]
    let data = [{ name: null, idAccount: null, mail: null, idUser: null }]
    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, [])
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
      id: ['<idUser>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: ['object', {
        id: ['<idParent>'],
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
      id: ['<idUser>'],
      mail: ['<mailUser>'],
      idAccount: ['<userIdAccount>'],
      parent: {
        id: ['<idParent>'],
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
        id: ['<idParent>>'],
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
        id: ['<idParent>'],
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
      id: ['<idUser>'],
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

  it('should convert a complex object with total', () => {
    let model = {
      total: ['<total>'],
      products: [{
        id: ['<<idProduct>>'],
        name: ['<productName>'],
        medals: [{
          id: ['<<idMedals>>'],
          city: ['<cityMedals>']
        }],
        foods: [{
          id: ['<<idFood>>'],
          label: ['<labelFood>']
        }],
        caracteristic: {
          weight: ['<weight>'],
          labels: [{
            id: ['<<idLabel>>'],
            name: ['<nameLabel>']
          }]
        }
      }]
    }
    let data = [
      { total:    2, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, cityMedals:   'Aizenay', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, cityMedals:      'Coex', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 1, labelFood:   'Poulet', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 1, nameLabel: 'Or' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, cityMedals:     'Maché', idFood: 2, labelFood:    'Boeuf', weight: 10, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, cityMedals: 'St Gilles', idFood: 6, labelFood: 'Apéritif', weight: 12, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, cityMedals: 'St Gilles', idFood: 6, labelFood: 'Apéritif', weight: 12, idLabel: 3, nameLabel: 'Bronze' },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 5, cityMedals:  'Thorigny', idFood: 6, labelFood: 'Apéritif', weight: 12, idLabel: 2, nameLabel: 'Argent' },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 5, cityMedals:  'Thorigny', idFood: 6, labelFood: 'Apéritif', weight: 12, idLabel: 3, nameLabel: 'Bronze' },
    ]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      total: 2,
      products: [{
        id: 1,
        name: 'Product 1',
        medals: [
          { id: 1, city: 'Aizenay' },
          { id: 2, city: 'Coex' },
          { id: 3, city: 'Maché' }
        ],
        foods: [
          { id: 1, label: 'Poulet' },
          { id: 2, label: 'Boeuf' }
        ],
        caracteristic: {
          weight: 10,
          labels: [
            { id: 1, name: 'Or' },
            { id: 2, name: 'Argent' },
            { id: 3, name: 'Bronze' }
          ]
        }
      }, {
        id: 2,
        name: 'Product 2',
        medals: [
          { id: 4, city: 'St Gilles' },
          { id: 5, city: 'Thorigny' }
        ],
        foods: [
          { id: 6, label: 'Apéritif' }
        ],
        caracteristic: {
          weight: 12,
          labels: [
            { id: 2, name: 'Argent' },
            { id: 3, name: 'Bronze' }
          ]
        }
      }]
    })
  })

  it('should convert a complex object with total #2', () => {
    let model = {
      total: ['<total>'],
      products: [{
        id: ['<<idProduct>>'],
        name: ['<productName>'],
        medals: [{
          id: ['<<idMedals>>'],
          first: {
            second: {
              third: {
                data: [{
                  id: ['<<idData>>']
                }]
              }
            }
          },
        }],
        foods: [{
          id: ['<<idFood>>'],
          first: {
            fourth: {
              data: [{
                id: ['<<idData2>>']
              }]
            }
          }
        }]
      }]
    }
    let data = [
      { total:    2, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 1, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 2, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 3, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 4, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 5, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 6, idFood: 1, idData2: 10 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 1, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 2, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 3, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 4, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 5, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 6, idFood: 1, idData2: 11 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 1, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 2, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 3, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 4, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 5, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 6, idFood: 2, idData2: 12 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 1, idFood: 2, idData2: 13 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 1, idData: 2, idFood: 2, idData2: 13 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 3, idFood: 2, idData2: 13 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 2, idData: 4, idFood: 2, idData2: 13 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 5, idFood: 2, idData2: 13 },
      { total: null, idProduct: 1, productName: 'Product 1', idMedals: 3, idData: 6, idFood: 2, idData2: 13 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 3, idData: 5, idFood: 1, idData2: 12 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 3, idData: 7, idFood: 1, idData2: 12 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, idData: 6, idFood: 1, idData2: 12 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, idData: 8, idFood: 1, idData2: 12 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 3, idData: 5, idFood: 1, idData2: 13 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 3, idData: 7, idFood: 1, idData2: 13 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, idData: 6, idFood: 1, idData2: 13 },
      { total: null, idProduct: 2, productName: 'Product 2', idMedals: 4, idData: 8, idFood: 1, idData2: 13 },
    ]

    let result = converter.sqlToJson(model, data)
    assert.deepStrictEqual(result, {
      total: 2,
      products: [{
        id: 1,
        name: 'Product 1',
        medals: [
          { id: 1, first: { second: { third: { data: [{ id: 1 }, { id: 2 } ] } } } },
          { id: 2, first: { second: { third: { data: [{ id: 3 }, { id: 4 } ] } } } },
          { id: 3, first: { second: { third: { data: [{ id: 5 }, { id: 6 } ] } } } }
        ],
        foods: [
          { id: 1, first: { fourth: { data: [{ id: 10 }, { id: 11 }] } } },
          { id: 2, first: { fourth: { data: [{ id: 12 }, { id: 13 }] } } }
        ]
      }, {
        id: 2,
        name: 'Product 2',
        medals: [
          { id: 3, first: { second: { third: { data: [{ id: 5 }, { id: 7 } ] } } } },
          { id: 4, first: { second: { third: { data: [{ id: 6 }, { id: 8 } ] } } } }
        ],
        foods: [
          { id: 1, first: { fourth: { data: [{ id: 12 }, { id: 13 }] } } }
        ]
      }]
    })
  })

  it('should convert deep object', () => {
    let model = {
      first: {
        second: {
          third: {
            fourth: {
              fourthData: ['<fourth>'],
              fourthData2: ['<fourth2>'],
              fifth: {
                data: ['<data>']
              }
            }
          }
        }
      }
    }
    let data = [
      { fourth: 1, fourth2: 2, data: 3 }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, {
      first: { second: { third: { fourth: { fourthData: 1, fourthData2: 2, fifth: { data: 3 } } } } }
    })
  })

  it('should convert an array of deep object', () => {
    let model = [{
      id: ['<<idModel>>'],
      first: {
        second: {
          third: {
            fourth: {
              fourthData: ['<fourth>'],
              fourthData2: ['<fourth2>'],
              fifth: {
                data: ['<data>']
              }
            }
          }
        }
      }
    }]
    let data = [
      { idModel: 1, fourth: 1, fourth2: 2, data: 3 },
      { idModel: 2, fourth: 4, fourth2: 5, data: 6 },
      { idModel: 3, fourth: 7, fourth2: 8, data: 9 }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, [{
      id: 1,
      first: { second: { third: { fourth: { fourthData: 1, fourthData2: 2, fifth: { data: 3 } } } } }
    }, {
      id: 2,
      first: { second: { third: { fourth: { fourthData: 4, fourthData2: 5, fifth: { data: 6 } } } } }
    }, {
      id: 3,
      first: { second: { third: { fourth: { fourthData: 7, fourthData2: 8, fifth: { data: 9 } } } } }
    }])
  })

  it('should convert an array of deep object with arrays', () => {
    let model = [{
      id: ['<<idModel>>'],
      first: {
        second: {
          third: {
            fourth: {
              array1: [{
                idArray1: ['<<idArray1>>'],
                name1: ['<name1>']
              }],
              fifth: {
                array2: [{
                  idArray2: ['<<idArray2>>'],
                  name2: ['<name2>']
                }]
              }
            }
          }
        }
      }
    }]
    let data = [
      { idModel: 1, idArray1: 1, name1: 'Name 1.1', idArray2: 3, name2: 'Name 1.1.1' },
      { idModel: 1, idArray1: 1, name1: 'Name 1.1', idArray2: 4, name2: 'Name 1.1.2' },
      { idModel: 1, idArray1: 1, name1: 'Name 1.1', idArray2: 5, name2: 'Name 1.1.3' },
      { idModel: 1, idArray1: 2, name1: 'Name 1.2', idArray2: 3, name2: 'Name 1.1.1' },
      { idModel: 1, idArray1: 2, name1: 'Name 1.2', idArray2: 4, name2: 'Name 1.1.2' },
      { idModel: 1, idArray1: 2, name1: 'Name 1.2', idArray2: 5, name2: 'Name 1.1.3' },
      { idModel: 2, idArray1: 2, name1: 'Name 2.1', idArray2: 6, name2: 'Name 2.1.1' },
      { idModel: 2, idArray1: 2, name1: 'Name 2.1', idArray2: 7, name2: 'Name 2.1.2' }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, [{
      id: 1,
      first: { second: { third: { fourth: { array1: [{ idArray1: 1, name1: 'Name 1.1' }, { idArray1: 2, name1: 'Name 1.2' }], fifth: { array2: [
        { idArray2: 3, name2: 'Name 1.1.1' },
        { idArray2: 4, name2: 'Name 1.1.2' },
        { idArray2: 5, name2: 'Name 1.1.3' }
      ] } } } } }
    }, {
      id: 2,
      first: { second: { third: { fourth: { array1: [{ idArray1: 2, name1: 'Name 2.1' }], fifth: { array2: [
        { idArray2: 6, name2: 'Name 2.1.1' },
        { idArray2: 7, name2: 'Name 2.1.2' }
      ] } } } } }
    }])
  })

  it('should work with the same key for two different ids', () => {
    let model = [{
      id: ['<<id>>'],
      arr: [{
        id: ['<<idArr>>'],
        name: ['<name>']
      }],
      obj: {
        arr: [{
          id: ['<<idArr2>>'],
          name: ['<name2>']
        }],
      }
    }]
    let data = [
      { id: 1, idArr: 5, name: 'Test'  , idArr2: 10, name2: 'Name' },
      { id: 1, idArr: 6, name: 'Test 2', idArr2: 10, name2: 'Name' },
      { id: 1, idArr: 7, name: 'Test 3', idArr2: 10, name2: 'Name' },
      { id: 2, idArr: 7, name: 'Test 3', idArr2: 11, name2: 'Name 2' },
      { id: 2, idArr: 8, name: 'Test 4', idArr2: 11, name2: 'Name 2' },
      { id: 2, idArr: 9, name: 'Test 5', idArr2: 11, name2: 'Name 2' }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, [
      {
        id: 1,
        arr: [
          { id: 5, name: 'Test' },
          { id: 6, name: 'Test 2' },
          { id: 7, name: 'Test 3' }
        ],
        obj: {
          arr: [ { id: 10, name: 'Name' } ]
        }
      },
      {
        id: 2,
        arr: [
          { id: 7, name: 'Test 3' },
          { id: 8, name: 'Test 4' },
          { id: 9, name: 'Test 5' }
        ],
        obj: { arr: [ { id: 11, name: 'Name 2' } ] }
      }
    ])
  })

  it('should work with the same key for two different ids (big dataset)', () => {
    let model = [{
      id: ['<<id>>'],
      idContentLabel: [{ value: ['<<label>>'], lang: ['<labellang>'] }],
      nbUsed: ['<nbusedvariation>'],
      detail: [{
        id: ['<<variationdetailid>>'],
        key: ['<key>'],
        idContentLabel: [{ value: ['<<detaillabel>>'], lang: ['<detaillabellang>'] }],
        nbUsed: ['<nbusedvariationdetail>']
      }]
    }]
    let data = [
      { id: 1, label: 'New variation', labellang: 2, variationdetailid: 1, key: 'KEY3', detaillabel: 'Key 3', detaillabellang: 2, nbusedvariation: 0, nbusedvariationdetail: 0 },
      { id: 1, label: 'New variation', labellang: 2, variationdetailid: 2, key: 'KEY2', detaillabel: 'Key 2', detaillabellang: 2, nbusedvariation: 0, nbusedvariationdetail: 0 },
      { id: 1, label: 'New variation', labellang: 2, variationdetailid: 3, key: 'KEY1', detaillabel: 'Key 1', detaillabellang: 2, nbusedvariation: 0, nbusedvariationdetail: 0 },
      { id: 1000, label: 'Size', labellang: 2, variationdetailid: 1000, key: 'XS', detaillabel: 'XS', detaillabellang: 2, nbusedvariation: 3, nbusedvariationdetail: 6 },
      { id: 1000, label: 'Size', labellang: 2, variationdetailid: 1001, key: 'M', detaillabel: 'M', detaillabellang: 2, nbusedvariation: 3, nbusedvariationdetail: 4 },
      { id: 1000, label: 'Size', labellang: 2, variationdetailid: 1002, key: 'L', detaillabel: 'L', detaillabellang: 2, nbusedvariation: 3, nbusedvariationdetail: 4 },
      { id: 1000, label: 'Size', labellang: 2, variationdetailid: 1003, key: 'XL', detaillabel: 'XL', detaillabellang: 2, nbusedvariation: 3, nbusedvariationdetail: 3 }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, [{
      id: 1,
      idContentLabel: [
        { value: 'New variation', lang: 2 }
      ],
      detail: [{
        id: 1,
        idContentLabel: [
          { value: 'Key 3', lang: 2 }
        ],
        key: 'KEY3',
        nbUsed: 0
      }, {
        id: 2,
        idContentLabel: [
          { value: 'Key 2', lang: 2 }
        ],
        key: 'KEY2',
        nbUsed: 0
      }, {
        id: 3,
        idContentLabel: [
          { value: 'Key 1', lang: 2 }
        ],
        key: 'KEY1',
        nbUsed: 0
      }],
      nbUsed: 0
    }, {
      id: 1000,
      idContentLabel: [
        { value: 'Size', lang: 2 }
      ],
      detail: [{
        id: 1000,
        idContentLabel: [
          { value: 'XS', lang: 2 }
        ],
        key: 'XS',
        nbUsed: 6
      }, {
        id: 1001,
        idContentLabel: [
          { value: 'M', lang: 2 }
        ],
        key: 'M',
        nbUsed: 4
      }, {
        id: 1002,
        idContentLabel: [
          { value: 'L', lang: 2 }
        ],
        key: 'L',
        nbUsed: 4
      }, {
        id: 1003,
        idContentLabel: [
          { value: 'XL', lang: 2 }
        ],
        key: 'XL',
        nbUsed: 3
      }],
      nbUsed: 3
    }])
  })

  it('should convert a big object and not push value in array if PK is null', () => {
    let data = [
      { nbproducts: null, id: 8, productorder: 6, productnumberofvariation: 0, productisvalid: false, productdatecreated: '2014-03-25T00:00:00.000Z', productdatedeleted: '-Infinity', tagid: null, tagkey: null, taglabel: null, taglang: null, idvariation1: null, labelvariation1: null, labellangvariation1: null, idvariation2: null, labelvariation2: null, labellangvariation2: null, idvariation3: null, labelvariation3: null, labellangvariation3: null, variationdetailid1: null, variationdetailkey1: null, variationdetaillabel1: null, variationdetaillabellang1: null, variationdetailid2: null, variationdetailkey2: null, variationdetaillabel2: null, variationdetaillabellang2: null, variationdetailid3: null, variationdetailkey3: null, variationdetaillabel3: null, variationdetaillabellang3: null, declinationvariationdetailid1: null, declinationvariationdetailkey1: null, declinationvariationdetaillabel1: null, declinationvariationdetaillabellang1: null, declinationvariationdetailid2: null, declinationvariationdetailkey2: null, declinationvariationdetaillabel2: null, declinationvariationdetaillabellang2: null, declinationvariationdetailid3: null, declinationvariationdetailkey3: null, declinationvariationdetaillabel3: null, declinationvariationdetaillabellang3: null, vintagedescription: 'Product 7 desc', vintagedescriptionlang: 2, vintageid: 11, vintageisvalid: true, canBeSoldAlone: true, vintagedatecreated: '2014-03-19T00:00:00.000Z', vintagedatedeleted: '-Infinity', idSite: 1000, year: 2018, sku: '', setquantity: false, quantity: 100, sellByMultipleOf: 1, alcoholLevel: 15, temperatureMin: 8, temperatureMax: 9, capacity: 75, capacityUnit: 'CENTILITRE', keepYearMin: 2029, keepYearMax: -1, weight: 3.2, vintageorder: 9, idReferenceProduct: 11, kindid: 111, kindcolor: '#97000B', kindlabel: 'Red', kindlabellang: 2, isVintage: true, productwinetype: 'WINE', name: 'Wine 2', namelang: 2, description: 'Wine 2 description', descriptionlang: 2, idtype: 1, type: 'WINE', typelabel: 'Wine bottle', typelabellang: 2, productprice: 16, tvavalue: 19.6, imagealt: null, imagealtlang: null, imagefilename: null, imageorder: null, idimage: null, productdetailstypeid: null, productdetailstypetype: null, productdetailstypevalue: null, productdetailstypevaluelang: null, productdetailstypecolor: null, productdetailstypeicon: null, productdetailstypeimage: null, productdetailsfloatvalue: null, idaward: null, iconvalue: null, iconcolor: null, cityname: null, awardyear: null, labeldiscount: null, labeldiscountlang: null, iddiscount: null, amountdiscount: null, codediscount: null, detailtypediscount: null, typediscount: null, productfeatureid: null, productfeaturelabel: null, productfeaturelabellang: null, productfeaturekey: null, productfeaturevalue: null, productfeaturevaluelang: null, productfeatureshowonwebpage: null, vintagefeatureid: null, vintagefeaturelabel: null, vintagefeaturelabellang: null, vintagefeaturekey: null, vintagefeaturevalue: null, vintagefeaturevaluelang: null, vintagefeatureshowonwebpage: null, pdffilename: '', awardtitle: null, awardtitlelang: null, awardcontent: null, awardcontentlang: null, metadescription: '', metadescriptionlang: 2, appellation: '', appellationlang: 2, eyetasting: 'Eye tasting 7', eyetastinglang: 2, nosetasting: 'Nose tasting 7', nosetastinglang: 2, mouthtasting: 'Mouth tasting 7', mouthtastinglang: 2 },
      { nbproducts: 1, id: null, productorder: null, productnumberofvariation: null, productisvalid: null, productdatecreated: null, productdatedeleted: null, tagid: null, tagkey: null, taglabel: null, taglang: null, idvariation1: null, labelvariation1: null, labellangvariation1: null, idvariation2: null, labelvariation2: null, labellangvariation2: null, idvariation3: null, labelvariation3: null, labellangvariation3: null, variationdetailid1: null, variationdetailkey1: null, variationdetaillabel1: null, variationdetaillabellang1: null, variationdetailid2: null, variationdetailkey2: null, variationdetaillabel2: null, variationdetaillabellang2: null, variationdetailid3: null, variationdetailkey3: null, variationdetaillabel3: null, variationdetaillabellang3: null, declinationvariationdetailid1: null, declinationvariationdetailkey1: null, declinationvariationdetaillabel1: null, declinationvariationdetaillabellang1: null, declinationvariationdetailid2: null, declinationvariationdetailkey2: null, declinationvariationdetaillabel2: null, declinationvariationdetaillabellang2: null, declinationvariationdetailid3: null, declinationvariationdetailkey3: null, declinationvariationdetaillabel3: null, declinationvariationdetaillabellang3: null, vintagedescription: null, vintagedescriptionlang: null, vintageid: null, vintageisvalid: null, canBeSoldAlone: null, vintagedatecreated: null, vintagedatedeleted: null, idSite: null, year: null, sku: null, setquantity: null, quantity: null, sellByMultipleOf: null, alcoholLevel: null, temperatureMin: null, temperatureMax: null, capacity: null, capacityUnit: null, keepYearMin: null, keepYearMax: null, weight: null, vintageorder: null, idReferenceProduct: null, kindid: null, kindcolor: null, kindlabel: null, kindlabellang: null, isVintage: null, productwinetype: null, name: null, namelang: null, description: null, descriptionlang: null, idtype: null, type: null, typelabel: null, typelabellang: null, productprice: null, tvavalue: null, imagealt: null, imagealtlang: null, imagefilename: null, imageorder: null, idimage: null, productdetailstypeid: null, productdetailstypetype: null, productdetailstypevalue: null, productdetailstypevaluelang: null, productdetailstypecolor: null, productdetailstypeicon: null, productdetailstypeimage: null, productdetailsfloatvalue: null, idaward: null, iconvalue: null, iconcolor: null, cityname: null, awardyear: null, labeldiscount: null, labeldiscountlang: null, iddiscount: null, amountdiscount: null, codediscount: null, detailtypediscount: null, typediscount: null, productfeatureid: null, productfeaturelabel: null, productfeaturelabellang: null, productfeaturekey: null, productfeaturevalue: null, productfeaturevaluelang: null, productfeatureshowonwebpage: null, vintagefeatureid: null, vintagefeaturelabel: null, vintagefeaturelabellang: null, vintagefeaturekey: null, vintagefeaturevalue: null, vintagefeaturevaluelang: null, vintagefeatureshowonwebpage: null, pdffilename: null, awardtitle: null, awardtitlelang: null, awardcontent: null, awardcontentlang: null, metadescription: null, metadescriptionlang: null, appellation: null, appellationlang: null, eyetasting: null, eyetastinglang: null, nosetasting: null, nosetastinglang: null, mouthtasting: null, mouthtastinglang: null }
    ]

    let model = {
      total: ['<nbproducts>'],
      products: [{
        id: ['<<id>>'],
        idContentName: [{ value: ['<<name>>'], lang: ['<namelang>'] }],
        idContentDescription: [{ value: ['<<description>>'], lang: ['<descriptionlang>'] }],
        idContentMetaDescription: [{ value: ['<<metadescription>>'], lang: ['<metadescriptionlang>'] }],
        idContentAppellation: [{ value: ['<<appellation>>'], lang: ['<appellationlang>'] }],
        isValid: ['<productisvalid>'],
        isVintage: ['<isVintage>'],
        order: ['<productorder>'],
        wineType: ['<productwinetype>'],
        features: [{
          id: ['<<productfeatureid>>'],
          idContentLabel: [{ value: ['<<productfeaturelabel>>'], lang: ['<productfeaturelabellang>'] }],
          key: ['<productfeaturekey>'],
          idContentValue: [{ value: ['<<productfeaturevalue>>'], lang: ['<productfeaturevaluelang>'] }],
          showOnWebPage: ['<productfeatureshowonwebpage>']
        }],
        numberOfVariation: ['<productnumberofvariation>'],
        variation1: {
          id: [`<idvariation1>`],
          idContentLabel: [{ value: [`<<labelvariation1>>`], lang: [`<labellangvariation1>`] }],
          detail: [{
            id: [`<<variationdetailid1>>`],
            key: [`<variationdetailkey1>`],
            idContentLabel: [{ value: [`<<variationdetaillabel1>>`], lang: [`<variationdetaillabellang1>`] }],
          }]
        },
        variation2: {
          id: [`<idvariation2>`],
          idContentLabel: [{ value: [`<<labelvariation2>>`], lang: [`<labellangvariation2>`] }],
          detail: [{
            id: [`<<variationdetailid2>>`],
            key: [`<variationdetailkey2>`],
            idContentLabel: [{ value: [`<<variationdetaillabel2>>`], lang: [`<variationdetaillabellang2>`] }],
          }]
        },
        variation3: {
          id: [`<idvariation3>`],
          idContentLabel: [{ value: [`<<labelvariation3>>`], lang: [`<labellangvariation3>`] }],
          detail: [{
            id: [`<<variationdetailid3>>`],
            key: [`<variationdetailkey3>`],
            idContentLabel: [{ value: [`<<variationdetaillabel3>>`], lang: [`<variationdetaillabellang3>`] }],
          }]
        },
        tags: [{
          id: ['<<tagid>>'],
          key: ['<tagkey>'],
          idContentLabel: [{ value: ['<taglabel>'], lang: ['<taglang>'] }]
        }],
        declination: [{
          id: ['<<vintageid>>'],
          order: ['<vintageorder>'],
          idContentDescription: [{ value: ['<<vintagedescription>>'], lang: ['<vintagedescriptionlang>'] }],
          year: ['<year>'],
          sku: ['<sku>'],
          setQuantity: ['<setquantity>'],
          quantity: ['<quantity>'],
          variation1: {
            id: [`<declinationvariationdetailid1>`],
            key: [`<declinationvariationdetailkey1>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel1>>`], lang: [`<declinationvariationdetaillabellang1>`] }]
          },
          variation2: {
            id: [`<declinationvariationdetailid2>`],
            key: [`<declinationvariationdetailkey2>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel2>>`], lang: [`<declinationvariationdetaillabellang2>`] }]
          },
          variation3: {
            id: [`<declinationvariationdetailid3>`],
            key: [`<declinationvariationdetailkey3>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel3>>`], lang: [`<declinationvariationdetaillabellang3>`] }]
          },
          sellByMultipleOf: ['<sellByMultipleOf>'],
          alcoholLevel: ['<alcoholLevel>'],
          temperatureMin: ['<temperatureMin>'],
          temperatureMax: ['<temperatureMax>'],
          capacity: ['<capacity>'],
          capacityUnit: ['<capacityUnit>'],
          keepYearMin: ['<keepYearMin>'],
          keepYearMax: ['<keepYearMax>'],
          weight: ['<weight>'],
          features: [{
            id: ['<<vintagefeatureid>>'],
            idContentLabel: [{ value: ['<<vintagefeaturelabel>>'], lang: ['<vintagefeaturelabellang>'] }],
            key: ['<vintagefeaturekey>'],
            idContentValue: [{ value: ['<<vintagefeaturevalue>>'], lang: ['<vintagefeaturevaluelang>'] }],
            showOnWebPage: ['<vintagefeatureshowonwebpage>']
          }],
          reference: { id: ['<idReferenceProduct>'] },
          kind: {
            id: ['<kindid>'],
            idContentLabel: [{ value: ['<<kindlabel>>'], lang: ['<kindlabellang>'] }],
            color: ['<kindcolor>']
          },
          idContentEyeTasting: [{ value: ['<<eyetasting>>'], lang: ['<eyetastinglang>'] }],
          idContentNoseTasting: [{ value: ['<<nosetasting>>'], lang: ['<nosetastinglang>'] }],
          idContentMouthTasting: [{ value: ['<<mouthtasting>>'], lang: ['<mouthtastinglang>'] }],
          details: [{
            id: ['<<productdetailstypeid>>'],
            floatValue: ['<productdetailsfloatvalue>'],
            type: ['<productdetailstypetype>'],
            idContentValue: [{ value: ['<<productdetailstypevalue>>'], lang: ['<productdetailstypevaluelang>'] }],
            color: ['<productdetailstypecolor>'],
            image: ['<productdetailstypeimage>'],
            icon: ['<productdetailstypeicon>']
          }],
          price: ['<productprice>'],
          discount: {
            id: ['<iddiscount>'],
            idContentLabel: [{ value: ['<<labeldiscount>>'], lang: ['<labeldiscountlang>'] }],
            amount: ['<amountdiscount>'],
            code: ['<codediscount>'],
            type: ['<typediscount>'],
            detailType: ['<detailtypediscount>']
          },
          award: [{
            id: ['<<idaward>>'],
            icon: {
              icon: ['<iconvalue>'],
              color: ['<iconcolor>']
            },
            city: ['<cityname>'],
            year: ['<awardyear>'],
            idContentTitle: [{ value: ['<<awardtitle>>'], lang: ['<awardtitlelang>'] }],
            idContentContent: [{ value: ['<<awardcontent>>'], lang: ['<awardcontentlang>'] }]
          }],
          image: [{
            id: ['<<idimage>>'],
            filename: ['<imagefilename>'],
            order: ['<imageorder>'],
            idContentAlt: [{ value: ['<<imagealt>>'], lang: ['<imagealtlang>'] }]
          }],
          pdfFile: ['<pdffilename>'],
          isValid: ['<vintageisvalid>'],
          canBeSoldAlone: ['<canBeSoldAlone>'],
          dateCreated: ['<vintagedatecreated>'],
          dateDeleted: ['<vintagedatedeleted>']
        }],
        dateCreated: ['<productdatecreated>'],
        dateDeleted: ['<productdatedeleted>'],
        idSite: ['<idSite>'],
        idSubType: ['<idsubtype>'],
        type: {
          id: ['<idtype>'],
          type: ['<type>'],
          idContentLabel: [{ value: ['<<typelabel>>'], lang: ['<typelabellang>'] }],
          vat: {
            value: ['<tvavalue>']
          }
        }
      }]
    }

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, {
      products: [{
        id: 8,
        idContentName: [ { value: 'Wine 2', lang: 2 } ],
        idContentDescription: [ { value: 'Wine 2 description', lang: 2 } ],
        idContentMetaDescription: [ { value: '', lang: 2 } ],
        idContentAppellation: [ { value: '', lang: 2 } ],
        declination: [{
          id: 11,
          idContentDescription: [ { value: 'Product 7 desc', lang: 2 } ],
          kind: { idContentLabel: [ { value: 'Red', lang: 2 } ], id: 111, color: '#97000B' },
          idContentEyeTasting: [ { value: 'Eye tasting 7', lang: 2 } ],
          idContentNoseTasting: [ { value: 'Nose tasting 7', lang: 2 } ],
          idContentMouthTasting: [ { value: 'Mouth tasting 7', lang: 2 } ],
          variation1: { id: null, key: null, idContentLabel: [] },
          variation2: { id: null, key: null, idContentLabel: [] },
          variation3: { id: null, key: null, idContentLabel: [] },
          isValid: true,
          canBeSoldAlone: true,
          dateCreated: '2014-03-19T00:00:00.000Z',
          dateDeleted: '-Infinity',
          year: 2018,
          sku: '',
          setQuantity: false,
          quantity: 100,
          sellByMultipleOf: 1,
          alcoholLevel: 15,
          temperatureMin: 8,
          temperatureMax: 9,
          capacity: 75,
          capacityUnit: 'CENTILITRE',
          keepYearMin: 2029,
          keepYearMax: -1,
          weight: 3.2,
          order: 9,
          reference: { id: 11 },
          price: 16,
          image: [],
          details: [],
          award: [],
          discount: { idContentLabel: [], id: null, amount: null, code: null, detailType: null, type: null },
          features: [],
          pdfFile: ''
        }],
        type: { idContentLabel: [ { value: 'Wine bottle', lang: 2 } ], id: 1, type: 'WINE', vat: { value: 19.6 } },
        order: 6,
        numberOfVariation: 0,
        isValid: false,
        dateCreated: '2014-03-25T00:00:00.000Z',
        dateDeleted: '-Infinity',
        tags: [],
        variation1: { id: null, idContentLabel: [], detail: [] },
        variation2: { id: null, idContentLabel: [], detail: [] },
        variation3: { id: null, idContentLabel: [], detail: [] },
        idSite: 1000,
        isVintage: true,
        wineType: 'WINE',
        features: []
      }],
      total: 1
    })
  })

  it('should convert a big object and not push value in array if PK is null', () => {
    let data = [
      { nbproducts: null, id: 401, productorder: 100, productnumberofvariation: 3, productisvalid: true, productdatecreated: '2013-03-20T00:00:00.000Z', productdatedeleted: '-Infinity', tagid: 1001, tagkey: 'POLO', taglabel: 'Polo', taglang: 2, idvariation1: 1000, labelvariation1: 'Size', labellangvariation1: 2, idvariation2: 1001, labelvariation2: 'Color', labellangvariation2: 2, idvariation3: 1002, labelvariation3: 'Type', labellangvariation3: 2, variationdetailid1: 1000, variationdetailkey1: 'XS', variationdetaillabel1: 'XS', variationdetaillabellang1: 2, variationdetailid2: 1004, variationdetailkey2: 'YELLOW', variationdetaillabel2: 'Yellow', variationdetaillabellang2: 2, variationdetailid3: 1007, variationdetailkey3: 'SHORT', variationdetaillabel3: 'Short', variationdetaillabellang3: 2, declinationvariationdetailid1: 1000, declinationvariationdetailkey1: 'XS', declinationvariationdetaillabel1: 'XS', declinationvariationdetaillabellang1: 2, declinationvariationdetailid2: 1004, declinationvariationdetailkey2: 'YELLOW', declinationvariationdetaillabel2: 'Yellow', declinationvariationdetaillabellang2: 2, declinationvariationdetailid3: 1008, declinationvariationdetailkey3: 'LONG', declinationvariationdetaillabel3: 'Long', declinationvariationdetaillabellang3: 2, vintagedescription: 'XS Yellow Long', vintagedescriptionlang: 2, vintageid: 401, vintageisvalid: true, canBeSoldAlone: true, vintagedatecreated: '2014-03-22T00:00:00.000Z', vintagedatedeleted: '-Infinity', idSite: 1000, year: -1, sku: 'AB1', setquantity: false, quantity: 0, sellByMultipleOf: -1, alcoholLevel: -1, temperatureMin: -1, temperatureMax: -1, capacity: -1, capacityUnit: 'NOT_DEFINED', keepYearMin: -1, keepYearMax: -1, weight: 0.2, vintageorder: 100, idReferenceProduct: null, kindid: 0, kindcolor: '', kindlabel: '', kindlabellang: 2, isVintage: true, productwinetype: 'WINE', name: '3 Decl', namelang: 2, description: 'Prod 1 description', descriptionlang: 2, idtype: 3, type: 'OTHER', typelabel: 'Other', typelabellang: 2, productprice: 101, tvavalue: 19.6, imagealt: 'Image alt 1', imagealtlang: 2, imagefilename: '11.jpg', imageorder: 0, idimage: 500, productdetailstypeid: null, productdetailstypetype: null, productdetailstypevalue: null, productdetailstypevaluelang: null, productdetailstypecolor: null, productdetailstypeicon: null, productdetailstypeimage: null, productdetailsfloatvalue: null, idaward: null, iconvalue: null, iconcolor: null, cityname: null, awardyear: null, labeldiscount: null, labeldiscountlang: null, iddiscount: null, amountdiscount: null, codediscount: null, detailtypediscount: null, typediscount: null, productfeatureid: null, productfeaturelabel: null, productfeaturelabellang: null, productfeaturekey: null, productfeaturevalue: null, productfeaturevaluelang: null, productfeatureshowonwebpage: null, vintagefeatureid: null, vintagefeaturelabel: null, vintagefeaturelabellang: null, vintagefeaturekey: null, vintagefeaturevalue: null, vintagefeaturevaluelang: null, vintagefeatureshowonwebpage: null, pdffilename: '', awardtitle: null, awardtitlelang: null, awardcontent: null, awardcontentlang: null, metadescription: 'Meta desc', metadescriptionlang: 2, appellation: null, appellationlang: null, eyetasting: 'Triangle', eyetastinglang: 2, nosetasting: 'Triangle', nosetastinglang: 2, mouthtasting: 'Triangle', mouthtastinglang: 2 },
      { nbproducts: null, id: 401, productorder: 100, productnumberofvariation: 3, productisvalid: true, productdatecreated: '2013-03-20T00:00:00.000Z', productdatedeleted: '-Infinity', tagid: 1003, tagkey: 'SHORT', taglabel: 'Short', taglang: 2, idvariation1: 1000, labelvariation1: 'Size', labellangvariation1: 2, idvariation2: 1001, labelvariation2: 'Color', labellangvariation2: 2, idvariation3: 1002, labelvariation3: 'Type', labellangvariation3: 2, variationdetailid1: 1000, variationdetailkey1: 'XS', variationdetaillabel1: 'XS', variationdetaillabellang1: 2, variationdetailid2: 1004, variationdetailkey2: 'YELLOW', variationdetaillabel2: 'Yellow', variationdetaillabellang2: 2, variationdetailid3: 1007, variationdetailkey3: 'SHORT', variationdetaillabel3: 'Short', variationdetaillabellang3: 2, declinationvariationdetailid1: 1000, declinationvariationdetailkey1: 'XS', declinationvariationdetaillabel1: 'XS', declinationvariationdetaillabellang1: 2, declinationvariationdetailid2: 1004, declinationvariationdetailkey2: 'YELLOW', declinationvariationdetaillabel2: 'Yellow', declinationvariationdetaillabellang2: 2, declinationvariationdetailid3: 1008, declinationvariationdetailkey3: 'LONG', declinationvariationdetaillabel3: 'Long', declinationvariationdetaillabellang3: 2, vintagedescription: 'XS Yellow Long', vintagedescriptionlang: 2, vintageid: 401, vintageisvalid: true, canBeSoldAlone: true, vintagedatecreated: '2014-03-22T00:00:00.000Z', vintagedatedeleted: '-Infinity', idSite: 1000, year: -1, sku: 'AB1', setquantity: false, quantity: 0, sellByMultipleOf: -1, alcoholLevel: -1, temperatureMin: -1, temperatureMax: -1, capacity: -1, capacityUnit: 'NOT_DEFINED', keepYearMin: -1, keepYearMax: -1, weight: 0.2, vintageorder: 100, idReferenceProduct: null, kindid: 0, kindcolor: '', kindlabel: '', kindlabellang: 2, isVintage: true, productwinetype: 'WINE', name: '3 Decl', namelang: 2, description: 'Prod 1 description', descriptionlang: 2, idtype: 3, type: 'OTHER', typelabel: 'Other', typelabellang: 2, productprice: 101, tvavalue: 19.6, imagealt: 'Image alt 1', imagealtlang: 2, imagefilename: '11.jpg', imageorder: 0, idimage: 500, productdetailstypeid: null, productdetailstypetype: null, productdetailstypevalue: null, productdetailstypevaluelang: null, productdetailstypecolor: null, productdetailstypeicon: null, productdetailstypeimage: null, productdetailsfloatvalue: null, idaward: null, iconvalue: null, iconcolor: null, cityname: null, awardyear: null, labeldiscount: null, labeldiscountlang: null, iddiscount: null, amountdiscount: null, codediscount: null, detailtypediscount: null, typediscount: null, productfeatureid: null, productfeaturelabel: null, productfeaturelabellang: null, productfeaturekey: null, productfeaturevalue: null, productfeaturevaluelang: null, productfeatureshowonwebpage: null, vintagefeatureid: null, vintagefeaturelabel: null, vintagefeaturelabellang: null, vintagefeaturekey: null, vintagefeaturevalue: null, vintagefeaturevaluelang: null, vintagefeatureshowonwebpage: null, pdffilename: '', awardtitle: null, awardtitlelang: null, awardcontent: null, awardcontentlang: null, metadescription: 'Meta desc', metadescriptionlang: 2, appellation: null, appellationlang: null, eyetasting: 'Triangle', eyetastinglang: 2, nosetasting: 'Triangle', nosetastinglang: 2, mouthtasting: 'Triangle', mouthtastinglang: 2 }
    ]

    let model = {
      total: ['<nbproducts>'],
      products: [{
        id: ['<<id>>'],
        idContentName: [{ value: ['<<name>>'], lang: ['<namelang>'] }],
        idContentDescription: [{ value: ['<<description>>'], lang: ['<descriptionlang>'] }],
        idContentMetaDescription: [{ value: ['<<metadescription>>'], lang: ['<metadescriptionlang>'] }],
        idContentAppellation: [{ value: ['<<appellation>>'], lang: ['<appellationlang>'] }],
        isValid: ['<productisvalid>'],
        isVintage: ['<isVintage>'],
        order: ['<productorder>'],
        wineType: ['<productwinetype>'],
        features: [{
          id: ['<<productfeatureid>>'],
          idContentLabel: [{ value: ['<<productfeaturelabel>>'], lang: ['<productfeaturelabellang>'] }],
          key: ['<productfeaturekey>'],
          idContentValue: [{ value: ['<<productfeaturevalue>>'], lang: ['<productfeaturevaluelang>'] }],
          showOnWebPage: ['<productfeatureshowonwebpage>']
        }],
        numberOfVariation: ['<productnumberofvariation>'],
        variation1: {
          id: [`<idvariation1>`],
          idContentLabel: [{ value: [`<<labelvariation1>>`], lang: [`<labellangvariation1>`] }],
          detail: [{
            id: [`<<variationdetailid1>>`],
            key: [`<variationdetailkey1>`],
            idContentLabel: [{ value: [`<<variationdetaillabel1>>`], lang: [`<variationdetaillabellang1>`] }],
          }]
        },
        variation2: {
          id: [`<idvariation2>`],
          idContentLabel: [{ value: [`<<labelvariation2>>`], lang: [`<labellangvariation2>`] }],
          detail: [{
            id: [`<<variationdetailid2>>`],
            key: [`<variationdetailkey2>`],
            idContentLabel: [{ value: [`<<variationdetaillabel2>>`], lang: [`<variationdetaillabellang2>`] }],
          }]
        },
        variation3: {
          id: [`<idvariation3>`],
          idContentLabel: [{ value: [`<<labelvariation3>>`], lang: [`<labellangvariation3>`] }],
          detail: [{
            id: [`<<variationdetailid3>>`],
            key: [`<variationdetailkey3>`],
            idContentLabel: [{ value: [`<<variationdetaillabel3>>`], lang: [`<variationdetaillabellang3>`] }],
          }]
        },
        tags: [{
          id: ['<<tagid>>'],
          key: ['<tagkey>'],
          idContentLabel: [{ value: ['<taglabel>'], lang: ['<taglang>'] }]
        }],
        declination: [{
          id: ['<<vintageid>>'],
          order: ['<vintageorder>'],
          idContentDescription: [{ value: ['<<vintagedescription>>'], lang: ['<vintagedescriptionlang>'] }],
          year: ['<year>'],
          sku: ['<sku>'],
          setQuantity: ['<setquantity>'],
          quantity: ['<quantity>'],
          variation1: {
            id: [`<declinationvariationdetailid1>`],
            key: [`<declinationvariationdetailkey1>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel1>>`], lang: [`<declinationvariationdetaillabellang1>`] }]
          },
          variation2: {
            id: [`<declinationvariationdetailid2>`],
            key: [`<declinationvariationdetailkey2>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel2>>`], lang: [`<declinationvariationdetaillabellang2>`] }]
          },
          variation3: {
            id: [`<declinationvariationdetailid3>`],
            key: [`<declinationvariationdetailkey3>`],
            idContentLabel: [{ value: [`<<declinationvariationdetaillabel3>>`], lang: [`<declinationvariationdetaillabellang3>`] }]
          },
          sellByMultipleOf: ['<sellByMultipleOf>'],
          alcoholLevel: ['<alcoholLevel>'],
          temperatureMin: ['<temperatureMin>'],
          temperatureMax: ['<temperatureMax>'],
          capacity: ['<capacity>'],
          capacityUnit: ['<capacityUnit>'],
          keepYearMin: ['<keepYearMin>'],
          keepYearMax: ['<keepYearMax>'],
          weight: ['<weight>'],
          features: [{
            id: ['<<vintagefeatureid>>'],
            idContentLabel: [{ value: ['<<vintagefeaturelabel>>'], lang: ['<vintagefeaturelabellang>'] }],
            key: ['<vintagefeaturekey>'],
            idContentValue: [{ value: ['<<vintagefeaturevalue>>'], lang: ['<vintagefeaturevaluelang>'] }],
            showOnWebPage: ['<vintagefeatureshowonwebpage>']
          }],
          reference: { id: ['<idReferenceProduct>'] },
          kind: {
            id: ['<kindid>'],
            idContentLabel: [{ value: ['<<kindlabel>>'], lang: ['<kindlabellang>'] }],
            color: ['<kindcolor>']
          },
          idContentEyeTasting: [{ value: ['<<eyetasting>>'], lang: ['<eyetastinglang>'] }],
          idContentNoseTasting: [{ value: ['<<nosetasting>>'], lang: ['<nosetastinglang>'] }],
          idContentMouthTasting: [{ value: ['<<mouthtasting>>'], lang: ['<mouthtastinglang>'] }],
          details: [{
            id: ['<<productdetailstypeid>>'],
            floatValue: ['<productdetailsfloatvalue>'],
            type: ['<productdetailstypetype>'],
            idContentValue: [{ value: ['<<productdetailstypevalue>>'], lang: ['<productdetailstypevaluelang>'] }],
            color: ['<productdetailstypecolor>'],
            image: ['<productdetailstypeimage>'],
            icon: ['<productdetailstypeicon>']
          }],
          price: ['<productprice>'],
          discount: {
            id: ['<iddiscount>'],
            idContentLabel: [{ value: ['<<labeldiscount>>'], lang: ['<labeldiscountlang>'] }],
            amount: ['<amountdiscount>'],
            code: ['<codediscount>'],
            type: ['<typediscount>'],
            detailType: ['<detailtypediscount>']
          },
          award: [{
            id: ['<<idaward>>'],
            icon: {
              icon: ['<iconvalue>'],
              color: ['<iconcolor>']
            },
            city: ['<cityname>'],
            year: ['<awardyear>'],
            idContentTitle: [{ value: ['<<awardtitle>>'], lang: ['<awardtitlelang>'] }],
            idContentContent: [{ value: ['<<awardcontent>>'], lang: ['<awardcontentlang>'] }]
          }],
          image: [{
            id: ['<<idimage>>'],
            filename: ['<imagefilename>'],
            order: ['<imageorder>'],
            idContentAlt: [{ value: ['<<imagealt>>'], lang: ['<imagealtlang>'] }]
          }],
          pdfFile: ['<pdffilename>'],
          isValid: ['<vintageisvalid>'],
          canBeSoldAlone: ['<canBeSoldAlone>'],
          dateCreated: ['<vintagedatecreated>'],
          dateDeleted: ['<vintagedatedeleted>']
        }],
        dateCreated: ['<productdatecreated>'],
        dateDeleted: ['<productdatedeleted>'],
        idSite: ['<idSite>'],
        idSubType: ['<idsubtype>'],
        type: {
          id: ['<idtype>'],
          type: ['<type>'],
          idContentLabel: [{ value: ['<<typelabel>>'], lang: ['<typelabellang>'] }],
          vat: {
            value: ['<tvavalue>']
          }
        }
      }]
    }

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result.products[0].variation1, {
      idContentLabel: [ { value: 'Size', lang: 2 } ],
      detail: [ { id: 1000, idContentLabel: [ { value: 'XS', lang: 2 } ], key: 'XS' } ],
      id: 1000
    })
    assert.deepStrictEqual(result.products[0].variation2, {
      idContentLabel: [ { value: 'Color', lang: 2 } ],
      detail: [ { id: 1004, idContentLabel: [ { value: 'Yellow', lang: 2 } ], key: 'YELLOW' } ],
      id: 1001
    })
    assert.deepStrictEqual(result.products[0].variation3, {
      idContentLabel: [ { value: 'Type', lang: 2 } ],
      detail: [ { id: 1007, idContentLabel: [ { value: 'Short', lang: 2 } ], key: 'SHORT' } ],
      id: 1002
    })
    assert.deepStrictEqual(result.products[0].declination[0].variation1, { idContentLabel: [ { value: 'XS', lang: 2 } ], id: 1000, key: 'XS' })
    assert.deepStrictEqual(result.products[0].declination[0].variation2, { idContentLabel: [ { value: 'Yellow', lang: 2 } ], id: 1004, key: 'YELLOW' })
    assert.deepStrictEqual(result.products[0].declination[0].variation3, { idContentLabel: [ { value: 'Long', lang: 2 } ], id: 1008, key: 'LONG' })
  })

  it('should not push values in array if id is null', () => {
    let model = {
      id: ['<id>'],
      arr: [{
        id: ['<<idArr>>'],
        name: ['<name>']
      }]
    }
    let data = [
      { id: 1, idArr: 5, name: 'Test'   },
      { id: 1, idArr: null, name: '' },
      { id: 1, idArr: 7, name: 'Test 3' },
      { id: 1, idArr: '', name: 'Test 2' },
      { id: 1, idArr: 8, name: 'Test 4' },
      { id: 1, idArr: 9, name: 'Test 5' }
    ]

    let result = converter.sqlToJson(model, data)

    assert.deepStrictEqual(result, {
      id: 1,
      arr: [
        { id: 5, name: 'Test' },
        { id: 7, name: 'Test 3' },
        { id: 8, name: 'Test 4' },
        { id: 9, name: 'Test 5' }
      ]
    })
  })

  it('should not add empty object will null values if one field of the model is undefined', () => {
    let model = {"folders":[{"id":["<<idblogfolder>>"],"folderName":["<folderName>"],"idContentUrl":[{"value":["<<urlname>>"],"lang":["<urlnamelang>"]}],"idContentMenuName":[{"value":["<<menuname>>"],"lang":["<menunamelang>"]}],"color":["<color>"],"icon":["<icon>"],"order":["<blogfolderorder>"],"state":["<state>"],"idParentFolder":["<idParentFolder>"],"isValid":["<isvalidblogfolder>"],"dateCreated":["<datecreatedlogfolder>"]}],"blogs":[{"id":["<<idblog>>"],"markdownVersion":["<markdownVersion>"],"idContentHtmlVersion":[{"value":["<<htmlversion>>"],"lang":["<htmlversionlang>"]}],"idContentTitle":[{"value":["<<titleblog>>"],"lang":["<titlebloglang>"]}],"idContentShortDescription":[{"value":["<<shortdescriptionblog>>"],"lang":["<shortdescriptionbloglang>"]}],"imageBanner":{"id":["<idimagebanner>"],"filename":["<imagebannername>"],"idContentAlt":[{"value":["<<altimagebanner>>"],"lang":["<altimagebannerlang>"]}],"onlineImage":{"id":["<onlineimagebannerid>"],"externalId":["<onlineimagebannerexternalid>"],"externalType":["<onlineimagebannerexternaltype>"],"externalPath":["<onlineimagebannerexternalpath>"],"author":{"username":["<onlineimagebannerauthor>"],"link":["<onlineimagebannerauthorlink>"]},"url":["<onlineimagebannerurl>"],"name":["<onlineimagebannername>"],"quality":["<onlineimagebannerquality>"]}},"idBlogFolder":["<idBlogFolder>"],"author":{"id":["<iduser>"],"firstname":["<firstname>"],"lastname":["<lastname>"]},"tags":[{"id":["<<idtagblog>>"],"idContentLabel":[{"value":["<<taglabel>>"],"lang":["<taglabellang>"]}]}],"status":["<blogstatus>"],"dateCreated":["<datecreatedblog>"],"dateUpdated":["<dateupdatedblog>"],"isValid":["<isvalidblog>"],"order":["<orderblog>"]}]}
    let data = [
      { idblogfolder: 1001, folderName: 'Folder 1.1', urlname: 'folder-1-1', urlnamelang: 2, menuname: 'Subject 1.1', menunamelang: 2, color: '#123456', icon: '', blogfolderorder: 0, state: 'VISIBLE', idParentFolder: 1000, isvalidblogfolder: true, datecreatedlogfolder: '2023-04-06T16:15:30.532Z', idblog: null, titleblog: null, titlebloglang: null, shortdescriptionblog: null, shortdescriptionbloglang: null, idimagebanner: null, imagebannername: null, altimagebanner: null, altimagebannerlang: null, onlineimagebannerid: null, onlineimagebannerexternalid: null, onlineimagebannerexternaltype: null, onlineimagebannerexternalpath: null, onlineimagebannerurl: null, onlineimagebannername: null, onlineimagebannerquality: null, idBlogFolder: null, iduser: null, firstname: null, lastname: null, datecreatedblog: null, dateupdatedblog: null, isvalidblog: null, orderblog: null, blogstatus: null, idtagblog: null, taglabel: null, taglabellang: null },
      { idblogfolder: 1003, folderName: 'Folder 1.2', urlname: 'folder-1-2', urlnamelang: 2, menuname: 'Subject 1.2', menunamelang: 2, color: '#987654', icon: '', blogfolderorder: 1, state: 'HIDDEN', idParentFolder: 1000, isvalidblogfolder: true, datecreatedlogfolder: '2023-04-06T16:15:30.532Z', idblog: null, titleblog: null, titlebloglang: null, shortdescriptionblog: null, shortdescriptionbloglang: null, idimagebanner: null, imagebannername: null, altimagebanner: null, altimagebannerlang: null, onlineimagebannerid: null, onlineimagebannerexternalid: null, onlineimagebannerexternaltype: null, onlineimagebannerexternalpath: null, onlineimagebannerurl: null, onlineimagebannername: null, onlineimagebannerquality: null, idBlogFolder: null, iduser: null, firstname: null, lastname: null, datecreatedblog: null, dateupdatedblog: null, isvalidblog: null, orderblog: null, blogstatus: null, idtagblog: null, taglabel: null, taglabellang: null },
      { idblogfolder: null, folderName: null, urlname: null, urlnamelang: null, menuname: null, menunamelang: null, color: null, icon: null, blogfolderorder: null, state: null, idParentFolder: null, isvalidblogfolder: null, datecreatedlogfolder: null, idblog: 1007, titleblog: 'Titre 8', titlebloglang: 2, shortdescriptionblog: 'Desc 8', shortdescriptionbloglang: 2, idimagebanner: 8007, imagebannername: 'name7.jpg', altimagebanner: 'alt 7', altimagebannerlang: 2, onlineimagebannerid: 2007, onlineimagebannerexternalid: 'ext8', onlineimagebannerexternaltype: 'type8', onlineimagebannerexternalpath: '', onlineimagebannerurl: 'url8', onlineimagebannername: 'name8', onlineimagebannerquality: 80, idBlogFolder: 1000, iduser: 2000, firstname: 'Mikel', lastname: 'Senior', datecreatedblog: '2023-04-06T16:15:30.532Z', dateupdatedblog: '2023-04-06T16:15:30.532Z', isvalidblog: true, orderblog: 0, blogstatus: 'READY', idtagblog: null, taglabel: null, taglabellang: null }
    ]

    let result = converter.sqlToJson(model, data)

    assert.strictEqual(result.folders.length, 2)
    assert.strictEqual(result.blogs.length, 1)
  })

  describe('Get list of new ID', () => {
    describe('Dataset #1', () => {
      // Model is here to help understanding the used model in test
      let model = [{
        id: ['<<id>>'],
        arr: [{
          id: ['<<id2>>'],
          obj: {
            nArr: [{
              id: ['<<id3>>']
            }]
          }
        }]
      }]
      let complexPks = [
        { keyPath: [ 0 ], sqlKey: 'id', objKey: 'id' },
        { keyPath: [ 0, 'arr', 0 ], sqlKey: 'id2', objKey: 'id' },
        { keyPath: [ 0, 'arr', 0, 'obj', 'nArr', 0 ], sqlKey: 'id3', objKey: 'id' }
      ]
      let parsedModel = {
        id: {
          isPrimaryKey: true,
          parents: [ 'root' ],
          path: [ 0 ]
        },
        id2: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr' ],
          path: [ 0, 'arr', 0 ]
        },
        id3: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr', 'obj', 'nArr' ],
          path: [ 0, 'arr', 0, 'obj', 'nArr', 0 ]
        }
      }

      it('should return all if there are no data', () => {
        let data = { id: 1, id2: 2, id3: 3 }
        let current = []

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id', 'id2', 'id3'])
      })

      it('should return only the id of the last array', () => {
        let data = { id: 1, id2: 2, id3: 3 }
        let current = [{
          id: 1,
          arr: [{
            id: 1, obj: { nArr: [{ id: 2 }] }
          }, {
            id: 2, obj: { nArr: [{ id: 1 }] }
          }]
        }]

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id3'])
      })

      it('should return last two ids', () => {
        let data = { id: 1, id2: 2, id3: 3 }
        let current = [{
          id: 1,
          arr: [{
            id: 1, obj: { nArr: [{ id: 2 }] }
          }]
        }]

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id2', 'id3'])
      })

      it('should return all three ids', () => {
        let data = { id: 1, id2: 2, id3: 3 }
        let current = []

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id', 'id2', 'id3'])
      })
    })

    describe('Dataset #2', () => {
      // Model is here to help understanding the used model in test
      let model = [{
        id: ['<<id>>'],
        arr: [{
          id: ['<<id2>>']
        }],
        arr2: [{
          id: ['<<id3>>']
        }],
        arr3: [{
          str: ['<<id4>>']
        }]
      }]
      let complexPks = [
        { keyPath: [ 0 ], sqlKey: 'id', objKey: 'id' },
        { keyPath: [ 0, 'arr', 0 ], sqlKey: 'id2', objKey: 'id' },
        { keyPath: [ 0, 'arr2', 0 ], sqlKey: 'id3', objKey: 'id' },
        { keyPath: [ 0, 'arr3', 0 ], sqlKey: 'id4', objKey: 'str' }
      ]
      let parsedModel = {
        id: {
          isPrimaryKey: true,
          parents: [ 'root' ],
          path: [ 0 ]
        },
        id2: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr' ],
          path: [ 0, 'arr', 0 ]
        },
        id3: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr2' ],
          path: [ 0, 'arr2', 0 ]
        },
        id4: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr3' ],
          path: [ 0, 'arr3', 0 ]
        }
      }

      it('should return two ids with multiple arrays at the same level', () => {
        let data = { id: 1, id2: 2, id3: 2, id4: 4 }
        let current = [{
          id: 1,
          arr: [{
            id: 1
          }],
          arr2: [{
            id: 1
          }],
          arr3: [{
            str: 4
          }]
        }]

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id2', 'id3'])
      })

      it('should one ids with multiple arrays at the same level', () => {
        let data = { id: 1, id2: 1, id3: 1, id4: 3 }
        let current = [{
          id: 1,
          arr: [{
            id: 1
          }],
          arr2: [{
            id: 1
          }],
          arr3: [{
            str: 4
          }]
        }]

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id4'])
      })
    })

    describe('Dataset #3', () => {
      // Model is here to help understanding the used model in test
      let model = {
        arr: [{
          id: ['<<id2>>']
        }]
      }
      let complexPks = [
        { keyPath: [ 'arr', 0 ], sqlKey: 'id2', objKey: 'id' },
      ]
      let parsedModel = {
        id2: {
          isPrimaryKey: true,
          parents: [ 'root', 'arr' ],
          path: [ 'arr', 0 ]
        }
      }

      it('should return all if there are no data', () => {
        let data = { id2: 2 }
        let current = {}

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, ['id2'])
      })

      it('should not push null ids', () => {
        let data = { id2: null }
        let current = { arr: [{ id: 1 }] }

        let result = converter.getListOfNewId(data, complexPks, parsedModel, current)

        assert.deepStrictEqual(result, [])
      })
    })

    it('should return all new Ids', () => {
      let data = { nbproducts: null, id: 2, productorder: 1, productnumberofvariation: 0, productisvalid: true, productdatecreated: '2014-03-18T00:00:00.000Z', productdatedeleted: '-Infinity', tagid: null, tagkey: null, taglabel: null, taglang: null, idvariation1: null, labelvariation1: null, labellangvariation1: null, idvariation2: null, labelvariation2: null, labellangvariation2: null, idvariation3: null, labelvariation3: null, labellangvariation3: null, variationdetailid1: null, variationdetailkey1: null, variationdetaillabel1: null, variationdetaillabellang1: null, variationdetailid2: null, variationdetailkey2: null, variationdetaillabel2: null, variationdetaillabellang2: null, variationdetailid3: null, variationdetailkey3: null, variationdetaillabel3: null, variationdetaillabellang3: null, declinationvariationdetailid1: null, declinationvariationdetailkey1: null, declinationvariationdetaillabel1: null, declinationvariationdetaillabellang1: null, declinationvariationdetailid2: null, declinationvariationdetailkey2: null, declinationvariationdetaillabel2: null, declinationvariationdetaillabellang2: null, declinationvariationdetailid3: null, declinationvariationdetailkey3: null, declinationvariationdetaillabel3: null, declinationvariationdetaillabellang3: null, vintagedescription: 'New vintage description', vintagedescriptionlang: 2, vintageid: 1000, vintageisvalid: true, canBeSoldAlone: true, vintagedatecreated: '2023-04-04T17:03:50.201Z', vintagedatedeleted: '-Infinity', idSite: 1000, year: 2020, sku: '', setquantity: false, quantity: -1, sellByMultipleOf: 6, alcoholLevel: 11, temperatureMin: 10, temperatureMax: -1, capacity: 1.5, capacityUnit: 'LITER', keepYearMin: 2030, keepYearMax: 2035, weight: 1.5, vintageorder: 0, idReferenceProduct: 1000, kindid: 112, kindcolor: '#D661C4', kindlabel: 'Pink', kindlabellang: 2, isVintage: true, productwinetype: 'WINE', name: 'Wine 3', namelang: 2, description: 'Wine 2 description', descriptionlang: 2, idtype: 1, type: 'WINE', typelabel: 'Wine bottle', typelabellang: 2, productprice: 14, tvavalue: 19.6, imagealt: 'Image alt', imagealtlang: 2, imagefilename: 'n9iknlsurrxh2sqlygxrsdi.jpeg', imageorder: 3, idimage: 1, productdetailstypeid: 103, productdetailstypetype: 'TASTE', productdetailstypevalue: 'Tannique', productdetailstypevaluelang: 2, productdetailstypecolor: '', productdetailstypeicon: '', productdetailstypeimage: '', productdetailsfloatvalue: -1, idaward: null, iconvalue: null, iconcolor: null, cityname: null, awardyear: null, labeldiscount: null, labeldiscountlang: null, iddiscount: null, amountdiscount: null, codediscount: null, detailtypediscount: null, typediscount: null, productfeatureid: null, productfeaturelabel: null, productfeaturelabellang: null, productfeaturekey: null, productfeaturevalue: null, productfeaturevaluelang: null, productfeatureshowonwebpage: null, vintagefeatureid: 8, vintagefeaturelabel: 'Un label', vintagefeaturelabellang: 2, vintagefeaturekey: 'un_label', vintagefeaturevalue: 'Et une value', vintagefeaturevaluelang: 2, vintagefeatureshowonwebpage: true, pdffilename: 'tz49mngwtest.pdf', awardtitle: null, awardtitlelang: null, awardcontent: null, awardcontentlang: null, metadescription: '', metadescriptionlang: 2, appellation: '', appellationlang: 2, eyetasting: 'Eye tasting', eyetastinglang: 2, nosetasting: 'Nose tasting', nosetastinglang: 2, mouthtasting: 'Mouth tasting', mouthtastinglang: 2 }
      let pks = [
        { keyPath: [ 'idContentName', 0 ], sqlKey: 'name', objKey: 'value' },
        {
          keyPath: [ 'idContentDescription', 0 ],
          sqlKey: 'description',
          objKey: 'value'
        },
        {
          keyPath: [ 'idContentMetaDescription', 0 ],
          sqlKey: 'metadescription',
          objKey: 'value'
        },
        {
          keyPath: [ 'idContentAppellation', 0 ],
          sqlKey: 'appellation',
          objKey: 'value'
        },
        {
          keyPath: [ 'features', 0 ],
          sqlKey: 'productfeatureid',
          objKey: 'id'
        },
        {
          keyPath: [ 'features', 0, 'idContentLabel', 0 ],
          sqlKey: 'productfeaturelabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'features', 0, 'idContentValue', 0 ],
          sqlKey: 'productfeaturevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation1', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation1',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation1', 'detail', 0 ],
          sqlKey: 'variationdetailid1',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation1', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel1',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation2', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation2',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation2', 'detail', 0 ],
          sqlKey: 'variationdetailid2',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation2', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel2',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation3', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation3',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation3', 'detail', 0 ],
          sqlKey: 'variationdetailid3',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation3', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel3',
          objKey: 'value'
        },
        { keyPath: [ 'tags', 0 ], sqlKey: 'tagid', objKey: 'id' },
        {
          keyPath: [ 'tags', 0, 'idContentLabel', 0 ],
          sqlKey: 'taglabel',
          objKey: 'value'
        },
        { keyPath: [ 'declination', 0 ], sqlKey: 'vintageid', objKey: 'id' },
        {
          keyPath: [ 'declination', 0, 'idContentDescription', 0 ],
          sqlKey: 'vintagedescription',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation1', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel1',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation2', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel2',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation3', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel3',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0 ],
          sqlKey: 'vintagefeatureid',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0, 'idContentLabel', 0 ],
          sqlKey: 'vintagefeaturelabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0, 'idContentValue', 0 ],
          sqlKey: 'vintagefeaturevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'kind', 'idContentLabel', 0 ],
          sqlKey: 'kindlabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentEyeTasting', 0 ],
          sqlKey: 'eyetasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentNoseTasting', 0 ],
          sqlKey: 'nosetasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentMouthTasting', 0 ],
          sqlKey: 'mouthtasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'details', 0 ],
          sqlKey: 'productdetailstypeid',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'details', 0, 'idContentValue', 0 ],
          sqlKey: 'productdetailstypevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'discount', 'idContentLabel', 0 ],
          sqlKey: 'labeldiscount',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0 ],
          sqlKey: 'idaward',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0, 'idContentTitle', 0 ],
          sqlKey: 'awardtitle',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0, 'idContentContent', 0 ],
          sqlKey: 'awardcontent',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'image', 0 ],
          sqlKey: 'idimage',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'image', 0, 'idContentAlt', 0 ],
          sqlKey: 'imagealt',
          objKey: 'value'
        },
        {
          keyPath: [ 'type', 'idContentLabel', 0 ],
          sqlKey: 'typelabel',
          objKey: 'value'
        }
      ]
      let parsedModel = {"id":{"isPrimaryKey":false,"parents":["root"],"path":["id"]},"name":{"isPrimaryKey":true,"parents":["root","idContentName"],"path":["idContentName",0,"value"]},"namelang":{"isPrimaryKey":false,"parents":["root","idContentName"],"path":["idContentName",0,"lang"]},"description":{"isPrimaryKey":true,"parents":["root","idContentDescription"],"path":["idContentDescription",0,"value"]},"descriptionlang":{"isPrimaryKey":false,"parents":["root","idContentDescription"],"path":["idContentDescription",0,"lang"]},"metadescription":{"isPrimaryKey":true,"parents":["root","idContentMetaDescription"],"path":["idContentMetaDescription",0,"value"]},"metadescriptionlang":{"isPrimaryKey":false,"parents":["root","idContentMetaDescription"],"path":["idContentMetaDescription",0,"lang"]},"appellation":{"isPrimaryKey":true,"parents":["root","idContentAppellation"],"path":["idContentAppellation",0,"value"]},"appellationlang":{"isPrimaryKey":false,"parents":["root","idContentAppellation"],"path":["idContentAppellation",0,"lang"]},"productisvalid":{"isPrimaryKey":false,"parents":["root"],"path":["isValid"]},"isVintage":{"isPrimaryKey":false,"parents":["root"],"path":["isVintage"]},"productorder":{"isPrimaryKey":false,"parents":["root"],"path":["order"]},"productwinetype":{"isPrimaryKey":false,"parents":["root"],"path":["wineType"]},"productfeatureid":{"isPrimaryKey":true,"parents":["root","features"],"path":["features",0,"id"]},"productfeaturelabel":{"isPrimaryKey":true,"parents":["root","features","idContentLabel"],"path":["features",0,"idContentLabel",0,"value"]},"productfeaturelabellang":{"isPrimaryKey":false,"parents":["root","features","idContentLabel"],"path":["features",0,"idContentLabel",0,"lang"]},"productfeaturekey":{"isPrimaryKey":false,"parents":["root","features"],"path":["features",0,"key"]},"productfeaturevalue":{"isPrimaryKey":true,"parents":["root","features","idContentValue"],"path":["features",0,"idContentValue",0,"value"]},"productfeaturevaluelang":{"isPrimaryKey":false,"parents":["root","features","idContentValue"],"path":["features",0,"idContentValue",0,"lang"]},"productfeatureshowonwebpage":{"isPrimaryKey":false,"parents":["root","features"],"path":["features",0,"showOnWebPage"]},"productnumberofvariation":{"isPrimaryKey":false,"parents":["root"],"path":["numberOfVariation"]},"idvariation1":{"isPrimaryKey":false,"parents":["root","variation1"],"path":["variation1","id"]},"labelvariation1":{"isPrimaryKey":true,"parents":["root","variation1","idContentLabel"],"path":["variation1","idContentLabel",0,"value"]},"labellangvariation1":{"isPrimaryKey":false,"parents":["root","variation1","idContentLabel"],"path":["variation1","idContentLabel",0,"lang"]},"variationdetailid1":{"isPrimaryKey":true,"parents":["root","variation1","detail"],"path":["variation1","detail",0,"id"]},"variationdetailkey1":{"isPrimaryKey":false,"parents":["root","variation1","detail"],"path":["variation1","detail",0,"key"]},"variationdetaillabel1":{"isPrimaryKey":true,"parents":["root","variation1","detail","idContentLabel"],"path":["variation1","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang1":{"isPrimaryKey":false,"parents":["root","variation1","detail","idContentLabel"],"path":["variation1","detail",0,"idContentLabel",0,"lang"]},"idvariation2":{"isPrimaryKey":false,"parents":["root","variation2"],"path":["variation2","id"]},"labelvariation2":{"isPrimaryKey":true,"parents":["root","variation2","idContentLabel"],"path":["variation2","idContentLabel",0,"value"]},"labellangvariation2":{"isPrimaryKey":false,"parents":["root","variation2","idContentLabel"],"path":["variation2","idContentLabel",0,"lang"]},"variationdetailid2":{"isPrimaryKey":true,"parents":["root","variation2","detail"],"path":["variation2","detail",0,"id"]},"variationdetailkey2":{"isPrimaryKey":false,"parents":["root","variation2","detail"],"path":["variation2","detail",0,"key"]},"variationdetaillabel2":{"isPrimaryKey":true,"parents":["root","variation2","detail","idContentLabel"],"path":["variation2","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang2":{"isPrimaryKey":false,"parents":["root","variation2","detail","idContentLabel"],"path":["variation2","detail",0,"idContentLabel",0,"lang"]},"idvariation3":{"isPrimaryKey":false,"parents":["root","variation3"],"path":["variation3","id"]},"labelvariation3":{"isPrimaryKey":true,"parents":["root","variation3","idContentLabel"],"path":["variation3","idContentLabel",0,"value"]},"labellangvariation3":{"isPrimaryKey":false,"parents":["root","variation3","idContentLabel"],"path":["variation3","idContentLabel",0,"lang"]},"variationdetailid3":{"isPrimaryKey":true,"parents":["root","variation3","detail"],"path":["variation3","detail",0,"id"]},"variationdetailkey3":{"isPrimaryKey":false,"parents":["root","variation3","detail"],"path":["variation3","detail",0,"key"]},"variationdetaillabel3":{"isPrimaryKey":true,"parents":["root","variation3","detail","idContentLabel"],"path":["variation3","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang3":{"isPrimaryKey":false,"parents":["root","variation3","detail","idContentLabel"],"path":["variation3","detail",0,"idContentLabel",0,"lang"]},"tagid":{"isPrimaryKey":true,"parents":["root","tags"],"path":["tags",0,"id"]},"tagkey":{"isPrimaryKey":false,"parents":["root","tags"],"path":["tags",0,"key"]},"taglabel":{"isPrimaryKey":true,"parents":["root","tags","idContentLabel"],"path":["tags",0,"idContentLabel",0,"value"]},"taglang":{"isPrimaryKey":false,"parents":["root","tags","idContentLabel"],"path":["tags",0,"idContentLabel",0,"lang"]},"vintageid":{"isPrimaryKey":true,"parents":["root","declination"],"path":["declination",0,"id"]},"vintageorder":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"order"]},"vintagedescription":{"isPrimaryKey":true,"parents":["root","declination","idContentDescription"],"path":["declination",0,"idContentDescription",0,"value"]},"vintagedescriptionlang":{"isPrimaryKey":false,"parents":["root","declination","idContentDescription"],"path":["declination",0,"idContentDescription",0,"lang"]},"year":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"year"]},"sku":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"sku"]},"setquantity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"setQuantity"]},"quantity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"quantity"]},"declinationvariationdetailid1":{"isPrimaryKey":false,"parents":["root","declination","variation1"],"path":["declination",0,"variation1","id"]},"declinationvariationdetailkey1":{"isPrimaryKey":false,"parents":["root","declination","variation1"],"path":["declination",0,"variation1","key"]},"declinationvariationdetaillabel1":{"isPrimaryKey":true,"parents":["root","declination","variation1","idContentLabel"],"path":["declination",0,"variation1","idContentLabel",0,"value"]},"declinationvariationdetaillabellang1":{"isPrimaryKey":false,"parents":["root","declination","variation1","idContentLabel"],"path":["declination",0,"variation1","idContentLabel",0,"lang"]},"declinationvariationdetailid2":{"isPrimaryKey":false,"parents":["root","declination","variation2"],"path":["declination",0,"variation2","id"]},"declinationvariationdetailkey2":{"isPrimaryKey":false,"parents":["root","declination","variation2"],"path":["declination",0,"variation2","key"]},"declinationvariationdetaillabel2":{"isPrimaryKey":true,"parents":["root","declination","variation2","idContentLabel"],"path":["declination",0,"variation2","idContentLabel",0,"value"]},"declinationvariationdetaillabellang2":{"isPrimaryKey":false,"parents":["root","declination","variation2","idContentLabel"],"path":["declination",0,"variation2","idContentLabel",0,"lang"]},"declinationvariationdetailid3":{"isPrimaryKey":false,"parents":["root","declination","variation3"],"path":["declination",0,"variation3","id"]},"declinationvariationdetailkey3":{"isPrimaryKey":false,"parents":["root","declination","variation3"],"path":["declination",0,"variation3","key"]},"declinationvariationdetaillabel3":{"isPrimaryKey":true,"parents":["root","declination","variation3","idContentLabel"],"path":["declination",0,"variation3","idContentLabel",0,"value"]},"declinationvariationdetaillabellang3":{"isPrimaryKey":false,"parents":["root","declination","variation3","idContentLabel"],"path":["declination",0,"variation3","idContentLabel",0,"lang"]},"sellByMultipleOf":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"sellByMultipleOf"]},"alcoholLevel":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"alcoholLevel"]},"temperatureMin":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"temperatureMin"]},"temperatureMax":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"temperatureMax"]},"capacity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"capacity"]},"capacityUnit":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"capacityUnit"]},"keepYearMin":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"keepYearMin"]},"keepYearMax":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"keepYearMax"]},"weight":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"weight"]},"vintagefeatureid":{"isPrimaryKey":true,"parents":["root","declination","features"],"path":["declination",0,"features",0,"id"]},"vintagefeaturelabel":{"isPrimaryKey":true,"parents":["root","declination","features","idContentLabel"],"path":["declination",0,"features",0,"idContentLabel",0,"value"]},"vintagefeaturelabellang":{"isPrimaryKey":false,"parents":["root","declination","features","idContentLabel"],"path":["declination",0,"features",0,"idContentLabel",0,"lang"]},"vintagefeaturekey":{"isPrimaryKey":false,"parents":["root","declination","features"],"path":["declination",0,"features",0,"key"]},"vintagefeaturevalue":{"isPrimaryKey":true,"parents":["root","declination","features","idContentValue"],"path":["declination",0,"features",0,"idContentValue",0,"value"]},"vintagefeaturevaluelang":{"isPrimaryKey":false,"parents":["root","declination","features","idContentValue"],"path":["declination",0,"features",0,"idContentValue",0,"lang"]},"vintagefeatureshowonwebpage":{"isPrimaryKey":false,"parents":["root","declination","features"],"path":["declination",0,"features",0,"showOnWebPage"]},"idReferenceProduct":{"isPrimaryKey":false,"parents":["root","declination","reference"],"path":["declination",0,"reference","id"]},"kindid":{"isPrimaryKey":false,"parents":["root","declination","kind"],"path":["declination",0,"kind","id"]},"kindlabel":{"isPrimaryKey":true,"parents":["root","declination","kind","idContentLabel"],"path":["declination",0,"kind","idContentLabel",0,"value"]},"kindlabellang":{"isPrimaryKey":false,"parents":["root","declination","kind","idContentLabel"],"path":["declination",0,"kind","idContentLabel",0,"lang"]},"kindcolor":{"isPrimaryKey":false,"parents":["root","declination","kind"],"path":["declination",0,"kind","color"]},"eyetasting":{"isPrimaryKey":true,"parents":["root","declination","idContentEyeTasting"],"path":["declination",0,"idContentEyeTasting",0,"value"]},"eyetastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentEyeTasting"],"path":["declination",0,"idContentEyeTasting",0,"lang"]},"nosetasting":{"isPrimaryKey":true,"parents":["root","declination","idContentNoseTasting"],"path":["declination",0,"idContentNoseTasting",0,"value"]},"nosetastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentNoseTasting"],"path":["declination",0,"idContentNoseTasting",0,"lang"]},"mouthtasting":{"isPrimaryKey":true,"parents":["root","declination","idContentMouthTasting"],"path":["declination",0,"idContentMouthTasting",0,"value"]},"mouthtastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentMouthTasting"],"path":["declination",0,"idContentMouthTasting",0,"lang"]},"productdetailstypeid":{"isPrimaryKey":true,"parents":["root","declination","details"],"path":["declination",0,"details",0,"id"]},"productdetailsfloatvalue":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"floatValue"]},"productdetailstypetype":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"type"]},"productdetailstypevalue":{"isPrimaryKey":true,"parents":["root","declination","details","idContentValue"],"path":["declination",0,"details",0,"idContentValue",0,"value"]},"productdetailstypevaluelang":{"isPrimaryKey":false,"parents":["root","declination","details","idContentValue"],"path":["declination",0,"details",0,"idContentValue",0,"lang"]},"productdetailstypecolor":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"color"]},"productdetailstypeimage":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"image"]},"productdetailstypeicon":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"icon"]},"productprice":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"price"]},"iddiscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","id"]},"labeldiscount":{"isPrimaryKey":true,"parents":["root","declination","discount","idContentLabel"],"path":["declination",0,"discount","idContentLabel",0,"value"]},"labeldiscountlang":{"isPrimaryKey":false,"parents":["root","declination","discount","idContentLabel"],"path":["declination",0,"discount","idContentLabel",0,"lang"]},"amountdiscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","amount"]},"codediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","code"]},"typediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","type"]},"detailtypediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","detailType"]},"idaward":{"isPrimaryKey":true,"parents":["root","declination","award"],"path":["declination",0,"award",0,"id"]},"iconvalue":{"isPrimaryKey":false,"parents":["root","declination","award","icon"],"path":["declination",0,"award",0,"icon","icon"]},"iconcolor":{"isPrimaryKey":false,"parents":["root","declination","award","icon"],"path":["declination",0,"award",0,"icon","color"]},"cityname":{"isPrimaryKey":false,"parents":["root","declination","award"],"path":["declination",0,"award",0,"city"]},"awardyear":{"isPrimaryKey":false,"parents":["root","declination","award"],"path":["declination",0,"award",0,"year"]},"awardtitle":{"isPrimaryKey":true,"parents":["root","declination","award","idContentTitle"],"path":["declination",0,"award",0,"idContentTitle",0,"value"]},"awardtitlelang":{"isPrimaryKey":false,"parents":["root","declination","award","idContentTitle"],"path":["declination",0,"award",0,"idContentTitle",0,"lang"]},"awardcontent":{"isPrimaryKey":true,"parents":["root","declination","award","idContentContent"],"path":["declination",0,"award",0,"idContentContent",0,"value"]},"awardcontentlang":{"isPrimaryKey":false,"parents":["root","declination","award","idContentContent"],"path":["declination",0,"award",0,"idContentContent",0,"lang"]},"idimage":{"isPrimaryKey":true,"parents":["root","declination","image"],"path":["declination",0,"image",0,"id"]},"imagefilename":{"isPrimaryKey":false,"parents":["root","declination","image"],"path":["declination",0,"image",0,"filename"]},"imageorder":{"isPrimaryKey":false,"parents":["root","declination","image"],"path":["declination",0,"image",0,"order"]},"imagealt":{"isPrimaryKey":true,"parents":["root","declination","image","idContentAlt"],"path":["declination",0,"image",0,"idContentAlt",0,"value"]},"imagealtlang":{"isPrimaryKey":false,"parents":["root","declination","image","idContentAlt"],"path":["declination",0,"image",0,"idContentAlt",0,"lang"]},"pdffilename":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"pdfFile"]},"vintageisvalid":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"isValid"]},"canBeSoldAlone":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"canBeSoldAlone"]},"vintagedatecreated":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"dateCreated"]},"vintagedatedeleted":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"dateDeleted"]},"productdatecreated":{"isPrimaryKey":false,"parents":["root"],"path":["dateCreated"]},"productdatedeleted":{"isPrimaryKey":false,"parents":["root"],"path":["dateDeleted"]},"idSite":{"isPrimaryKey":false,"parents":["root"],"path":["idSite"]},"idsubtype":{"isPrimaryKey":false,"parents":["root"],"path":["idSubType"]},"idtype":{"isPrimaryKey":false,"parents":["root","type"],"path":["type","id"]},"type":{"isPrimaryKey":false,"parents":["root","type"],"path":["type","type"]},"typelabel":{"isPrimaryKey":true,"parents":["root","type","idContentLabel"],"path":["type","idContentLabel",0,"value"]},"typelabellang":{"isPrimaryKey":false,"parents":["root","type","idContentLabel"],"path":["type","idContentLabel",0,"lang"]},"tvavalue":{"isPrimaryKey":false,"parents":["root","type","vat"],"path":["type","vat","value"]}}
      let current = {"idContentName":[{"value":"Wine 3","lang":2}],"idContentDescription":[{"value":"Wine 2 description","lang":2}],"idContentMetaDescription":[{"value":"","lang":2}],"idContentAppellation":[{"value":"","lang":2}],"declination":[{"id":1000,"idContentDescription":[{"value":"New vintage description","lang":2}],"features":[{"id":7,"idContentLabel":[{"value":"Un super label","lang":2}],"idContentValue":[{"value":"Et une value","lang":2}],"key":"un_super_label","showOnWebPage":false}],"kind":{"idContentLabel":[{"value":"Pink","lang":2}],"id":112,"color":"#D661C4"},"idContentEyeTasting":[{"value":"Eye tasting","lang":2}],"idContentNoseTasting":[{"value":"Nose tasting","lang":2}],"idContentMouthTasting":[{"value":"Mouth tasting","lang":2}],"details":[{"id":103,"idContentValue":[{"value":"Tannique","lang":2}],"type":"TASTE","color":"","icon":"","image":"","floatValue":-1}],"image":[{"id":1,"idContentAlt":[{"value":"Image alt","lang":2}],"filename":"n9iknlsurrxh2sqlygxrsdi.jpeg","order":3}],"variation1":{"id":null,"key":null,"idContentLabel":[]},"variation2":{"id":null,"key":null,"idContentLabel":[]},"variation3":{"id":null,"key":null,"idContentLabel":[]},"isValid":true,"canBeSoldAlone":true,"dateCreated":"2023-04-04T17:03:50.201Z","dateDeleted":"-Infinity","year":2020,"sku":"","setQuantity":false,"quantity":-1,"sellByMultipleOf":6,"alcoholLevel":11,"temperatureMin":10,"temperatureMax":-1,"capacity":1.5,"capacityUnit":"LITER","keepYearMin":2030,"keepYearMax":2035,"weight":1.5,"order":0,"reference":{"id":1000},"price":14,"award":[],"discount":{"idContentLabel":[],"id":null,"amount":null,"code":null,"detailType":null,"type":null},"pdfFile":"tz49mngwtest.pdf"}],"type":{"idContentLabel":[{"value":"Wine bottle","lang":2}],"id":1,"type":"WINE","vat":{"value":19.6}},"id":2,"order":1,"numberOfVariation":0,"isValid":true,"dateCreated":"2014-03-18T00:00:00.000Z","dateDeleted":"-Infinity","tags":[],"variation1":{"id":null,"idContentLabel":[],"detail":[]},"variation2":{"id":null,"idContentLabel":[],"detail":[]},"variation3":{"id":null,"idContentLabel":[],"detail":[]},"idSite":1000,"isVintage":true,"wineType":"WINE","features":[]}

      let result = converter.getListOfNewId(data, pks, parsedModel, current)

      assert.deepStrictEqual(result, [ 'vintagefeatureid', 'vintagefeaturelabel', 'vintagefeaturevalue' ])
    })

    it('should return all ids which are not null', () => {
      let data = {
        nbproducts: null,
        id: 2,
        productorder: 1,
        productnumberofvariation: 0,
        productisvalid: true,
        productdatecreated: '2014-03-18T00:00:00.000Z',
        productdatedeleted: '-Infinity',
        tagid: null,
        tagkey: null,
        taglabel: null,
        taglang: null,
        idvariation1: null,
        labelvariation1: null,
        labellangvariation1: null,
        idvariation2: null,
        labelvariation2: null,
        labellangvariation2: null,
        idvariation3: null,
        labelvariation3: null,
        labellangvariation3: null,
        variationdetailid1: null,
        variationdetailkey1: null,
        variationdetaillabel1: null,
        variationdetaillabellang1: null,
        variationdetailid2: null,
        variationdetailkey2: null,
        variationdetaillabel2: null,
        variationdetaillabellang2: null,
        variationdetailid3: null,
        variationdetailkey3: null,
        variationdetaillabel3: null,
        variationdetaillabellang3: null,
        declinationvariationdetailid1: null,
        declinationvariationdetailkey1: null,
        declinationvariationdetaillabel1: null,
        declinationvariationdetaillabellang1: null,
        declinationvariationdetailid2: null,
        declinationvariationdetailkey2: null,
        declinationvariationdetaillabel2: null,
        declinationvariationdetaillabellang2: null,
        declinationvariationdetailid3: null,
        declinationvariationdetailkey3: null,
        declinationvariationdetaillabel3: null,
        declinationvariationdetaillabellang3: null,
        vintagedescription: 'Product 6 desc',
        vintagedescriptionlang: 2,
        vintageid: 2,
        vintageisvalid: true,
        canBeSoldAlone: true,
        vintagedatecreated: '2014-03-21T00:00:00.000Z',
        vintagedatedeleted: '-Infinity',
        idSite: 1000,
        year: 2015,
        sku: '',
        setquantity: false,
        quantity: -1,
        sellByMultipleOf: 6,
        alcoholLevel: 14,
        temperatureMin: 7,
        temperatureMax: -1,
        capacity: 1.5,
        capacityUnit: 'LITER',
        keepYearMin: 2030,
        keepYearMax: 2035,
        weight: 1.5,
        vintageorder: 2,
        idReferenceProduct: 2,
        kindid: 110,
        kindcolor: '#C3C34F',
        kindlabel: 'White',
        kindlabellang: 2,
        isVintage: true,
        productwinetype: 'WINE',
        name: 'Wine 3',
        namelang: 2,
        description: 'Wine 2 description',
        descriptionlang: 2,
        idtype: 1,
        type: 'WINE',
        typelabel: 'Wine bottle',
        typelabellang: 2,
        productprice: 9.3,
        tvavalue: 19.6,
        imagealt: 'Image alt 2',
        imagealtlang: 2,
        imagefilename: '12.jpg',
        imageorder: 0,
        idimage: 401,
        productdetailstypeid: 103,
        productdetailstypetype: 'TASTE',
        productdetailstypevalue: 'Tannique',
        productdetailstypevaluelang: 2,
        productdetailstypecolor: '',
        productdetailstypeicon: '',
        productdetailstypeimage: '',
        productdetailsfloatvalue: -1,
        idaward: 101,
        iconvalue: 'fa fa-medal',
        iconcolor: '#FFEB3B',
        cityname: 'L ABERGEMENT DE VAREY',
        awardyear: 2019,
        labeldiscount: null,
        labeldiscountlang: null,
        iddiscount: null,
        amountdiscount: null,
        codediscount: null,
        detailtypediscount: null,
        typediscount: null,
        productfeatureid: null,
        productfeaturelabel: null,
        productfeaturelabellang: null,
        productfeaturekey: null,
        productfeaturevalue: null,
        productfeaturevaluelang: null,
        productfeatureshowonwebpage: null,
        vintagefeatureid: null,
        vintagefeaturelabel: null,
        vintagefeaturelabellang: null,
        vintagefeaturekey: null,
        vintagefeaturevalue: null,
        vintagefeaturevaluelang: null,
        vintagefeatureshowonwebpage: null,
        pdffilename: '',
        awardtitle: 'Award title 2',
        awardtitlelang: 2,
        awardcontent: 'Award content 2',
        awardcontentlang: 2,
        metadescription: '',
        metadescriptionlang: 2,
        appellation: '',
        appellationlang: 2,
        eyetasting: 'Eye tasting 6',
        eyetastinglang: 2,
        nosetasting: 'Nose tasting 6',
        nosetastinglang: 2,
        mouthtasting: 'Mouth tasting 6',
        mouthtastinglang: 2
      }
      let pks = [
        { keyPath: [ 'idContentName', 0 ], sqlKey: 'name', objKey: 'value' },
        {
          keyPath: [ 'idContentDescription', 0 ],
          sqlKey: 'description',
          objKey: 'value'
        },
        {
          keyPath: [ 'idContentMetaDescription', 0 ],
          sqlKey: 'metadescription',
          objKey: 'value'
        },
        {
          keyPath: [ 'idContentAppellation', 0 ],
          sqlKey: 'appellation',
          objKey: 'value'
        },
        {
          keyPath: [ 'features', 0 ],
          sqlKey: 'productfeatureid',
          objKey: 'id'
        },
        {
          keyPath: [ 'features', 0, 'idContentLabel', 0 ],
          sqlKey: 'productfeaturelabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'features', 0, 'idContentValue', 0 ],
          sqlKey: 'productfeaturevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation1', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation1',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation1', 'detail', 0 ],
          sqlKey: 'variationdetailid1',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation1', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel1',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation2', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation2',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation2', 'detail', 0 ],
          sqlKey: 'variationdetailid2',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation2', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel2',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation3', 'idContentLabel', 0 ],
          sqlKey: 'labelvariation3',
          objKey: 'value'
        },
        {
          keyPath: [ 'variation3', 'detail', 0 ],
          sqlKey: 'variationdetailid3',
          objKey: 'id'
        },
        {
          keyPath: [ 'variation3', 'detail', 0, 'idContentLabel', 0 ],
          sqlKey: 'variationdetaillabel3',
          objKey: 'value'
        },
        { keyPath: [ 'tags', 0 ], sqlKey: 'tagid', objKey: 'id' },
        {
          keyPath: [ 'tags', 0, 'idContentLabel', 0 ],
          sqlKey: 'taglabel',
          objKey: 'value'
        },
        { keyPath: [ 'declination', 0 ], sqlKey: 'vintageid', objKey: 'id' },
        {
          keyPath: [ 'declination', 0, 'idContentDescription', 0 ],
          sqlKey: 'vintagedescription',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation1', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel1',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation2', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel2',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'variation3', 'idContentLabel', 0 ],
          sqlKey: 'declinationvariationdetaillabel3',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0 ],
          sqlKey: 'vintagefeatureid',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0, 'idContentLabel', 0 ],
          sqlKey: 'vintagefeaturelabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'features', 0, 'idContentValue', 0 ],
          sqlKey: 'vintagefeaturevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'kind', 'idContentLabel', 0 ],
          sqlKey: 'kindlabel',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentEyeTasting', 0 ],
          sqlKey: 'eyetasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentNoseTasting', 0 ],
          sqlKey: 'nosetasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'idContentMouthTasting', 0 ],
          sqlKey: 'mouthtasting',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'details', 0 ],
          sqlKey: 'productdetailstypeid',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'details', 0, 'idContentValue', 0 ],
          sqlKey: 'productdetailstypevalue',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'discount', 'idContentLabel', 0 ],
          sqlKey: 'labeldiscount',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0 ],
          sqlKey: 'idaward',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0, 'idContentTitle', 0 ],
          sqlKey: 'awardtitle',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'award', 0, 'idContentContent', 0 ],
          sqlKey: 'awardcontent',
          objKey: 'value'
        },
        {
          keyPath: [ 'declination', 0, 'image', 0 ],
          sqlKey: 'idimage',
          objKey: 'id'
        },
        {
          keyPath: [ 'declination', 0, 'image', 0, 'idContentAlt', 0 ],
          sqlKey: 'imagealt',
          objKey: 'value'
        },
        {
          keyPath: [ 'type', 'idContentLabel', 0 ],
          sqlKey: 'typelabel',
          objKey: 'value'
        }
      ]
      let parsedModel = {"id":{"isPrimaryKey":false,"parents":["root"],"path":["id"]},"name":{"isPrimaryKey":true,"parents":["root","idContentName"],"path":["idContentName",0,"value"]},"namelang":{"isPrimaryKey":false,"parents":["root","idContentName"],"path":["idContentName",0,"lang"]},"description":{"isPrimaryKey":true,"parents":["root","idContentDescription"],"path":["idContentDescription",0,"value"]},"descriptionlang":{"isPrimaryKey":false,"parents":["root","idContentDescription"],"path":["idContentDescription",0,"lang"]},"metadescription":{"isPrimaryKey":true,"parents":["root","idContentMetaDescription"],"path":["idContentMetaDescription",0,"value"]},"metadescriptionlang":{"isPrimaryKey":false,"parents":["root","idContentMetaDescription"],"path":["idContentMetaDescription",0,"lang"]},"appellation":{"isPrimaryKey":true,"parents":["root","idContentAppellation"],"path":["idContentAppellation",0,"value"]},"appellationlang":{"isPrimaryKey":false,"parents":["root","idContentAppellation"],"path":["idContentAppellation",0,"lang"]},"productisvalid":{"isPrimaryKey":false,"parents":["root"],"path":["isValid"]},"isVintage":{"isPrimaryKey":false,"parents":["root"],"path":["isVintage"]},"productorder":{"isPrimaryKey":false,"parents":["root"],"path":["order"]},"productwinetype":{"isPrimaryKey":false,"parents":["root"],"path":["wineType"]},"productfeatureid":{"isPrimaryKey":true,"parents":["root","features"],"path":["features",0,"id"]},"productfeaturelabel":{"isPrimaryKey":true,"parents":["root","features","idContentLabel"],"path":["features",0,"idContentLabel",0,"value"]},"productfeaturelabellang":{"isPrimaryKey":false,"parents":["root","features","idContentLabel"],"path":["features",0,"idContentLabel",0,"lang"]},"productfeaturekey":{"isPrimaryKey":false,"parents":["root","features"],"path":["features",0,"key"]},"productfeaturevalue":{"isPrimaryKey":true,"parents":["root","features","idContentValue"],"path":["features",0,"idContentValue",0,"value"]},"productfeaturevaluelang":{"isPrimaryKey":false,"parents":["root","features","idContentValue"],"path":["features",0,"idContentValue",0,"lang"]},"productfeatureshowonwebpage":{"isPrimaryKey":false,"parents":["root","features"],"path":["features",0,"showOnWebPage"]},"productnumberofvariation":{"isPrimaryKey":false,"parents":["root"],"path":["numberOfVariation"]},"idvariation1":{"isPrimaryKey":false,"parents":["root","variation1"],"path":["variation1","id"]},"labelvariation1":{"isPrimaryKey":true,"parents":["root","variation1","idContentLabel"],"path":["variation1","idContentLabel",0,"value"]},"labellangvariation1":{"isPrimaryKey":false,"parents":["root","variation1","idContentLabel"],"path":["variation1","idContentLabel",0,"lang"]},"variationdetailid1":{"isPrimaryKey":true,"parents":["root","variation1","detail"],"path":["variation1","detail",0,"id"]},"variationdetailkey1":{"isPrimaryKey":false,"parents":["root","variation1","detail"],"path":["variation1","detail",0,"key"]},"variationdetaillabel1":{"isPrimaryKey":true,"parents":["root","variation1","detail","idContentLabel"],"path":["variation1","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang1":{"isPrimaryKey":false,"parents":["root","variation1","detail","idContentLabel"],"path":["variation1","detail",0,"idContentLabel",0,"lang"]},"idvariation2":{"isPrimaryKey":false,"parents":["root","variation2"],"path":["variation2","id"]},"labelvariation2":{"isPrimaryKey":true,"parents":["root","variation2","idContentLabel"],"path":["variation2","idContentLabel",0,"value"]},"labellangvariation2":{"isPrimaryKey":false,"parents":["root","variation2","idContentLabel"],"path":["variation2","idContentLabel",0,"lang"]},"variationdetailid2":{"isPrimaryKey":true,"parents":["root","variation2","detail"],"path":["variation2","detail",0,"id"]},"variationdetailkey2":{"isPrimaryKey":false,"parents":["root","variation2","detail"],"path":["variation2","detail",0,"key"]},"variationdetaillabel2":{"isPrimaryKey":true,"parents":["root","variation2","detail","idContentLabel"],"path":["variation2","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang2":{"isPrimaryKey":false,"parents":["root","variation2","detail","idContentLabel"],"path":["variation2","detail",0,"idContentLabel",0,"lang"]},"idvariation3":{"isPrimaryKey":false,"parents":["root","variation3"],"path":["variation3","id"]},"labelvariation3":{"isPrimaryKey":true,"parents":["root","variation3","idContentLabel"],"path":["variation3","idContentLabel",0,"value"]},"labellangvariation3":{"isPrimaryKey":false,"parents":["root","variation3","idContentLabel"],"path":["variation3","idContentLabel",0,"lang"]},"variationdetailid3":{"isPrimaryKey":true,"parents":["root","variation3","detail"],"path":["variation3","detail",0,"id"]},"variationdetailkey3":{"isPrimaryKey":false,"parents":["root","variation3","detail"],"path":["variation3","detail",0,"key"]},"variationdetaillabel3":{"isPrimaryKey":true,"parents":["root","variation3","detail","idContentLabel"],"path":["variation3","detail",0,"idContentLabel",0,"value"]},"variationdetaillabellang3":{"isPrimaryKey":false,"parents":["root","variation3","detail","idContentLabel"],"path":["variation3","detail",0,"idContentLabel",0,"lang"]},"tagid":{"isPrimaryKey":true,"parents":["root","tags"],"path":["tags",0,"id"]},"tagkey":{"isPrimaryKey":false,"parents":["root","tags"],"path":["tags",0,"key"]},"taglabel":{"isPrimaryKey":true,"parents":["root","tags","idContentLabel"],"path":["tags",0,"idContentLabel",0,"value"]},"taglang":{"isPrimaryKey":false,"parents":["root","tags","idContentLabel"],"path":["tags",0,"idContentLabel",0,"lang"]},"vintageid":{"isPrimaryKey":true,"parents":["root","declination"],"path":["declination",0,"id"]},"vintageorder":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"order"]},"vintagedescription":{"isPrimaryKey":true,"parents":["root","declination","idContentDescription"],"path":["declination",0,"idContentDescription",0,"value"]},"vintagedescriptionlang":{"isPrimaryKey":false,"parents":["root","declination","idContentDescription"],"path":["declination",0,"idContentDescription",0,"lang"]},"year":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"year"]},"sku":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"sku"]},"setquantity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"setQuantity"]},"quantity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"quantity"]},"declinationvariationdetailid1":{"isPrimaryKey":false,"parents":["root","declination","variation1"],"path":["declination",0,"variation1","id"]},"declinationvariationdetailkey1":{"isPrimaryKey":false,"parents":["root","declination","variation1"],"path":["declination",0,"variation1","key"]},"declinationvariationdetaillabel1":{"isPrimaryKey":true,"parents":["root","declination","variation1","idContentLabel"],"path":["declination",0,"variation1","idContentLabel",0,"value"]},"declinationvariationdetaillabellang1":{"isPrimaryKey":false,"parents":["root","declination","variation1","idContentLabel"],"path":["declination",0,"variation1","idContentLabel",0,"lang"]},"declinationvariationdetailid2":{"isPrimaryKey":false,"parents":["root","declination","variation2"],"path":["declination",0,"variation2","id"]},"declinationvariationdetailkey2":{"isPrimaryKey":false,"parents":["root","declination","variation2"],"path":["declination",0,"variation2","key"]},"declinationvariationdetaillabel2":{"isPrimaryKey":true,"parents":["root","declination","variation2","idContentLabel"],"path":["declination",0,"variation2","idContentLabel",0,"value"]},"declinationvariationdetaillabellang2":{"isPrimaryKey":false,"parents":["root","declination","variation2","idContentLabel"],"path":["declination",0,"variation2","idContentLabel",0,"lang"]},"declinationvariationdetailid3":{"isPrimaryKey":false,"parents":["root","declination","variation3"],"path":["declination",0,"variation3","id"]},"declinationvariationdetailkey3":{"isPrimaryKey":false,"parents":["root","declination","variation3"],"path":["declination",0,"variation3","key"]},"declinationvariationdetaillabel3":{"isPrimaryKey":true,"parents":["root","declination","variation3","idContentLabel"],"path":["declination",0,"variation3","idContentLabel",0,"value"]},"declinationvariationdetaillabellang3":{"isPrimaryKey":false,"parents":["root","declination","variation3","idContentLabel"],"path":["declination",0,"variation3","idContentLabel",0,"lang"]},"sellByMultipleOf":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"sellByMultipleOf"]},"alcoholLevel":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"alcoholLevel"]},"temperatureMin":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"temperatureMin"]},"temperatureMax":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"temperatureMax"]},"capacity":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"capacity"]},"capacityUnit":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"capacityUnit"]},"keepYearMin":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"keepYearMin"]},"keepYearMax":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"keepYearMax"]},"weight":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"weight"]},"vintagefeatureid":{"isPrimaryKey":true,"parents":["root","declination","features"],"path":["declination",0,"features",0,"id"]},"vintagefeaturelabel":{"isPrimaryKey":true,"parents":["root","declination","features","idContentLabel"],"path":["declination",0,"features",0,"idContentLabel",0,"value"]},"vintagefeaturelabellang":{"isPrimaryKey":false,"parents":["root","declination","features","idContentLabel"],"path":["declination",0,"features",0,"idContentLabel",0,"lang"]},"vintagefeaturekey":{"isPrimaryKey":false,"parents":["root","declination","features"],"path":["declination",0,"features",0,"key"]},"vintagefeaturevalue":{"isPrimaryKey":true,"parents":["root","declination","features","idContentValue"],"path":["declination",0,"features",0,"idContentValue",0,"value"]},"vintagefeaturevaluelang":{"isPrimaryKey":false,"parents":["root","declination","features","idContentValue"],"path":["declination",0,"features",0,"idContentValue",0,"lang"]},"vintagefeatureshowonwebpage":{"isPrimaryKey":false,"parents":["root","declination","features"],"path":["declination",0,"features",0,"showOnWebPage"]},"idReferenceProduct":{"isPrimaryKey":false,"parents":["root","declination","reference"],"path":["declination",0,"reference","id"]},"kindid":{"isPrimaryKey":false,"parents":["root","declination","kind"],"path":["declination",0,"kind","id"]},"kindlabel":{"isPrimaryKey":true,"parents":["root","declination","kind","idContentLabel"],"path":["declination",0,"kind","idContentLabel",0,"value"]},"kindlabellang":{"isPrimaryKey":false,"parents":["root","declination","kind","idContentLabel"],"path":["declination",0,"kind","idContentLabel",0,"lang"]},"kindcolor":{"isPrimaryKey":false,"parents":["root","declination","kind"],"path":["declination",0,"kind","color"]},"eyetasting":{"isPrimaryKey":true,"parents":["root","declination","idContentEyeTasting"],"path":["declination",0,"idContentEyeTasting",0,"value"]},"eyetastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentEyeTasting"],"path":["declination",0,"idContentEyeTasting",0,"lang"]},"nosetasting":{"isPrimaryKey":true,"parents":["root","declination","idContentNoseTasting"],"path":["declination",0,"idContentNoseTasting",0,"value"]},"nosetastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentNoseTasting"],"path":["declination",0,"idContentNoseTasting",0,"lang"]},"mouthtasting":{"isPrimaryKey":true,"parents":["root","declination","idContentMouthTasting"],"path":["declination",0,"idContentMouthTasting",0,"value"]},"mouthtastinglang":{"isPrimaryKey":false,"parents":["root","declination","idContentMouthTasting"],"path":["declination",0,"idContentMouthTasting",0,"lang"]},"productdetailstypeid":{"isPrimaryKey":true,"parents":["root","declination","details"],"path":["declination",0,"details",0,"id"]},"productdetailsfloatvalue":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"floatValue"]},"productdetailstypetype":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"type"]},"productdetailstypevalue":{"isPrimaryKey":true,"parents":["root","declination","details","idContentValue"],"path":["declination",0,"details",0,"idContentValue",0,"value"]},"productdetailstypevaluelang":{"isPrimaryKey":false,"parents":["root","declination","details","idContentValue"],"path":["declination",0,"details",0,"idContentValue",0,"lang"]},"productdetailstypecolor":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"color"]},"productdetailstypeimage":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"image"]},"productdetailstypeicon":{"isPrimaryKey":false,"parents":["root","declination","details"],"path":["declination",0,"details",0,"icon"]},"productprice":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"price"]},"iddiscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","id"]},"labeldiscount":{"isPrimaryKey":true,"parents":["root","declination","discount","idContentLabel"],"path":["declination",0,"discount","idContentLabel",0,"value"]},"labeldiscountlang":{"isPrimaryKey":false,"parents":["root","declination","discount","idContentLabel"],"path":["declination",0,"discount","idContentLabel",0,"lang"]},"amountdiscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","amount"]},"codediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","code"]},"typediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","type"]},"detailtypediscount":{"isPrimaryKey":false,"parents":["root","declination","discount"],"path":["declination",0,"discount","detailType"]},"idaward":{"isPrimaryKey":true,"parents":["root","declination","award"],"path":["declination",0,"award",0,"id"]},"iconvalue":{"isPrimaryKey":false,"parents":["root","declination","award","icon"],"path":["declination",0,"award",0,"icon","icon"]},"iconcolor":{"isPrimaryKey":false,"parents":["root","declination","award","icon"],"path":["declination",0,"award",0,"icon","color"]},"cityname":{"isPrimaryKey":false,"parents":["root","declination","award"],"path":["declination",0,"award",0,"city"]},"awardyear":{"isPrimaryKey":false,"parents":["root","declination","award"],"path":["declination",0,"award",0,"year"]},"awardtitle":{"isPrimaryKey":true,"parents":["root","declination","award","idContentTitle"],"path":["declination",0,"award",0,"idContentTitle",0,"value"]},"awardtitlelang":{"isPrimaryKey":false,"parents":["root","declination","award","idContentTitle"],"path":["declination",0,"award",0,"idContentTitle",0,"lang"]},"awardcontent":{"isPrimaryKey":true,"parents":["root","declination","award","idContentContent"],"path":["declination",0,"award",0,"idContentContent",0,"value"]},"awardcontentlang":{"isPrimaryKey":false,"parents":["root","declination","award","idContentContent"],"path":["declination",0,"award",0,"idContentContent",0,"lang"]},"idimage":{"isPrimaryKey":true,"parents":["root","declination","image"],"path":["declination",0,"image",0,"id"]},"imagefilename":{"isPrimaryKey":false,"parents":["root","declination","image"],"path":["declination",0,"image",0,"filename"]},"imageorder":{"isPrimaryKey":false,"parents":["root","declination","image"],"path":["declination",0,"image",0,"order"]},"imagealt":{"isPrimaryKey":true,"parents":["root","declination","image","idContentAlt"],"path":["declination",0,"image",0,"idContentAlt",0,"value"]},"imagealtlang":{"isPrimaryKey":false,"parents":["root","declination","image","idContentAlt"],"path":["declination",0,"image",0,"idContentAlt",0,"lang"]},"pdffilename":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"pdfFile"]},"vintageisvalid":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"isValid"]},"canBeSoldAlone":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"canBeSoldAlone"]},"vintagedatecreated":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"dateCreated"]},"vintagedatedeleted":{"isPrimaryKey":false,"parents":["root","declination"],"path":["declination",0,"dateDeleted"]},"productdatecreated":{"isPrimaryKey":false,"parents":["root"],"path":["dateCreated"]},"productdatedeleted":{"isPrimaryKey":false,"parents":["root"],"path":["dateDeleted"]},"idSite":{"isPrimaryKey":false,"parents":["root"],"path":["idSite"]},"idsubtype":{"isPrimaryKey":false,"parents":["root"],"path":["idSubType"]},"idtype":{"isPrimaryKey":false,"parents":["root","type"],"path":["type","id"]},"type":{"isPrimaryKey":false,"parents":["root","type"],"path":["type","type"]},"typelabel":{"isPrimaryKey":true,"parents":["root","type","idContentLabel"],"path":["type","idContentLabel",0,"value"]},"typelabellang":{"isPrimaryKey":false,"parents":["root","type","idContentLabel"],"path":["type","idContentLabel",0,"lang"]},"tvavalue":{"isPrimaryKey":false,"parents":["root","type","vat"],"path":["type","vat","value"]}}
      let current = {"idContentName":[{"value":"Wine 3","lang":2}],"idContentDescription":[{"value":"Wine 2 description","lang":2}],"idContentMetaDescription":[{"value":"","lang":2}],"idContentAppellation":[{"value":"","lang":2}],"declination":[{"id":1000,"idContentDescription":[{"value":"New vintage description","lang":2}],"features":[{"id":7,"idContentLabel":[{"value":"Un super label","lang":2}],"idContentValue":[{"value":"Et une value","lang":2}],"key":"un_super_label","showOnWebPage":false},{"id":8,"idContentLabel":[{"value":"Un label","lang":2}],"idContentValue":[{"value":"Et une value","lang":2}],"key":"un_label","showOnWebPage":true}],"kind":{"idContentLabel":[{"value":"Pink","lang":2}],"id":112,"color":"#D661C4"},"idContentEyeTasting":[{"value":"Eye tasting","lang":2}],"idContentNoseTasting":[{"value":"Nose tasting","lang":2}],"idContentMouthTasting":[{"value":"Mouth tasting","lang":2}],"details":[{"id":103,"idContentValue":[{"value":"Tannique","lang":2}],"type":"TASTE","color":"","icon":"","image":"","floatValue":-1}],"image":[{"id":1,"idContentAlt":[{"value":"Image alt","lang":2}],"filename":"n9iknlsurrxh2sqlygxrsdi.jpeg","order":3}],"variation1":{"id":null,"key":null,"idContentLabel":[]},"variation2":{"id":null,"key":null,"idContentLabel":[]},"variation3":{"id":null,"key":null,"idContentLabel":[]},"isValid":true,"canBeSoldAlone":true,"dateCreated":"2023-04-04T17:03:50.201Z","dateDeleted":"-Infinity","year":2020,"sku":"","setQuantity":false,"quantity":-1,"sellByMultipleOf":6,"alcoholLevel":11,"temperatureMin":10,"temperatureMax":-1,"capacity":1.5,"capacityUnit":"LITER","keepYearMin":2030,"keepYearMax":2035,"weight":1.5,"order":0,"reference":{"id":1000},"price":14,"award":[],"discount":{"idContentLabel":[],"id":null,"amount":null,"code":null,"detailType":null,"type":null},"pdfFile":"tz49mngwtest.pdf"}],"type":{"idContentLabel":[{"value":"Wine bottle","lang":2}],"id":1,"type":"WINE","vat":{"value":19.6}},"id":2,"order":1,"numberOfVariation":0,"isValid":true,"dateCreated":"2014-03-18T00:00:00.000Z","dateDeleted":"-Infinity","tags":[],"variation1":{"id":null,"idContentLabel":[],"detail":[]},"variation2":{"id":null,"idContentLabel":[],"detail":[]},"variation3":{"id":null,"idContentLabel":[],"detail":[]},"idSite":1000,"isVintage":true,"wineType":"WINE","features":[]}

      let result = converter.getListOfNewId(data, pks, parsedModel, current)

      assert.deepStrictEqual(result, [ 'vintageid', 'vintagedescription', 'kindlabel', 'eyetasting', 'nosetasting', 'mouthtasting', 'productdetailstypeid', 'productdetailstypevalue', 'idaward', 'awardtitle', 'awardcontent', 'idimage', 'imagealt' ])
    })
  })

  describe('Parse model', () => {
    it('should not set primary key if it is an object', () => {
      let model = {
        id: ['<<id>>'],
        name: ['<name>'],
        list: [{
          id: ['<<idList>>'],
          label: ['<label>']
        }]
      }

      const result = converter.parseModel(model, {}, [])

      assert.deepStrictEqual(result, {
        complexPrimaryKeys: [{
          keyPath: [ 'list', 0 ],
          objKey: 'id',
          sqlKey: 'idList'
        }],
        primaryKeys: ['idList'],
        info: {
          id: {
            isPrimaryKey: false,
            parents: [ 'root' ],
            path: [ 'id' ]
          },
          name: {
            isPrimaryKey: false,
            parents: [ 'root' ],
            path: [ 'name' ]
          },
          idList: {
            isPrimaryKey: true,
            parents: [ 'root', 'list' ],
            path: [ 'list', 0, 'id' ]
          },
          label: {
            isPrimaryKey: false,
            parents: [ 'root', 'list' ],
            path: [ 'list', 0, 'label' ]
          }
        },
        skeleton: {
          id: null,
          name: null,
          list: [ { id: null, label: null } ]
        },
        parents: [ 'root' ]
      })
    })

    it('should parse a simple model (one object with one array)', () => {
      let model = {
        id: ['<id>'],
        name: ['<name>'],
        list: [{
          id: ['<<idList>>'],
          label: ['<label>']
        }]
      }

      const result = converter.parseModel(model, {}, [])
      assert.deepStrictEqual(result, {
        complexPrimaryKeys: [{
          keyPath: [ 'list', 0 ],
          objKey: 'id',
          sqlKey: 'idList'
        }],
        primaryKeys: ['idList'],
        info: {
          id: {
            isPrimaryKey: false,
            parents: [ 'root' ],
            path: [ 'id' ]
          },
          name: {
            isPrimaryKey: false,
            parents: [ 'root' ],
            path: [ 'name' ]
          },
          idList: {
            isPrimaryKey: true,
            parents: [ 'root', 'list' ],
            path: [ 'list', 0, 'id' ]
          },
          label: {
            isPrimaryKey: false,
            parents: [ 'root', 'list' ],
            path: [ 'list', 0, 'label' ]
          }
        },
        skeleton: {
          id: null,
          name: null,
          list: [ { id: null, label: null } ]
        },
        parents: [ 'root' ]
      })
    })

    it('should parse a complex model', () => {
      let model = {
        total: ['<total>'],
        products: [{
          id: ['<<idProduct>>'],
          name: ['<productName>'],
          medals: [{
            id: ['<<idMedals>>'],
            city: ['<cityMedals>']
          }],
          foods: [{
            id: ['<<idFood>>'],
            label: ['<labelFood>']
          }],
          caracteristic: {
            weight: ['<weight>'],
            labels: [{
              id: ['<<idLabel>>'],
              name: ['<nameLabel>']
            }]
          }
        }]
      }

      const result = converter.parseModel(model, {}, [])

      assert.deepStrictEqual(result, {
        complexPrimaryKeys: [
          { keyPath: [ 'products', 0 ], objKey: 'id', sqlKey: 'idProduct' },
          { keyPath: [ 'products', 0, 'medals', 0 ], objKey: 'id', sqlKey: 'idMedals' },
          { keyPath: [ 'products', 0, 'foods', 0 ], objKey: 'id', sqlKey: 'idFood' },
          { keyPath: [ 'products', 0, 'caracteristic', 'labels', 0 ], objKey: 'id', sqlKey: 'idLabel' }
        ],
        primaryKeys: ['idProduct', 'idMedals', 'idFood', 'idLabel'],
        info: {
          total: {
            isPrimaryKey: false,
            parents: ['root'],
            path: ['total']
          },
          idProduct: {
            isPrimaryKey: true,
            parents: ['root', 'products'],
            path: ['products', 0, 'id']
          },
          productName: {
            isPrimaryKey: false,
            parents: ['root', 'products'],
            path: ['products', 0, 'name']
          },
          idMedals: {
            isPrimaryKey: true,
            parents: ['root', 'products', 'medals'],
            path: ['products', 0, 'medals', 0, 'id']
          },
          cityMedals: {
            isPrimaryKey: false,
            parents: ['root', 'products', 'medals'],
            path: ['products', 0, 'medals', 0, 'city']
          },
          idFood: {
            isPrimaryKey: true,
            parents: ['root', 'products', 'foods'],
            path: ['products', 0, 'foods', 0, 'id']
          },
          labelFood: {
            isPrimaryKey: false,
            parents: [ 'root', 'products', 'foods' ],
            path: [ 'products', 0, 'foods', 0, 'label' ]
          },
          weight: {
            isPrimaryKey: false,
            parents: [ 'root', 'products', 'caracteristic' ],
            path: [ 'products', 0, 'caracteristic', 'weight' ]
          },
          idLabel: {
            isPrimaryKey: true,
            parents: [ 'root', 'products', 'caracteristic', 'labels' ],
            path: [ 'products', 0, 'caracteristic', 'labels', 0, 'id' ]
          },
          nameLabel: {
            isPrimaryKey: false,
            parents: [ 'root', 'products', 'caracteristic', 'labels' ],
            path: [ 'products', 0, 'caracteristic', 'labels', 0, 'name' ]
          }
        },
        skeleton: {
          total: null,
          products: [
            {
              id: null,
              name: null,
              medals: [ { id: null, city: null } ],
              foods: [ { id: null, label: null } ],
              caracteristic: {
                weight: null,
                labels: [ { id: null, name: null } ]
              }
            }
          ]
        },
        parents: [ 'root' ]
      })
    })
  })

  describe('Deep merge object', () => {
    it('should merge two simple objects', () => {
      const obj1 = { id: 1, name: null }
      const obj2 = { id: null, name: 'Test' }

      converter.deepMergeObject(obj1, obj2)
      assert.deepStrictEqual(obj1, { id: 1, name: 'Test' })
    })

    it('should merge two object with sub object', () => {
      const obj1 = { id: 1, user: { firstname: 'Toto', lastname: null } }
      const obj2 = { id: null, user: { firstname: null, lastname: 'Zero' } }

      converter.deepMergeObject(obj1, obj2)
      assert.deepStrictEqual(obj1, { id: 1, user: { firstname: 'Toto', lastname: 'Zero' } })
    })

    it('should merge two object with sub sub object', () => {
      const obj1 = { id: 1, user: { firstname: 'Toto', lastname: null, grade: { id: 1, note: null } } }
      const obj2 = { id: null, user: { firstname: null, lastname: 'Zero', grade: { id: 1, note: 10 } } }

      converter.deepMergeObject(obj1, obj2)
      assert.deepStrictEqual(obj1, { id: 1, user: { firstname: 'Toto', lastname: 'Zero', grade: { id: 1, note: 10 } } })
    })

    it('should merge two object and ignore array', () => {
      const obj1 = { id: 1, users: [{ firstname: 'Toto', lastname: null }] }
      const obj2 = { id: null, user: [{ firstname: null, lastname: 'Zero' }] }

      converter.deepMergeObject(obj1, obj2)
      assert.deepStrictEqual(obj1, { id: 1, users: [{ firstname: 'Toto', lastname: null }] })
    })
  })

  describe('Set deep property', () => {
    it('should work even if we try to access values fiels in an array (avoid array values function)', () => {
      let obj = {}
      let keyPath = [ 'fields', 0, 'values', 0, 'id' ]
      let value = 2

      converter.setDeepProperty(obj, keyPath, value, null, true)

      assert.deepStrictEqual(obj, {
        fields: [{
          values: [{
            id: 2
          }]
        }]
      })
    })

    it('should push an object with an empty object in array', () => {
      let obj = {}
      let keyPath = [ 'products', 0, 'caracteristic', 'labels', 0, 'id' ]
      let value = 3

      converter.setDeepProperty(obj, keyPath, value, null, true)

      assert.deepStrictEqual(obj, {
        products: [{
          caracteristic: {
            labels: [{
              id: 3
            }]
          }
        }]
      })
    })

    it('should not set deep property for null value', () => {
      let obj = {"total":1,"products":[{"tags":[{"idContentLabel":[]}],"variation1":{"id":null,"idContentLabel":[],"detail":[{"idContentLabel":[]}]},"variation2":{"id":null,"idContentLabel":[],"detail":[{"idContentLabel":[]}]},"variation3":{"id":null,"idContentLabel":[],"detail":[{"idContentLabel":[]}]},"declination":[{"idContentDescription":[],"id":null,"isValid":null,"canBeSoldAlone":null,"dateCreated":null,"dateDeleted":null,"year":null,"sku":null,"setQuantity":null,"quantity":null,"sellByMultipleOf":null,"alcoholLevel":null,"temperatureMin":null,"temperatureMax":null,"capacity":null,"capacityUnit":null,"keepYearMin":null,"keepYearMax":null,"weight":null,"order":null,"reference":{"id":null},"kind":{"id":null,"color":null,"idContentLabel":[]},"price":null,"image":[{"idContentAlt":[],"filename":null,"order":null,"id":null}],"details":[{"idContentValue":[],"color":null,"icon":null,"image":null,"floatValue":null}],"award":[],"discount":{"idContentLabel":[],"id":null,"amount":null,"code":null,"detailType":null,"type":null}}],"idSite":null,"isVintage":null,"wineType":null,"idContentName":[],"idContentDescription":[],"type":{"id":null,"type":null,"idContentLabel":[],"vat":{"value":null}}}]}
      let keyPath = [ 'products', 0, 'features', 0, 'id' ]
      let value = null
      let startLevel = 'features'

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj.products[0].features, [])
    })

    it('should not add a key in an array', () => {
      let obj = {"products":[{"id":8,"idContentName":[{"value":"Wine 2","lang":2}],"idContentDescription":[{"value":"Wine 2 description","lang":2}],"idContentMetaDescription":[{"value":""}],"idContentAppellation":[{"value":""}],"declination":[{"id":11,"idContentDescription":[{"value":"Product 7 desc","lang":2}],"kind":{"idContentLabel":[{"value":"Red","lang":2}],"id":111,"color":"#97000B"},"idContentEyeTasting":[{"value":"Eye tasting 7"}],"idContentNoseTasting":[{"value":"Nose tasting 7"}],"idContentMouthTasting":[{"value":"Mouth tasting 7"}],"variation1":{"id":null,"key":null,"idContentLabel":[]},"variation2":{"id":null,"key":null,"idContentLabel":[]},"variation3":{"id":null,"key":null,"idContentLabel":[]},"isValid":true,"canBeSoldAlone":true,"dateCreated":"2014-03-19T00:00:00.000Z","dateDeleted":"-Infinity","year":2018,"sku":"","setQuantity":false,"quantity":100,"sellByMultipleOf":1,"alcoholLevel":15,"temperatureMin":8,"temperatureMax":9,"capacity":75,"capacityUnit":"CENTILITRE","keepYearMin":2029,"keepYearMax":-1,"weight":3.2,"order":9,"reference":{"id":11},"price":16,"image":[],"details":[],"award":[]}],"type":{"idContentLabel":[{"value":"Wine bottle","lang":2}],"id":1,"type":"WINE","vat":{"value":19.6}},"order":6,"numberOfVariation":0,"isValid":false,"dateCreated":"2014-03-25T00:00:00.000Z","dateDeleted":"-Infinity","tags":[],"variation1":{"id":null,"idContentLabel":[],"detail":[]},"variation2":{"id":null,"idContentLabel":[],"detail":[]},"variation3":{"id":null,"idContentLabel":[],"detail":[]},"idSite":1000,"isVintage":true,"wineType":"WINE"}],"total":null}
      let keyPath = [ 'products', 0, 'declination', 0, 'award', 0, 'icon', 'icon' ]
      let value = null
      let startLevel = 'icon'

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj.products[0].declination[0].award, [])
    })

    it('should set a deep property', () => {
      let obj = {}
      let keyPath = [0, 'name']
      let value = 'Toto'
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, { name: 'Toto' })
    })

    it('should set a deep property of on object in an array', () => {
      let obj = {
        products: [
          {
            id: 1,
            medals: [ { id: 1, city: 'Aizenay' } ],
            foods: [ { id: 1, label: 'Poulet' } ],
            caracteristic: {
              labels: [ { id: 1 } ]
            },
            name: 'Product 1'
          }
        ],
        total: 2
      }
      let keyPath = [ 'products', 0, 'caracteristic', 'weight' ]
      let value = 10
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, {
        products: [
          {
            id: 1,
            medals: [ { id: 1, city: 'Aizenay' } ],
            foods: [ { id: 1, label: 'Poulet' } ],
            caracteristic: {
              weight: 10,
              labels: [ { id: 1 } ]
            },
            name: 'Product 1'
          }
        ],
        total: 2
      })
    })

    it('should set deep property of an array in an object', () => {
      let obj = { products: [ { id: 1, medals: [], foods: [] } ] }
      let keyPath = [ 'products', 0, 'caracteristic', 'labels', 0, 'id' ]
      let value = 1
      let startLevel = 'products'

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, { products: [ { id: 1, medals: [], foods: [], caracteristic: { labels: [] } } ] })
    })

    it('should set a deep property with an three array', () => {
      let obj = []
      let keyPath = [ 0, 'users', 0, 'relations', 0, 'id' ]
      let value = 3
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)
      assert.deepStrictEqual(obj, [{ users: [{ relations: [{ id: 3}] }] }])
    })

    it('should set a deep property with an three array', () => {
      let obj = [{ id: 1, users: [ { id: 1 } ] }]
      let keyPath = [ 0, 'users', 0, 'relations', 0, 'id' ]
      let value = 3
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)
      assert.deepStrictEqual(obj, [{ id: 1, users: [{ id: 1, relations: [{ id: 3}] }] }])
    })

    it('should set a deep property with an array', () => {
      let obj = {}
      let keyPath = ['users', 0, 'mail']
      let value = 'a.a@a.a'
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)

      assert.deepStrictEqual(obj, { users: [{ mail: 'a.a@a.a' }] })
    })

    it('should set a deep property with an array but should start at users', () => {
      let obj = { users: [] }
      let keyPath = ['users', 0, 'mail']
      let value = 'a.a@a.a'
      let startLevel = 'users'

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)

      assert.deepStrictEqual(obj, { users: [{ mail: 'a.a@a.a' }] })
    })

    it('should set a deep property with multiple object', () => {
      let obj = {}
      let keyPath = [0, 'a', 'b', 'c', 'd', 'e', 'id']
      let value = 2
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, { a: { b: { c: { d: { e: { id: 2 } } } } } })
    })

    it('should set a deep property with multiple array', () => {
      let obj = {}
      let keyPath = [0, 'a', 0, 'c', 0, 'e', 0, 'id']
      let value = 2
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)

      assert.deepStrictEqual(obj, { a: [{ c: [{ e: [{ id: 2 }] }] }] })
    })

    it('should set a deep property of an existing object', () => {
      let obj = { id: 1, users: [{ id: 2 }] }
      let keyPath = [0, 'users', 0, 'mail']
      let value = 'a.a@a.a'
      let startLevel = null

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, { id: 1, users: [ { id: 2, mail: 'a.a@a.a' } ] })
    })

    it('should set a deep property and adapt object to start level', () => {
      let obj = { id: 1, users: [ { id: 1 } ], name: 'A1' }
      let keyPath = [ 0, 'users', 0, 'mail' ]
      let value = 'a.a'
      let startLevel = 'users'

      converter.setDeepProperty(obj, keyPath, value, startLevel, true)

      assert.deepStrictEqual(obj, { id: 1, users: [ { id: 1, mail: 'a.a' } ], name: 'A1' })
    })

    it('should work with multiple arrays', () => {
      let obj = {
        id: 1,
        users: [{
          id: 1,
          relations: [{ id: 3 } ],
          mail: 'a.a'
        }],
        name: 'A1'
      }
      let keyPath = [ 0, 'users', 0, 'relations', 0, 'mail' ]
      let value = 'b@b'
      let startLevel = 'relations'

      converter.setDeepProperty(obj, keyPath, value, startLevel)

      assert.deepStrictEqual(obj, {
        id: 1,
        users: [{
          id: 1,
          relations: [{ id: 3, mail: 'b@b' } ],
          mail: 'a.a'
        }],
        name: 'A1'
      })
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
