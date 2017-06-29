import _                      from 'lodash'
import SimpleMultiplicity from './simple_multiplicity'

class SheetAlreadySpecified extends Error {}

class SpreadsheetOnetimeReader {
  /**
   * @param String bookId
   * @param SpreadsheetApp app
   * @param Object         opts
   */
  constructor(bookId, app, opts = {}) {
    this._bookId = bookId
    this._app    = app
    this._opts   = this.default_opts()
    this.clear()
    this.opts(opts)
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
   * @return Object
   */
  default_opts() {
    return {
      skip_headers: 1,
      header_converter: 'toLowerCase'
    }
  }

  /**
   * @return Object
   */
  opts(opts = null) {
    if ( opts ) {
      this._opts = _.merge(this._opts, opts)
    }

    return this._opts
  }

  /**
   * @return Object
   */
  app() {
    return this._app
  }

  /**
   * @return Object
   */
  book() {
    return this.app().openById(this._bookId)
  }

  /**
   * switch and return sheet object
   *
   * @param  String sheetName
   * @return this
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
    }

    return this
  }

  /**
   * @param  String sheetName
   * @return SpreadsheetOnetimeReader
   */
  newReader(sheetName, opts) {
    let sheet = new SpreadsheetOnetimeReader(this._bookId, this.app(), opts)

    return sheet.sheet(sheetName)
  }

  /**
   * headers
   *
   * default with toLowerCase()
   * set and return as-is
   *
   * @param  Array headers
   * @return Array
   */
  headers(headers = null) {
    if ( headers ) {
      this._headers = headers
    }

    if ( !this._headers ) {
      let headers = this.rawValues()[0]
      if ( this.opts()['header_converter'] ) {
        this._headers = headers.map((e)=> {
          return this._apply_header_converter(e, this.opts()['header_converter'])
        })
      } else {
        this._headers = headers
      }
    }
  
    return this._headers;
  }
  
  /**
   * @param  string header
   * @param  string converter
   * @return string
   */
  _apply_header_converter(header, converter) {
    return header[converter]()
  }

  /**
   * @return Array
   */
  rawValues() {
    return this._sheet.getDataRange().getValues()
  }

  /**
   * @param  Array raw
   * @return Array
   */
  skipHeaders(raw) {
    return raw.slice(this.opts().skip_headers, raw.length);
  }

  /**
   * @return Array
   */
  values() {
    if ( !this._values ) {
      this._values = this.skipHeaders(this.rawValues());
    }
    
    return this._values;
  }
  
  /**
   * @param  String name
   * @return Integer
   */
  colPos(name) {
    return this.headers().indexOf(name);
  }

  /**
   * column array specified by colName
   *
   * @param  String colName
   * @return Array
   */
  col(colName) {
    var col = this.colPos(colName)
    
    if ( col >= 0 ) {
      return this.values().map((e)=> {
        return e[col];
      });
    }
  }

  /**
   * return record selected by colName and val
   *
   * select by full matching (with string or number) or pattern matching ( RegExp )
   *
   * @param  String colName
   * @param  Object needle
   * @return Array
   */
  findByCol() {
    if ( arguments[1] instanceof Array ) {
      var conds = arguments[1]
      
      switch ( arguments[0] ) {
      case 'and':
        var multiplicity = conds.length
        var result       = []

        SimpleMultiplicity.from(_.flatMap(conds, (cond)=> {
          var [colName, needle] = cond
          return this.findByCol(colName, needle)
        })).each((e, m)=> {
          if ( m == multiplicity ) { result.push(e) }
        })

        this._found = result

        return this._found
      case 'or':
        return _.uniq(_.flatMap(conds, (cond)=> {
          var [colName, needle] = cond

          this._found = this.findByCol(colName, needle)

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
   * @param  Array     record
   * @param  arguments args
   * @return Boolean
   */
  _filterByCols(record, args) {
    var [colName, needle] = Array.prototype.slice.call(args, 0)

    var val = record[this.colPos(colName)]
    if ( typeof needle == 'string' || typeof needle == 'number' || needle instanceof String ) {
      return needle == val
    } else if ( needle instanceof RegExp ) {
      return needle.test(val)
    }
  }
  
  /**
   * @param  Integer num
   * @return array
   */
  row(num) {
    return this.values()[num]
  }

  /**
   * @param  Array records
   * @return Object
   */
  toObject(record = null) {
    if ( record ) {
      var hash = {}
    
      this.headers().forEach(function(e, i) {
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
