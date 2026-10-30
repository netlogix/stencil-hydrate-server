import {describe, it, expect, vi} from 'vitest'
import {execFileSync} from 'child_process'
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import {join} from 'path'

// Unlike output-target.test.ts this runs the real rollup bundling. Only server.js, which is copied from the
// package's own dist, is replaced by a stub.
const stubServer = vi.hoisted(() => ({path: ''}))

vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    copyFile: (source: string, destination: string) =>
      actual.copyFile(source.endsWith(join('src', 'server.js')) ? stubServer.path : source, destination)
  }
})

import {hydrateServerOutputTarget} from './output-target'

describe('hooksModule bundling', () => {
  it('inlines the hooks module and its imports, so the server runs without the hooks sources', async () => {
    const root = mkdtempSync(join(tmpdir(), 'hydrate-server-bundle-'))
    try {
      mkdirSync(join(root, 'ssr'))
      mkdirSync(join(root, '.stencil', 'hydrate'), {recursive: true})

      stubServer.path = join(root, 'stub-server.js')
      writeFileSync(
        stubServer.path,
        `exports.createServer = (render, options) => ({listen: (port, callback) => { options.onError(new Error('boom'), {kind: 'test'}); callback() }})`
      )
      writeFileSync(join(root, '.stencil', 'hydrate', 'index.js'), 'exports.renderToString = async () => ({})')
      writeFileSync(join(root, 'ssr', 'prefix.json'), JSON.stringify({prefix: 'hook:'}))
      writeFileSync(
        join(root, 'ssr', 'helper.js'),
        `const {prefix} = require('./prefix.json')\nexports.label = name => prefix + name`
      )
      writeFileSync(
        join(root, 'ssr', 'hooks.js'),
        `const {label} = require('./helper')\nexports.onError = (error, context) => console.log(label(context.kind), error.message)`
      )

      const outputDir = join(root, 'dist', 'ssr-server')
      const writes: Record<string, string> = {}
      await hydrateServerOutputTarget({dir: outputDir, hooksModule: './ssr/hooks.js'}).generator(
        {} as any,
        {fs: {writeFile: async (file: string, content: string) => void (writes[file] = content)}} as any,
        {hydrateAppFilePath: join(root, '.stencil', 'hydrate', 'index.js'), config: {rootDir: root}} as any,
        {} as any
      )

      const bundle = writes[join(outputDir, 'index.js')]
      expect(bundle).toBeDefined()
      expect(bundle).not.toContain(join(root, 'ssr'))

      rmSync(join(root, 'ssr'), {recursive: true})
      // the compiler fs is mocked above, so the bundle is written to disk here to run it
      writeFileSync(join(outputDir, 'index.js'), bundle)
      const output = execFileSync(process.execPath, [join(outputDir, 'index.js')], {encoding: 'utf8'})

      expect(output).toContain('hook:test boom')
    } finally {
      rmSync(root, {recursive: true, force: true})
    }
  })
})
