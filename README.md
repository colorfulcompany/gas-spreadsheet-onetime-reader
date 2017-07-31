# SpreadsheetOnetimeReader

Simple Google Spreadsheet Reader

## feature

 * search()
 * toObject()

SpreadsheetApp returns Array of Array structure "[ [], [] ]", but it's hard to handle them. SpreadsheetOnetimeReader provides convinent toObject() method.

# Usage

```javascript
let sheet = new SpreadsheetOnetimeReader(
  SpreadsheetApp,
  <bookId>,
  <sheetName>,
  opts = {
    skipHeaders: <num>
  })

sheet.search('and', [ ['~', 'id', /^201706[0-9]+/], ['==', 'name', 'Aiu'] ])
sheet.toObject()
```

result

```javascript
[
  {
    id:    2017062101,
    point: 79,
    name:  "Aiu"
  },
  {
    id:    2017062812,
    point: 64,
    name:  "Aiu"
  },
  ...
]
```

and narrowing with `pickFields` option

```javascript
sheet.opts({pickFields: ['id', 'point']})
sheet.toObject()
```

result

```javascript
[
  {
    id:    2017062101,
    point: 79
  },
  {
    id:    2017062812,
    point: 64
  },
  ...
]
```

Requirements for bundling this package
======================================

With version 0.5.5, you need to add these dependencies as below, for using this package to downloading from GitHub and building with Babel.

 * babel-plugin-transform-class-properties
 * babel-preset-es2015
 * babel-preset-gas
