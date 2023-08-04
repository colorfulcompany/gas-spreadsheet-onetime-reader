import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: './node_modules/lodash.merge/index.js',
    output: {
      file: 'src/merge.js',
      format: 'iife',
      name: 'merge'
    },
    plugins: [
      commonjs()
    ]
  },
  {
    input: './node_modules/lodash.flatmap/index.js',
    output: {
      file: 'src/flatmap.js',
      format: 'iife',
      name: 'flatmap'
    },
    plugins: [
      commonjs()
    ]
  },
  {
    input: './node_modules/lodash.uniq/index.js',
    output: {
      file: 'src/uniq.js',
      format: 'iife',
      name: 'uniq'
    },
    plugins: [
      commonjs()
    ]
  },
  {
    input: './node_modules/lodash.includes/index.js',
    output: {
      file: 'src/includes.js',
      format: 'iife',
      name: 'includes'
    },
    plugins: [
      commonjs()
    ]
  }
]
