import assert from 'power-assert'
import sinon  from 'sinon'
import fs     from 'fs'

import SpreadsheetOnetimeReader from '../lib/spreadsheet_onetime_reader'

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
    it('miss first array', ()=> {
      assert.deepEqual([ [1, 2, 3], [4, 5, 6] ], spreadsheet.skipHeaders([ [0, 0, 0], [1, 2, 3], [4, 5, 6] ]))
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
  
  describe('#findByCol', ()=> {
    describe('single arg', ()=> {
      describe('full match', ()=> {
        it('given number and found and return array of array', ()=> {
          assert.deepEqual(
            [3, "kikuke", "United Kingdom"],
            spreadsheet.findByCol('id', 3)[0]
          )
        })
        it('given string and found and return array of array', ()=> {
          assert.deepEqual(
            [3, "kikuke", "United Kingdom"],
            spreadsheet.findByCol('id', '3')[0]
          )
        })
        it('given number and not found and return empty array', ()=> {
          assert.deepEqual([], spreadsheet.findByCol('id', 1234567890))
        })
      })
      describe('pattern match', ()=> {
        it('given RE object and found and return array of array', ()=> {
          assert.deepEqual(
            [
              [2, "eoka", "United States"],
              [3, "kikuke", "United Kingdom"]
            ],
            spreadsheet.findByCol('country', /^United/)
          )
        })
        it('given RE object and not found and return empty array', ()=> {
          assert.deepEqual([], spreadsheet.findByCol('id', /[a-z]/))
        })
      })
    })

    describe('multiple args', ()=> {
      describe('or', ()=> {
        it('uniq', ()=> {
          assert.deepEqual(
            [1, 2, 3],
            spreadsheet.findByCol('or', [ ['id', 1], ['country', /^United/] ]).map((e)=> {return e[0]})
          )
        })
        it('duplicated', ()=> {
          assert.deepEqual(
            [2, 3],
            spreadsheet.findByCol('or', [ ['country', /United/], ['country', /States/] ]).map((e)=> {return e[0]})
          )
        })
        it('not found and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.findByCol('or', [ ['id', 1000], ['prefecture', 'tokyo'] ])
          )
        })
      })
      
      describe('and', ()=> {
        it('found', ()=> {
          assert.deepEqual(
            [2, 3],
            spreadsheet.findByCol('and', [ ['id', /^[0-9]{1}$/], ['country', /United/] ]).map((e)=> {return e[0]})
          )
        })
        it('two conds given and found only each one cond and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.findByCol('and', [ ['id', 2], ['country', 'Japan'] ])
          )
        })
        it('not found and return empty array', ()=> {
          assert.deepEqual(
            [],
            spreadsheet.findByCol('and', [ ['id', 10], ['country', 'China'] ])
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
  })
})

