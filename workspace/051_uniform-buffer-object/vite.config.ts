import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHtmlPlugin } from 'vite-plugin-html';
import tsconfigPaths from 'vite-tsconfig-paths';
// @ts-ignore
import gltf from 'vite-plugin-gltf';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';
// import { minify } from 'terser';
import { shaderMinifierPlugin } from './vite-shader-minifier-plugin';
import * as process from 'process';
import { transformGlslUnroll } from './vite-transform-glsl-unroll-plugin.ts';
import { transformGlslLayout } from './vite-transform-glsl-layout-plugin.ts';
import { deleteTmpCachesPlugin } from './vite-delete-tmp-caches-plugin.ts';
import * as fs from 'fs';
import * as path from 'path';

// import { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup';

type EntryPointInfo = { name: string; path: string };

/**
 *
 * @param dirName
 */
async function getEntryPoints(dirName: string): Promise<EntryPointInfo[]> {
    // const dirPath = path.join(__dirname, dirName);
    const dirPath = dirName;
    return new Promise((resolve) => {
        fs.readdir(dirPath, (err, list) => {
            if (err) {
                console.error(err);
                return;
            }
            const result: EntryPointInfo[] = [];
            list.forEach((name) => {
                result.push({
                    name,
                    path: path.join(dirPath, name),
                });
            });
            return resolve(result);
        });
    });
}

// ref:
// https://ja.vitejs.dev/config/
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig(async (config) => {
    const { mode } = config;

    const env = loadEnv(mode, process.cwd());

    const isBundle = env.VITE_BUNDLE === 'true';
    const isMinifyShader = env.VITE_MINIFY_SHADER === 'true';
    const isMangleProperties = env.VITE_MANGLE_PROPERTIES === 'true'; // gltf loader を使うときは必ず false
    const isDropConsole = env.VITE_DROP_CONSOLE === 'true';
    const demoProjectName = env.VITE_DEMO_PROJECT_NAME;

    const isDevMode = mode === 'development';
    const isDemoMode = mode === 'demo';

    console.log(`=== [env] mode: ${mode} ===`);
    console.log(`isBundle: ${isBundle}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`isMangleProperties: ${isMangleProperties}`);
    console.log(`isDropConsole: ${isDropConsole}`);
    console.log(`demoProjectName: ${demoProjectName}`);

    // const subDir = isDemoMode ? `demos/${demoProjectName}/` : '';

    // const demoEntryPoints = await getEntryPoints('demos');

    // const entryPointInfos: string[] = [...(isDemoMode ? demoEntryPoints : ['main'])];
    // const entryPointInfos: string[] = [...['main', 'sandbox'], ...demoEntryPoints];
    const entryPointInfos: EntryPointInfo[] = [];

    if (isDevMode) {
        // entryPointInfos.push({
        //     name: 'main',
        //     path: '',
        // });
        const demoEntryPoints = await getEntryPoints('demos');
        entryPointInfos.push(...demoEntryPoints);
    }

    if (isDemoMode) {
        entryPointInfos.push({
            name: demoProjectName,
            path: `demos/${demoProjectName}`,
        });
    }

    const entryPoints: { [key: string]: string } = {};
    entryPointInfos.forEach((entryPointInfo) => {
        // const entryDir = isDevMode || isDemoMode ? subDir : '';
        // entryPointName === 'main' ? '' : `${entryPointName}/`;
        // console.log(entryPointName)
        entryPoints[entryPointInfo.name] = isBundle
            ? resolve(__dirname, `${entryPointInfo.path}/main.ts`) // js一個にまとめる場合
            : resolve(__dirname, `${entryPointInfo.path}/index.html`); // html含めてビルドする場合
    });

    console.log(`=== [entry_points] ===`);
    Object.keys(entryPoints).forEach((key) => {
        console.log(`${key}: ${entryPoints[key]}`);
    });
    console.log('======================');

    // ref: https://uga-box.hatenablog.com/entry/2022/05/03/000000
    return {
        plugins: [
            deleteTmpCachesPlugin(),
            tsconfigPaths(),
            checker({ typescript: true }),
            gltf(),
            glsl({
                include: ['**/*.glsl'],
                watch: true,
                root: 'src/PaleGL',
                defaultExtension: 'glsl',
                warnDuplicatedImports: true,
                exclude: undefined,
                compress: false,
            }),
            transformGlslLayout(),
            transformGlslUnroll(),
            shaderMinifierPlugin({
                minify: isMinifyShader,
                minifierOptions: {
                    preserveExternals: true,
                },
            }),
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint --ext .ts,.js ./',
                },
            }),
            ...(isBundle ? [viteSingleFile(), createHtmlPlugin()] : []),
        ],
        assetsInclude: ['**/*.gltf'],
        root: "./pages",
        publicDir: resolve(__dirname, 'public'),
        build: {
            reportCompressedSize: false,
            cssCodeSplit: false,
            // このbyte数よりも小さいアセットはbase64になる
            assetsInlineLimit: isBundle ? 100000000 : 0,
            outDir: resolve(__dirname, 'dist'),
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    // "": resolve(__dirname, "pages/index.html"),
                    // "sandbox": resolve(__dirname, "pages/demos/sandbox/index.html"),
                    "street-light": resolve(__dirname, "pages/demos/street-light/index.html"),
                },
                output: {
                    entryFileNames: `assets/[name]/main.js`,
                    assetFileNames: () => {
                        return `assets/[name].[ext]`;
                    },
                    chunkFileNames: `assets/[name].js`,
                }
                // input: entryPoints,
                // // ref: https://stackoverflow.com/questions/71180561/vite-change-ouput-directory-of-assets
                // output: {
                //     assetFileNames: () => {
                //         return isDemoMode
                //             ? `demos/${demoProjectName}/assets/[name]-[hash][extname]`
                //             : `assets/${subDir}[name]-[hash][extname]`;
                //     },
                //     chunkFileNames: isDemoMode
                //         ? `demos/${demoProjectName}/[name]-[hash].js`
                //         : `assets/${subDir}/[name]-[hash].js`,
                //     entryFileNames: isDemoMode
                //         ? `demos/${demoProjectName}/[name]-[hash].js`
                //         : `assets/${subDir}/[name]-[hash].js`,
                // },
            },
            minify: 'terser',
            target: 'es2022',
            terserOptions: {
                mangle: {
                    toplevel: true,
                    properties: isMangleProperties,
                },
                compress: {
                    drop_console: isDropConsole,
                    drop_debugger: true,
                },
            },
        },
        server: {
            watch: {
                usePolling: true,
                interval: 2000,
            },
        },
    };
});
