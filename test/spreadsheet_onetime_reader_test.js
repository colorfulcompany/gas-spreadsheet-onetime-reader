import assert from 'power-assert'
import sinon  from 'sinon'
import fs     from 'fs'

import SpreadsheetOnetimeReader, { SheetAlreadySpecified } from '../lib/spreadsheet_onetime_reader'

describe('SpreadsheetOnetimeReader', ()=> {
  var spreadsheet = undefined;
  var fullValues = [
    ["id", "name", "country"],
    [1, "aiu", "Japan"],
    [2, "eoka", "United States"],
    [3, "kikuke", "United Kingdom"]
  ]
  
  beforeEach(()=> {
    spreadsheet = new SpreadsheetOnetimeReader('abc', {openById: function(){}})
    sinon.stub(spreadsheet, 'rawValues').returns(fullValues)
    sinon.stub(spreadsheet, 'book').returns({getSheetByName: function(){ return {} }})
  })
  afterEach(() => {
    if ( typeof spreadsheet.rawValues.restore !== 'undefined' ) { spreadsheet.rawValues.restore() }
  })

  describe('#opts', ()=> {
    describe('getter', ()=> {
      describe('default skip_headers', ()=> {
        it('1', ()=> {
          assert.equal(1, spreadsheet.opts().skip_headers)
        })
      })
      describe('given {skip_headers: 2}', ()=> {
        beforeEach(()=> {
          spreadsheet = new SpreadsheetOnetimeReader('abc', {}, {skip_headers: 2})
        })
        it('2', ()=> {
          assert.equal(2, spreadsheet.opts().skip_headers)
        })
      })
    })

    describe('setter', ()=> {
      describe("given {foo: 'bar'}", ()=> {
        it("return {skip_headers: 1, foo: 'bar'}", ()=> {
          assert.deepEqual(
            {
              skip_headers: 1,
              header_converter: 'toLowerCase',
              foo: 'bar'
            },
            spreadsheet.opts({foo: 'bar'})
          )
        })
      })

      describe("given {skip_headers: 0}", ()=> {
        describe('return value', ()=> {
          it('', ()=> {
            assert.deepEqual(
              {
                skip_headers: 0,
                header_converter: 'toLowerCase'
              },
              spreadsheet.opts({skip_headers: 0})
            )
          })
        })

        describe('set and get', ()=> {
          beforeEach(()=> {
            spreadsheet.opts({skip_headers: 0})
          })
          it('', ()=> {
            assert.deepEqual(
              {
                skip_headers: 0,
                header_converter: 'toLowerCase'
              },
              spreadsheet.opts())
          })
        })
      })
    })
  })

  describe('#sheet', ()=> {
    var values = undefined

    beforeEach(()=> {
      values = spreadsheet.values()
    })

    describe('', ()=> {
      it('values() memoize', ()=> {
        assert( spreadsheet._values.length > 0 )
      })
    })

    describe('clear memoized _values when switch sheet', ()=> {
      it('', ()=> {
        spreadsheet.sheet('foo')
        assert.equal( 'undefined', typeof spreadsheet._values )
      })
    })

    describe('sheet specified twice is not allowed', ()=> {
      beforeEach(()=> {
        spreadsheet.sheet('foo')
      })
      it('throw error', ()=> {
        assert.throws(()=> {spreadsheet.sheet('bar')}, /{}/)
      })
    })
  })

  describe('#newReader', ()=> {
    beforeEach(()=> {
      spreadsheet.sheet('foo')
      sinon.stub(SpreadsheetOnetimeReader.prototype, 'book').returns({getSheetByName: function(){}})
    })
    afterEach(()=> {
      SpreadsheetOnetimeReader.prototype.book.restore()
    })

    it('return new instance', ()=> {
      assert(spreadsheet.newReader('bar') instanceof SpreadsheetOnetimeReader)
    })
  })

  describe('#rawValues', ()=> {
    it('type of whole values', ()=> {
      assert(Array.isArray(spreadsheet.rawValues()))
    });
    it('type of first value', ()=> {
      assert(Array.isArray(spreadsheet.rawValues().slice(0, 1)))
    });
  });

  describe('#headers', ()=> {
    describe('getter', ()=> {
      it('include id, name, country', ()=> {
        assert.deepEqual(['id', 'name', 'country'], spreadsheet.headers())
      })
    })

    describe('setter', ()=> {
      beforeEach(()=> {
        spreadsheet.headers(['first', 'middle', 'last'])
      })

      it('as is', ()=> {
        assert.deepEqual(['first', 'middle', 'last'], spreadsheet.headers())
      })
    })
  });

  describe('#skipHeaders', ()=> {
    describe('default skip_headers', ()=> {
      it('miss first array', ()=> {
        assert.deepEqual([ [1, 2, 3], [4, 5, 6] ], spreadsheet.skipHeaders([ [0, 0, 0], [1, 2, 3], [4, 5, 6] ]))
      })
    })

    describe('given {skip_headers: 2} option', ()=> {
      beforeEach(()=> {
        spreadsheet = new SpreadsheetOnetimeReader('abc', null, {skip_headers: 2})
      })

      it('trim 2 lines from head', ()=> {
        assert.deepEqual([ [4, 5, 6] ], spreadsheet.skipHeaders([ [0, 0, 0], [1, 2, 3], [4, 5, 6] ]))
      })
    })
  });

  describe('#colPos', ()=> {
    describe('[id, prefecture, category]', ()=> {
      beforeEach(()=> {
        sinon.stub(spreadsheet, 'headers').returns(['id', 'prefecture', 'category'])
      })
      it('id is pos 0', ()=> {
        assert.equal(0, spreadsheet.colPos('id'))
      })
      it('category is pos 2', ()=> {
        assert.equal(2, spreadsheet.colPos('category'))
      })
      it('abc is pos -1 (undefined)', ()=> {
        assert.equal(-1, spreadsheet.colPos('abc'))
      })
    })
  })

  describe('#col', ()=> {
    beforeEach(()=> {
      spreadsheet.rawValues.restore()
      sinon.stub(spreadsheet, 'rawValues').returns(fullValues)
    })
    
    it('has given valid colName coutry and return valid array', ()=> {
      assert.deepEqual(
        ["Japan", "United States", "United Kingdom"],
        spreadsheet.col('country')
      )
    })
    it('has invalid colName and return undefined', ()=> {
      assert.equal(undefined, spreadsheet.col('foo'))
    })
  })
  
  describe('#search', ()=> {
    describe('single arg', ()=> {
      describe('full match', ()=> {
        it('given number and found and return array of array', ()=> {
          assert.deepEqual(
            [3, "kikuke", "United Kingdom"],
            spreadsheet.search('id', 3)[0]
          )
        })
        it('given string and found and return array of array', ()=> {
          assert.deepEqual(
            [3, "kikuke", "United Kingdom"],
            spreadsheet.search('id', '3')[0]
          )
        })
        it('given number and not found and return empty array', ()=> {
          assert.deepEqual([], spreadsheet.search('id', 1234567890))
        })
      })
      describe('pattern match', ()=> {
        it('given RE object and found and return array of array', ()=> {
          assert.deepEqual(
            [
              [2, "eoka", "United States"],
              [3, "kikuke", "United Kingdom"]
            ],
            spreadsheet.search('country', /^United/)
          )
        })
        it('given RE object and not found and return empty array', ()=> {
          assert.deepEqual([], spreadsheet.search('id', /[a-z]/))
        })
      })
    })

    describe('multiple args', ()=> {
      describe('or', ()=> {
        it('uniq', ()=> {
          assert.deepEqual(
            [1, 2, 3],
            spreadsheet.search('or', [ ['id', 1], ['country', /^United/] ]).map((e)=> {return e[0]})
          )
        })
        it('duplicated', ()=> {
          assert.deepEqual(
            [2, 3],
            spreadsheet.search('or', [ ['country', /United/], ['country', /States/] ]).map((e)=> {return e[0]})
          )
        })
        it('not found and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.search('or', [ ['id', 1000], ['prefecture', 'tokyo'] ])
          )
        })
      })
      
      describe('and', ()=> {
        it('found', ()=> {
          assert.deepEqual(
            [2, 3],
            spreadsheet.search('and', [ ['id', /^[0-9]{1}$/], ['country', /United/] ]).map((e)=> {return e[0]})
          )
        })
        it('two conds given and found only each one cond and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.search('and', [ ['id', 2], ['country', 'Japan'] ])
          )
        })
        it('not found and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.search('and', [ ['id', 10], ['country', 'China'] ])
          )
        })
      })
    })
  })

  describe('#row', ()=> {
    beforeEach(()=> {
      spreadsheet.rawValues.restore()
      sinon.stub(spreadsheet, 'rawValues').returns(fullValues)
    })
    
    it('row 0 is [1, "aiu", "Japan"]', ()=> {
      assert.deepEqual([1, "aiu", "Japan"], spreadsheet.row(0))
    })
    it('row 4 is undefined', ()=> {
      assert.equal(undefined, spreadsheet.row(4))
    })
  })
  
  describe('#toObject', ()=> {
    describe('1, 2, and missing is assigned with undefined', ()=> {
      it('{id: 1, name: 2, country: undefined},', ()=> {
        assert.deepEqual(
          {
            id:         1,
            name:       2,
            country:    undefined
          },
          spreadsheet.toObject([1, 2]))
      })
    })

    describe('with modified headers [first, last]', ()=> {
      beforeEach(()=> {
        spreadsheet.headers(['first', 'last'])
      })

      it('given [1, 2] and return {first: 1, last: 2}', ()=> {
        assert.deepEqual({first: 1, last: 2}, spreadsheet.toObject([1, 2]))
      })

      it('given [1, 2, 3] and trim last col', ()=> {
        assert.deepEqual({first: 1, last: 2}, spreadsheet.toObject([1, 2, 3]))
      })
    })

    describe('search result', ()=> {
      describe('result exists', ()=> {
        beforeEach(()=> {
          spreadsheet.search('country', /^United/)
        })

        it('search, then return result array of object [ {}, {} ]', ()=> {
          assert.deepEqual(
            [
              {id: 2, name: 'eoka',   country: 'United States'},
              {id: 3, name: 'kikuke', country: 'United Kingdom'}
            ],
            spreadsheet.toObject()
          )
        })
      })

      describe('result not exists', ()=> {
        beforeEach(()=> {
          spreadsheet.reset()
        })

        it('{}', ()=> {
          assert.deepEqual({}, spreadsheet.toObject())
        })
      })
    })
  })
})
