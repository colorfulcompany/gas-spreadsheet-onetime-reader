/**
 * Multiplicity Calculator
 *
 * <pre>
 * const records1 = new SimpleMultiplicity([1, 2, 3, 3, 4, 2, 2])
 * records1.multiplicities() // => { 1: 1, 2: 3, 3: 2, 4: 1 }
 *
 * const records2 = new SimpleMultiplicity(
 * [
 *   { key1: 'a', key2: [1, 2] },
 *   { key1: 'a', key2: [2, 3] },
 *   { key1: 'a', key2: [1, 2] }
 * ])
 * records2.multiplicities()
 * // {
 * //   '{"key1":"a","key2":[1,2]}': 2,
 * //   '{"key1":"a","key2":[2,3]}': 1
 * // }
 * </pre>
 *
 * @class
 * @property {Array} _items
 */
class SimpleMultiplicity {
  /**
   * @param {Array} ary
   */
  constructor (ary = []) {
    this._items = ary
  }

  /**
   * @param  {Array} ary
   * @return {Object}
   */
  static from (ary) {
    return new SimpleMultiplicity(ary)
  }

  /**
   * @return {Object}
   */
  multiplicities () {
    const multiplicities = {}

    this._items.forEach((e) => {
      if (multiplicities[JSON.stringify(e)]) {
        multiplicities[JSON.stringify(e)]++
      } else {
        multiplicities[JSON.stringify(e)] = 1
      }
    })

    return multiplicities
  }

  /**
   * execute function for each multiplicy record
   *
   * each record is automatically JSON-decoded
   *
   * @param {callable} callback
   */
  each (callback) {
    const m = this.multiplicities()

    for (const k in m) {
      callback.call(this, JSON.parse(k), m[k])
    }
  }
}

/**
 * @param {Array} ary
 * @return {SimpleMultiplicity}
 */
function createMultiplicity (ary) { // eslint-disable-line no-unused-vars
  return SimpleMultiplicity.from(ary)
}
