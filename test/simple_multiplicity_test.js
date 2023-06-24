/* global describe, it, before */

import assert from 'power-assert'

import SimpleMultiplicity from '../lib/simple_multiplicity'

describe('SimpleMultiplicity', () => {
  describe('.from', () => {
    it('', () => {
      assert(SimpleMultiplicity.from([1, 2, 3]) instanceof SimpleMultiplicity)
    })
  })

  describe('#multiplicities', () => {
    it('return object {value: multiplicity, value: multiplicity, ...}', () => {
      assert.deepEqual(
        { 1: 1, 2: 3, 3: 2, 4: 1 },
        SimpleMultiplicity.from([1, 2, 3, 3, 4, 2, 2]).multiplicities()
      )
    })
  })

  describe('#each', () => {
    const arrayed = []

    before(() => {
      SimpleMultiplicity.from([1, 2, 3, 3, 4, 2, 2]).each((e, m) => {
        arrayed.push([e, m])
      })
    })

    it('array passed', () => {
      assert.deepEqual(
        [
          [1, 1],
          [2, 3],
          [3, 2],
          [4, 1]
        ],
        arrayed
      )
    })
  })
})
