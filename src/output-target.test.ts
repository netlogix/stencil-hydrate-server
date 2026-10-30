import {describe, it, expect, vi, beforeEach} from 'vitest'
import {join} from 'path'

const mocks = vi.hoisted(() => ({
  copyFile: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  rollup: vi.fn()
}))

vi.mock('fs/promises', () => ({
  copyFile: mocks.copyFile,
  writeFile: mocks.writeFile,
  mkdir: mocks.mkdir
}))

vi.mock('rollup', () => ({
  rollup: mocks.rollup
}))

vi.mock('@rollup/plugin-node-resolve', () => ({default: vi.fn(() => ({name: 'mock-resolve'}))}))
vi.mock('@rollup/plugin-commonjs', () => ({default: vi.fn(() => ({name: 'mock-commonjs'}))}))
vi.mock('@rollup/plugin-json', () => ({default: vi.fn(() => ({name: 'mock-json'}))}))

import {hydrateServerOutputTarget} from './output-target'

describe('hydrateServerOutputTarget', () => {
  beforeEach(() => {
    mocks.copyFile.mockClear()
    mocks.writeFile.mockClear()
    mocks.mkdir.mockClear()
    mocks.rollup.mockReset()
  })

  it('no-ops when buildCtx.hydrateAppFilePath is empty', async () => {
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server'})
    const buildCtx: any = {hydrateAppFilePath: '', config: {cacheDir: '/project/.cache', rootDir: '/project'}}

    await outputTarget.generator({} as any, {} as any, buildCtx, {} as any)

    expect(mocks.mkdir).not.toHaveBeenCalled()
    expect(mocks.copyFile).not.toHaveBeenCalled()
    expect(mocks.writeFile).not.toHaveBeenCalled()
    expect(mocks.rollup).not.toHaveBeenCalled()
  })

  it('copies server.js + hydrate-app.js, writes an index.js entry, and bundles it into outputTarget.dir', async () => {
    const generateMock = vi.fn().mockResolvedValue({output: [{code: 'BUNDLED_CODE'}]})
    mocks.rollup.mockResolvedValue({generate: generateMock})

    const writeFileCompiler = vi.fn().mockResolvedValue(undefined)
    const compilerCtx: any = {fs: {writeFile: writeFileCompiler}}
    const buildCtx: any = {
      hydrateAppFilePath: '/project/.stencil/hydrate/index.js',
      config: {cacheDir: '/project/.cache', rootDir: '/project'}
    }
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server'})

    await outputTarget.generator({} as any, compilerCtx, buildCtx, {} as any)

    const buildDirPath = join('/project/.cache', 'nlx-hydrate-server')

    expect(mocks.mkdir).toHaveBeenCalledWith(buildDirPath, {recursive: true})
    expect(mocks.mkdir).toHaveBeenCalledWith('/project/dist-server', {recursive: true})

    expect(mocks.copyFile).toHaveBeenCalledWith(expect.stringContaining('server.js'), join(buildDirPath, 'server.js'))
    expect(mocks.copyFile).toHaveBeenCalledWith(buildCtx.hydrateAppFilePath, join(buildDirPath, 'hydrate-app.js'))

    const [indexPath, indexContent] = mocks.writeFile.mock.calls[0] as [string, string]
    expect(indexPath).toBe(join(buildDirPath, 'index.js'))
    expect(indexContent).toContain("require('./server.js')")
    expect(indexContent).toContain("require('./hydrate-app.js')")
    expect(indexContent).toContain('process.env.PORT || 80')

    expect(mocks.rollup).toHaveBeenCalledWith(
      expect.objectContaining({input: join(buildDirPath, 'index.js'), treeshake: false})
    )

    const outputFilePath = join('/project/dist-server', 'index.js')
    expect(generateMock).toHaveBeenCalledWith({file: outputFilePath, format: 'cjs'})
    expect(writeFileCompiler).toHaveBeenCalledWith(outputFilePath, 'BUNDLED_CODE', {immediateWrite: true})
  })

  it('requires the hooks module by absolute path and passes onError to createServer', async () => {
    mocks.rollup.mockResolvedValue({generate: vi.fn().mockResolvedValue({output: [{code: 'X'}]})})
    const compilerCtx: any = {fs: {writeFile: vi.fn().mockResolvedValue(undefined)}}
    const buildCtx: any = {
      hydrateAppFilePath: '/project/.stencil/hydrate/index.js',
      config: {cacheDir: '/project/.cache', rootDir: '/project'}
    }
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server', hooksModule: './ssr/hooks.js'})

    await outputTarget.generator({} as any, compilerCtx, buildCtx, {} as any)

    const [, indexContent] = mocks.writeFile.mock.calls[0] as [string, string]
    expect(indexContent).toContain(`require(${JSON.stringify(join('/project', 'ssr', 'hooks.js'))})`)
    expect(indexContent).toContain('createServer(renderToString, {onError: hooks.onError})')
  })

  it('does not require a hooks module when none is configured', async () => {
    mocks.rollup.mockResolvedValue({generate: vi.fn().mockResolvedValue({output: [{code: 'X'}]})})
    const compilerCtx: any = {fs: {writeFile: vi.fn().mockResolvedValue(undefined)}}
    const buildCtx: any = {
      hydrateAppFilePath: '/project/.stencil/hydrate/index.js',
      config: {cacheDir: '/project/.cache', rootDir: '/project'}
    }
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server'})

    await outputTarget.generator({} as any, compilerCtx, buildCtx, {} as any)

    const [, indexContent] = mocks.writeFile.mock.calls[0] as [string, string]
    expect(indexContent).not.toContain('hooks')
    expect(indexContent).toContain('createServer(renderToString, {})')
  })

  it('falls back to <rootDir>/.stencil when config.cacheDir is not set', async () => {
    mocks.rollup.mockResolvedValue({generate: vi.fn().mockResolvedValue({output: [{code: 'X'}]})})
    const compilerCtx: any = {fs: {writeFile: vi.fn().mockResolvedValue(undefined)}}
    const buildCtx: any = {
      hydrateAppFilePath: '/project/.stencil/hydrate/index.js',
      config: {cacheDir: undefined, rootDir: '/project'}
    }
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server'})

    await outputTarget.generator({} as any, compilerCtx, buildCtx, {} as any)

    const buildDirPath = join('/project', '.stencil', 'nlx-hydrate-server')
    expect(mocks.mkdir).toHaveBeenCalledWith(buildDirPath, {recursive: true})
  })

  it('catches and logs errors instead of throwing', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = new Error('boom')
    mocks.mkdir.mockRejectedValueOnce(error)

    const buildCtx: any = {
      hydrateAppFilePath: '/project/.stencil/hydrate/index.js',
      config: {cacheDir: '/project/.cache', rootDir: '/project'}
    }
    const outputTarget = hydrateServerOutputTarget({dir: '/project/dist-server'})

    await expect(outputTarget.generator({} as any, {} as any, buildCtx, {} as any)).resolves.toBeUndefined()
    expect(consoleLogSpy).toHaveBeenCalledWith(error)

    consoleLogSpy.mockRestore()
  })
})
