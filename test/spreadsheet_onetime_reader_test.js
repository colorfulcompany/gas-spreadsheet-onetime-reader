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
    spreadsheet = new SpreadsheetOnetimeReader('abc')
    sinon.stub(spreadsheet, 'rawValues').returns(fullValues)
  })
  afterEach(() => {
    if ( typeof spreadsheet.rawValues.restore !== 'undefined' ) { spreadsheet.rawValues.restore() }
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
    it('include id, name, country', ()=> {
      assert.deepEqual(['id', 'name', 'country'], spreadsheet.headers())
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
    it('1, 2, and missing is assigned with undefined', ()=> {
      assert.deepEqual(
        {
          id:         1,
          name:       2,
          country:    undefined
        },
        spreadsheet.toObject([1, 2]))
    })
  })
})

