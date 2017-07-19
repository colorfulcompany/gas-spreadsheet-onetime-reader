import _                  from 'lodash/lodash.min'
import SimpleMultiplicity from './simple_multiplicity'

class SheetAlreadySpecified extends Error {}

class SpreadsheetOnetimeReader {
  /**
   * @param {SpreadsheetApp} app
   * @param {String}         bookId
   * @param {String}         sheetName
   * @param {Object}         opts
   */
  constructor(app, bookId, sheetName = null, opts = {}) {
    this._app    = app
    this._bookId = bookId

    this._opts   = this.defaultOpts()
    this._sheet  = undefined
    this.opts(opts)
    if ( sheetName ) {
      this.sheet(sheetName)
    }
  }

  clear() {
    this._sheet   = undefined
    this._headers = undefined
    this._values  = undefined
    this._found   = undefined
  }

  reset() {
    this._found = undefined
  }

  /**
   * @return {Object}
   */
  defaultOpts() {
    return {
      skipHeaders: 1,
      headerConverter: 'toLowerCase',
      pickFields: undefined,
      strictComparison: false
    }
  }

  /**
   * @return {Object}
   */
  opts(opts = null) {
    if ( opts ) {
      this._opts = _.merge(this._opts, opts)
    }

    return this._opts
  }

  /**
   * @return {SpreadsheetApp}
   */
  app() {
    return this._app
  }

  /**
   * @return {Spreadsheet}
   */
  book() {
    if ( !this._book ) {
      this._book = this.app().openById(this._bookId)
    }

    return this._book
  }

  /**
   * switch and return sheet object
   *
   * @param  {String} sheetName
   * @return {Sheet}
   */
  sheet(sheetName = null) {
    if ( sheetName ) {
      if ( this._sheet ) {
        throw new SheetAlreadySpecified(JSON.stringify(this._sheet))
      } else {
        let sheet = this.book().getSheetByName(sheetName)
        if ( sheet ) {
          this.clear()
          this._sheet = sheet
        }
      }
    } else {
      this._sheet = this.book().getActiveSheet()
    }

    return this._sheet
  }

  /**
   * newReader
   *
   * @param  {String} sheetName
   * @return {SpreadsheetOnetimeReader}
   */
  newReader(sheetName, opts = null) {
    return new SpreadsheetOnetimeReader(this.app(), this._bookId, sheetName, opts)
  }

  /**
   * headers
   *
   * default with toLowerCase()
   * set and return as-is
   *
   * @param {Array} headers
   * @return {Array}
   */
  headers(headers = null) {
    if ( headers ) {
      this._headers = headers
    }

    if ( !this._headers ) {
      let headers = this.rawValues()[0]
      if ( this.opts()['headerConverter'] ) {
        this._headers = headers.map((e)=> {
          return this._applyHeaderConverter(e, this.opts()['headerConverter'])
        })
      } else {
        this._headers = headers
      }
    }
  
    return this._headers;
  }
  
  /**
   * @param  {String} header
   * @param  {String} converter
   * @return {String}
   */
  _applyHeaderConverter(header, converter) {
    return header[converter]()
  }

  /**
   * @return {Array}
   */
  rawValues() {
    return this.sheet().getDataRange().getValues()
  }

  /**
   * @param  {Array} raw
   * @return {Array}
   */
  skipHeaders(raw) {
    return raw.slice(this.opts().skipHeaders, raw.length);
  }

  /**
   * @return {Array}
   */
  values() {
    if ( !this._values ) {
      this._values = this.skipHeaders(this.rawValues());
    }
    
    return this._values;
  }
  
  /**
   * @param  {String} name
   * @return {Integer}
   */
  colPos(name) {
    return this.headers().indexOf(name);
  }

  /**
   * column array specified by colName
   *
   * @param  {String} colName
   * @return {Array}
   */
  col(colName) {
    let col = this.colPos(colName)
    
    if ( col >= 0 ) {
      return this.values().map((e)=> {
        return e[col];
      });
    }
  }

  /**
   * return record selected by operator, colName and val
   *
   * select by full matching (with string or number) or pattern matching ( RegExp )
   *
   * @param  {String} colName
   * @param  {Object} needle
   * @return {Array}
   */
  search() {
    if ( arguments[1] instanceof Array ) {
      let conds        = arguments[1]
      let multiplicity = undefined
      let result       = undefined
      
      switch ( arguments[0] ) {
      case 'and':
        multiplicity = conds.length
        result       = []

        SimpleMultiplicity.from(_.flatMap(conds, (cond)=> {
          let [op, colName, needle] = cond
          return this.search(op, colName, needle)
        })).each((e, m)=> {
          if ( m == multiplicity ) { result.push(e) }
        })

        this._found = result

        return this._found
      case 'or':
        return _.uniq(_.flatMap(conds, (cond)=> {
          let [op, colName, needle] = cond

          this._found = this.search(op, colName, needle)

          return this._found
        }))
      }
    } else {
      this._found = this.values().filter((row)=> {
        return this._filterByCols(row, arguments)
      });

      return this._found
    }
  }

  /**
   * @param  {Array}     record
   * @param  {arguments} args
   * @return {Boolean}
   */
  _filterByCols(record, args) {
    let [op, colName, needle] = Array.prototype.slice.call(args, 0)

    if ( typeof needle === 'undefined' ) {
      if ( typeof console !== 'undefined' ) {
        console.warn('deprecated call search() without operator')
      }

      needle  = colName
      colName = op

      if ( typeof needle == 'string' || typeof needle == 'number' || needle instanceof String ) {
        op = '=='
      } else if ( needle instanceof RegExp ) {
        op = '~'
      }
    }

    let val = record[this.colPos(colName)]
    if ( typeof val === 'undefined' ) {
      return false
    } else {
      if ( needle instanceof Date ) {
        if ( val == '' ) {
          return false
        } else {
          val = new Date(val)
          if ( val.toString() == 'Invalid Date' ) {
            return false
          }
        }
      }
      if ( this.opts()['strictComparison'] ) {
        if ( !(needle instanceof RegExp) && (typeof val !== typeof needle) ) {
          return false;
        }
      }

      switch (op) {
      case 'is':
      case '==':
        return val == needle
      case 'eq':
      case '===':
        return val === needle
      case 'not':
      case '!=':
        return val != needle
      case '!==':
        return val !== needle
      case 'match':
      case '=~':
      case '~':
        return needle.test(val)
      case '>':
        return val > needle
      case '>=':
        return val >= needle
      case '<':
        return val < needle
      case '<=':
        return val <= needle
      case 'in':
      case 'includes':
        return _.includes(needle, val)
      default:
        return false
      }
    }
  }
  
  /**
   * @param  {Integer} num
   * @return {Array}
   */
  row(num) {
    return this.values()[num]
  }

  /**
   * @return {Array}
   */
  fieldsForWriting() {
    return this.opts().pickFields || this.headers()
  }

  /**
   * @param  {Array} record
   * @return {Object}
   */
  toObject(record = null) {
    if ( record ) {
      let hash = {}
    
      this.fieldsForWriting().forEach((e, i)=> {
        hash[e] = record[i];
      });

      return hash;
    } else if ( this._found && this._found.length > 0 ) {
      return this._found.map((e)=> {
        return this.toObject(e)
      })
    } else {
      return {}
    }
  }
}

export { SheetAlreadySpecified, SpreadsheetOnetimeReader as default }
