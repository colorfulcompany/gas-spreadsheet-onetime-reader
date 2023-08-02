/* global describe, it, beforeEach, afterEach, before */

import assert from 'power-assert'
import sinon from 'sinon'
import gas from 'gas-local'

const app = gas.require('./src', {
  console
})

describe('SpreadsheetOnetimeReader', () => {
  let reader
  const fullValues = [
    ['id', 'name', 'country'],
    [1, 'aiu', 'Japan'],
    [2, 'eoka', 'United States'],
    [3, 'kikuke', 'United Kingdom']
  ]
  // fake Sheet class
  const fakeSheet = {
    getDataRange () {
      return {
        getValues () {
          return fullValues
        }
      }
    }
  }
  // fake SpreadsheetApp
  const dummyApp = {
    openById () {
      return {
        getSheetByName () { return fakeSheet },
        getActiveSheet () { return fakeSheet }
      }
    },
    getActiveSpreadsheet () {
      return { getId () {} }
    }
  }

  beforeEach(() => {
    reader = app.createSheetReader(dummyApp, 'abc')
  })

  describe('#createSheetReader', () => {
    let mockApp, mockActiveSpreadsheet

    afterEach(() => { mockApp.restore() })

    function makeActiveSpreadsheetMock (app) {
      mockApp = sinon.mock(dummyApp)
      mockApp.expects('getActiveSpreadsheet').once().returns((() => {
        const dummyActiveSpreadsheet = {
          getId () {}
        }
        mockActiveSpreadsheet = sinon.mock(dummyActiveSpreadsheet)
        mockActiveSpreadsheet.expects('getId').once()

        return dummyActiveSpreadsheet
      })())
    }

    describe('with SpreadsheetApp only', () => {
      // Spreadsheet も Sheet も Active なものを取得
      beforeEach(() => { makeActiveSpreadsheetMock(dummyApp) })

      it('auto set from active spreadsheet', () => {
        reader = app.createSheetReader(dummyApp)
        reader.rawValues()

        mockApp.verify()
        mockActiveSpreadsheet.verify()
      })
    })

    describe('and spreadsheet id', () => {
      // 与えられた Spreadsheet Id から取得
      beforeEach(() => {
        mockApp = sinon.mock(dummyApp)
        mockApp.expects('getActiveSpreadsheet').never()
      })

      it('manual set from given spreadsheet', () => {
        reader = app.createSheetReader(dummyApp, 'def')
        reader.rawValues()

        mockApp.verify()
      })
    })

    describe('with spreadsheet and sheet', () => {
      // 与えられた Spreadsheet Id から取得
      // see #sheet test
      beforeEach(() => {
        mockApp = sinon.mock(dummyApp)
        mockApp.expects('getActiveSpreadsheet').never()
      })

      it('manually set spreadsheet id and sheet name', () => {
        reader = app.createSheetReader(dummyApp, 'abc', 'Sheet 1')
        reader.rawValues()

        assert(Array.isArray(reader.rawValues()))
        mockApp.verify()
      })
    })
  })

  describe('#opts', () => {
    describe('getter', () => {
      describe('default skipHeaders', () => {
        it('1', () => {
          assert.equal(1, reader.opts().skipHeaders)
        })
      })
      describe('given {skipHeaders: 2}', () => {
        beforeEach(() => {
          reader = app.createSheetReader(dummyApp, 'abc', null, { skipHeaders: 2 })
        })
        it('2', () => {
          assert.equal(2, reader.opts().skipHeaders)
        })
      })
    })

    describe('setter', () => {
      describe("given {foo: 'bar'}", () => {
        it("return {skipHeaders: 1, foo: 'bar'}", () => {
          assert.deepEqual(
            {
              skipHeaders: 1,
              headerConverter: 'toLowerCase',
              pickFields: undefined,
              foo: 'bar',
              strictComparison: false
            },
            reader.opts({ foo: 'bar' })
          )
        })
      })

      describe('given {skipHeaders: 0}', () => {
        describe('return value', () => {
          it('', () => {
            assert.deepEqual(
              {
                skipHeaders: 0,
                headerConverter: 'toLowerCase',
                pickFields: undefined,
                strictComparison: false
              },
              reader.opts({ skipHeaders: 0 })
            )
          })
        })

        describe('set and get', () => {
          beforeEach(() => {
            reader.opts({ skipHeaders: 0 })
          })
          it('', () => {
            assert.deepEqual(
              {
                skipHeaders: 0,
                headerConverter: 'toLowerCase',
                pickFields: undefined,
                strictComparison: false
              },
              reader.opts())
          })
        })
      })
    })
  })

  describe('#sheet', () => {
    let values // eslint-disable-line no-unused-vars

    beforeEach(() => { // for only memoize
      values = reader.values()
    })

    describe('', () => {
      it('values() memoize', () => {
        assert(reader._values.length > 0)
      })
    })

    describe('sheet specified twice is not allowed', () => {
      it('throw error', () => {
        assert.throws(() => { reader.sheet('bar') }, /{}/)
      })
    })

    describe('not specified sheetName and return ActiveSheet', () => {
      let book
      afterEach(() => { book.restore() })

      it('called getActiveSheet()', () => {
        book = sinon.mock(reader.book())
        book.expects('getActiveSheet').once()
        book.expects('getSheetByName').never()
        reader.sheet()

        book.verify()
      })
    })
  })

  /*
  describe('#newReader', () => {
    beforeEach(() => {
      reader.sheet('foo')
      sinon.stub(SpreadsheetOnetimeReader.prototype, 'book').returns({ getSheetByName: function () {} })
    })
    afterEach(() => {
      SpreadsheetOnetimeReader.prototype.book.restore()
    })

    it('return new instance', () => {
      assert(reader.newReader('bar') instanceof SpreadsheetOnetimeReader)
    })
  })
  */

  describe('#rawValues', () => {
    it('type of whole values', () => {
      assert(Array.isArray(reader.rawValues()))
    })
    it('type of first value', () => {
      assert(Array.isArray(reader.rawValues().slice(0, 1)))
    })
  })

  describe('#headers', () => {
    describe('getter', () => {
      it('include id, name, country', () => {
        assert.deepEqual(['id', 'name', 'country'], reader.headers())
      })
    })

    describe('setter', () => {
      beforeEach(() => {
        reader.headers(['first', 'middle', 'last'])
      })

      it('as is', () => {
        assert.deepEqual(['first', 'middle', 'last'], reader.headers())
      })
    })
  })

  describe('#skipHeaders', () => {
    describe('default skipHeaders', () => {
      it('miss first array', () => {
        assert.deepEqual([[1, 2, 3], [4, 5, 6]], reader.skipHeaders([[0, 0, 0], [1, 2, 3], [4, 5, 6]]))
      })
    })

    describe('given {skipHeaders: 2} option', () => {
      beforeEach(() => {
        reader = app.createSheetReader(dummyApp, 'abc', null, { skipHeaders: 2 })
      })

      it('trim 2 lines from head', () => {
        assert.deepEqual([[4, 5, 6]], reader.skipHeaders([[0, 0, 0], [1, 2, 3], [4, 5, 6]]))
      })
    })
  })

  describe('#colPos', () => {
    describe('[id, prefecture, category]', () => {
      beforeEach(() => {
        sinon.stub(reader, 'headers').returns(['id', 'prefecture', 'category'])
      })
      it('id is pos 0', () => {
        assert.equal(0, reader.colPos('id'))
      })
      it('category is pos 2', () => {
        assert.equal(2, reader.colPos('category'))
      })
      it('abc is pos -1 (undefined)', () => {
        assert.equal(-1, reader.colPos('abc'))
      })
    })
  })

  describe('#col', () => {
    it('has given valid colName coutry and return valid array', () => {
      assert.deepEqual(
        ['Japan', 'United States', 'United Kingdom'],
        reader.col('country')
      )
    })
    it('has invalid colName and return undefined', () => {
      assert.equal(undefined, reader.col('foo'))
    })
  })

  describe('#search', () => {
    describe('single arg', () => {
      describe('full match', () => {
        it('given number and found and return array of array', () => {
          assert.deepEqual(
            [3, 'kikuke', 'United Kingdom'],
            reader.search('==', 'id', 3)[0]
          )
        })
        it('given string and found and return array of array', () => {
          assert.deepEqual(
            [3, 'kikuke', 'United Kingdom'],
            reader.search('==', 'id', '3')[0]
          )
        })
        it('given number and not found and return empty array', () => {
          assert.deepEqual([], reader.search('==', 'id', 1234567890))
        })
      })
      describe('pattern match', () => {
        it('given RE object and found and return array of array', () => {
          assert.deepEqual(
            [
              [2, 'eoka', 'United States'],
              [3, 'kikuke', 'United Kingdom']
            ],
            reader.search('~', 'country', /^United/)
          )
        })
        it('given RE object and not found and return empty array', () => {
          assert.deepEqual([], reader.search('~', 'id', /[a-z]/))
        })
      })
      it('<', () => {
        assert.deepEqual(
          [[1, 'aiu', 'Japan']],
          reader.search('<', 'id', 2))
      })
      it('>=', () => {
        assert.deepEqual(
          [
            [2, 'eoka', 'United States'],
            [3, 'kikuke', 'United Kingdom']
          ],
          reader.search('>=', 'id', 2))
      })
    })

    describe('multiple args', () => {
      describe('or', () => {
        it('uniq', () => {
          assert.deepEqual(
            [1, 2, 3],
            reader.search(
              'or',
              [['==', 'id', 1], ['~', 'country', /^United/]]
            ).map((e) => { return e[0] })
          )
        })
        it('duplicated', () => {
          assert.deepEqual(
            [2, 3],
            reader.search(
              'or',
              [['~', 'country', /United/], ['~', 'country', /States/]]
            ).map((e) => { return e[0] })
          )
        })
        it('not found and return empty array', () => {
          assert.deepEqual(
            [],
            reader.search('or', [['==', 'id', 1000], ['==', 'prefecture', 'tokyo']])
          )
        })
      })

      describe('and', () => {
        it('found', () => {
          assert.deepEqual(
            [2, 3],
            reader.search(
              'and',
              [['~', 'id', /^[0-9]{1}$/], ['~', 'country', /United/]]
            ).map((e) => { return e[0] })
          )
        })
        it('two conds given and found only each one cond and return empty array', () => {
          assert.deepEqual(
            [],
            reader.search('and', [['==', 'id', 2], ['==', 'country', 'Japan']])
          )
        })
        it('not found and return empty array', () => {
          assert.deepEqual(
            [],
            reader.search('and', [['==', 'id', 10], ['==', 'country', 'China']])
          )
        })
      })

      describe('conds tree', () => {
        beforeEach(() => {
          sinon.stub(reader, 'rawValues').returns(
            [
              ['id', 'name', 'country'],
              ['', 'mighty', ''],
              [1, 'aiu', 'Japan'],
              [2, 'eoka', 'United States'],
              [3, 'kikuke', 'United Kingdom']
            ])
        })
        afterEach(() => {
          reader.rawValues.restore()
        })

        it('or-and', () => {
          assert.deepEqual(
            [
              [2, 'eoka', 'United States'],
              ['', 'mighty', '']
            ],
            reader.search(
              'or',
              [
                [
                  'and',
                  [
                    ['~', 'country', /^United/],
                    ['<', 'id', 3]
                  ]
                ],
                ['==', 'id', '']
              ]
            ))
        })

        it('and-or', () => {
          // '' is same as 0 with comparison operator
          assert.deepEqual(
            [
              ['', 'mighty', '']
            ],
            reader.search(
              'and',
              [
                [
                  'or',
                  [
                    ['<', 'id', 2],
                    ['~', 'country', /^United/]
                  ]
                ],
                ['==', 'id', '']
              ]
            )
          )
        })
      })
    })
  })

  describe('#_filterByCols', () => {
    const record = [1, 'aiu', 'country']

    describe('with operator', () => {
      describe('==', () => {
        it("wrong order 'id', '==', 1", () => {
          assert.equal(
            false,
            reader._filterByCols(record, ['id', '==', 1]))
        })

        it("correct order '==', 'id', 1", () => {
          assert(reader._filterByCols(record, ['==', 'id', 1]))
        })
      })
      it('!= causes false', () => {
        assert.equal(false, reader._filterByCols(record, ['!=', 'id', 1]))
      })
      it('=== causes false', () => {
        assert.equal(false, reader._filterByCols(record, ['===', 'id', '1']))
      })
      it('< causes true', () => {
        assert.equal(true, reader._filterByCols(record, ['<', 'id', 2]))
      })
      it('> causes false', () => {
        assert.equal(false, reader._filterByCols(record, ['>', 'id', 1]))
      })
      it('>= causes true', () => {
        assert.equal(true, reader._filterByCols(record, ['>=', 'id', 1]))
      })

      describe('compare with empty string', () => {
        it('>= not match', () => {
          assert.equal(false, reader._filterByCols(['', '', ''], ['>=', 'id', 1]))
        })
      })

      describe('strictComparison', () => {
        before('default', () => {
          it("'' < 1 is true", () => {
            assert.equal(true,
              reader._filterByCols(['', '', ''],
                ['<', 'id', 1]))
          })
        })

        describe('strict', () => {
          beforeEach(() => {
            reader.opts({ strictComparison: true })
          })
          it("'' < 1 is false", () => {
            assert.equal(false,
              reader._filterByCols(['', '', ''],
                ['<', 'id', 1]))
          })
        })

        describe('in', () => {
          it('4 is included in [2, 4, 6]', () => {
            assert.equal(
              true,
              reader._filterByCols([4, '', ''],
                ['in', 'id', [2, 4, 6]])
            )
          })
          it('4 is not included in [2, 5, 6]', () => {
            assert.equal(
              false,
              reader._filterByCols([4, '', ''],
                ['in', 'id', [2, 5, 6]])
            )
          })
        })
      })
    })
  })

  describe('#row', () => {
    it('row 0 is [1, "aiu", "Japan"]', () => {
      assert.deepEqual([1, 'aiu', 'Japan'], reader.row(0))
    })
    it('row 4 is undefined', () => {
      assert.equal(undefined, reader.row(4))
    })
  })

  describe('#fieldsForWriting', () => {
    describe('default', () => {
      it('same as header()', () => {
        assert.deepEqual(['id', 'name', 'country'],
          reader.fieldsForWriting())
      })
    })

    describe('set id and name only', () => {
      beforeEach(() => {
        reader.opts({ pickFields: ['id', 'name'] })
      })

      it('id and name only', () => {
        assert.deepEqual(['id', 'name'], reader.fieldsForWriting())
      })
    })
  })

  describe('#toObject', () => {
    describe('1, 2, and missing is assigned with undefined', () => {
      it('{id: 1, name: 2, country: undefined},', () => {
        assert.deepEqual(
          {
            id: 1,
            name: 2,
            country: undefined
          },
          reader.toObject([1, 2]))
      })
    })

    describe('with modified headers [first, last]', () => {
      const headerOrSkipFieldsTest = () => {
        it('given [1] and return {first: 1, last: null}', () => {
          assert.deepEqual({ first: 1, last: null }, reader.toObject([1]))
        })

        it('given [1, 2] and return {first: 1, last: 2}', () => {
          assert.deepEqual({ first: 1, last: 2 }, reader.toObject([1, 2]))
        })

        it('given [1, 2, 3] and trim last col', () => {
          assert.deepEqual({ first: 1, last: 2 }, reader.toObject([1, 2, 3]))
        })
      }

      describe('with headers()', () => {
        beforeEach(() => {
          reader.headers(['first', 'last'])
        })
        headerOrSkipFieldsTest()
      })

      describe("with opts['pickFields']", () => {
        beforeEach(() => {
          reader.opts({ pickFields: ['first', 'last'] })
        })
        headerOrSkipFieldsTest()
      })
    })

    describe('search result', () => {
      describe('result exists', () => {
        beforeEach(() => {
          reader.search('~', 'country', /^United/)
        })

        it('search, then return result array of object [ {}, {} ]', () => {
          assert.deepEqual(
            [
              { id: 2, name: 'eoka', country: 'United States' },
              { id: 3, name: 'kikuke', country: 'United Kingdom' }
            ],
            reader.toObject()
          )
        })

        describe('w/ pickFields', () => {
          beforeEach(() => {
            reader.opts({ pickFields: ['id', 'name'] })
          })
          it('narrowed w/ pickFields', () => {
            assert.deepEqual(
              [
                { id: 2, name: 'eoka' },
                { id: 3, name: 'kikuke' }
              ],
              reader.toObject()
            )
          })
        })
      })

      describe('result not exists', () => {
        beforeEach(() => {
          reader.reset()
        })

        it('{}', () => {
          assert.deepEqual({}, reader.toObject())
        })
      })
    })
  })
})
