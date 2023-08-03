# SpreadsheetOnetimeReader

Simple Google Spreadsheet Reader

## feature

 * search()
 * toObject()

SpreadsheetApp returns Array of Array structure "[ [], [] ]", but it's hard to handle them. SpreadsheetOnetimeReader provides convinent toObject() method.

# Usage

## Prepare

 1. clone this repo
 2. clasp init & clasp push
 3. deploy this as Library and memo Library ID from Project settings
 4. add Library with memoed ID from Script Editor

## create Reader from Apps Script Project

```javascript
const reader sheet = SpreadsheetOnetimeReader.createReader(
  SpreadsheetApp,
  [bookId],
  [sheetName],
  [opts = {
    skipHeaders: <num>
  }])

reader.search('and', [ ['~', 'id', /^201706[0-9]+/], ['==', 'name', 'Aiu'] ])
reader.toObject()
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
reader.opts({pickFields: ['id', 'point']})
reader.toObject()
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

## How to call as a function from within Spreadsheet

prepare function in Apps Script Editor

```javascript
/**
 * @customfunction
 */
function readerSearch () {
  const reader = SpreadsheetOnetimeReader.createReader(SpreadsheetApp)

  return reader.search(
    'and',
    [
      ['~', 'id', /^201706[0-9]+/],
      ['==', 'name', 'Aiu']
    ])
}
```

call function in Spreadsheet

```
=readerSearch()
```
