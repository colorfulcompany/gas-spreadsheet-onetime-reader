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
