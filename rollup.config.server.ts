import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: ['src/server.ts'],
  output: {
    dir: 'dist',
    format: 'cjs'
  },
  external: ['@stencil/core/mock-doc', '@stencil/core/internal'],
  plugins: [
    commonjs(),
    resolve(),
    typescript()
  ]
}