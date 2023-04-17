"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateServerOutputTarget = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
// @ts-expect-error: No type declarations available.
const ncc = require("@vercel/ncc");
const hydrateServerOutputTarget = (outputTarget) => ({
    type: 'custom',
    name: 'nlx-hydrate-server',
    validate(config) {
        return;
    },
    generator(config, compilerCtx, buildCtx) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((buildCtx.hydrateAppFilePath || '').length === 0) {
                return;
            }
            try {
                const buildDirPath = (0, path_1.join)(buildCtx.config.cacheDir || (0, path_1.join)(buildCtx.config.rootDir, '.stencil'), 'nlx-hydrate-server');
                yield (0, promises_1.mkdir)(buildDirPath, { recursive: true });
                const outputDirPath = outputTarget.dir;
                yield (0, promises_1.mkdir)(outputDirPath, { recursive: true });
                yield (0, promises_1.copyFile)((0, path_1.join)(__dirname, 'server.js'), (0, path_1.join)(buildDirPath, 'server.js'));
                yield (0, promises_1.copyFile)(buildCtx.hydrateAppFilePath, (0, path_1.join)(buildDirPath, 'hydrate-app.js'));
                yield (0, promises_1.writeFile)((0, path_1.join)(buildDirPath, 'index.js'), `
const {createServer} = require('./server.js');
const {renderToString} = require('./hydrate-app.js');

const PORT = process.env.PORT || 80;

createServer(renderToString).listen(PORT, (error) => {
    if (error) throw error;
    console.log('Hydrate server listening on', PORT);
});`);
                const code = yield ncc((0, path_1.join)(buildDirPath, 'index.js'), {
                    quiet: true,
                    externals: ['http']
                });
                yield (0, promises_1.writeFile)((0, path_1.join)(outputDirPath, 'index.js'), code);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
});
exports.hydrateServerOutputTarget = hydrateServerOutputTarget;
