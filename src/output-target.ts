import type {Config} from '@stencil/core'
import type {BuildCtx, CompilerCtx, OutputTargetCustom} from '@stencil/core/internal'
import {copyFile, writeFile, mkdir} from 'fs/promises'
import {join} from 'path'

// @ts-expect-error: No type declarations available.
import * as ncc from '@vercel/ncc'

export const hydrateServerOutputTarget = (outputTarget: any): OutputTargetCustom => ({
  type: 'custom',
  name: 'nlx-hydrate-server',
  validate(config: Config) {
    return
  },
  async generator(config: Config, compilerCtx: CompilerCtx, buildCtx: BuildCtx) {
    if ((buildCtx.hydrateAppFilePath || '').length === 0) {
      return
    }

    try {
      const buildDirPath = join(
        buildCtx.config.cacheDir || join(buildCtx.config.rootDir!, '.stencil'),
        'nlx-hydrate-server'
      )
      await mkdir(buildDirPath, {recursive: true})

      const outputDirPath = outputTarget.dir
      await mkdir(outputDirPath, {recursive: true})

      await copyFile(join(__dirname, 'server.js'), join(buildDirPath, 'server.js'))

      await copyFile(buildCtx.hydrateAppFilePath, join(buildDirPath, 'hydrate-app.js'))

      await writeFile(
        join(buildDirPath, 'index.js'),
        `
const {createServer} = require('./server.js');
const {renderToString} = require('./hydrate-app.js');

const PORT = process.env.PORT || 80;

createServer(renderToString).listen(PORT, (error) => {
    if (error) throw error;
    console.log('Hydrate server listening on', PORT);
});`
      )

      const {code} = await ncc(join(buildDirPath, 'index.js'), {
        quiet: true,
        externals: ['http']
      })
      await writeFile(join(outputDirPath, 'index.js'), code)
    } catch (e: any) {
      console.log(e)
    }
  }
})
