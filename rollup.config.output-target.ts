import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json';

export default {
  input: ['src/output-target.ts'],
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  external: ['rollup','@stencil/core', '@stencil/core/internal'],
  plugins: [
    json(),
    commonjs(),
    resolve(),
    typescript({ tsconfig: './tsconfig.json' })
  ]
}