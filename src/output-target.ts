import type {Config} from '@stencil/core'
import type {BuildCtx, CompilerCtx, OutputTargetCustom} from '@stencil/core/internal'
import {copyFile, writeFile, mkdir} from 'fs/promises'
import {join} from 'path'
import { rollup, RollupOptions } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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

      const rollupOptions: RollupOptions = {
        input: join(buildDirPath, 'index.js'),
        treeshake: false,
        plugins: [
          commonjs(),
          resolve(),
        ],
      };

      const rollupBuild = await rollup(rollupOptions);

      const outputFilePath = join(outputDirPath, 'index.js');

      const rollupOutput = await rollupBuild.generate({
        file: outputFilePath,
        format: 'cjs',
      });

      await compilerCtx.fs.writeFile(outputFilePath, rollupOutput.output[0].code, { immediateWrite: true });
    } catch (e: any) {
      console.log(e)
    }
  }
})
