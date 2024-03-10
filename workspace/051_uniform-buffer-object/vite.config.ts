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
// import * as fs from 'fs';
// import * as path from 'path';

// import { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup';

// /**
//  *
//  * @param dirName
//  */
// async function getEntryPoints(dirName: string): Promise<string[]> {
//     const dirPath = path.join(__dirname, dirName);
//     return new Promise((resolve) => {
//         fs.readdir(dirPath, (err, list) => {
//             if (err) {
//                 console.error(err);
//                 return;
//             }
//             return resolve(list.map((name) => `${dirName}/${name}`));
//         });
//     });
// }

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

    const isDemoMode = mode === 'demo';

    console.log(`=== [env] mode: ${mode} ===`);
    console.log(`isBundle: ${isBundle}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`isMangleProperties: ${isMangleProperties}`);
    console.log(`isDropConsole: ${isDropConsole}`);
    console.log(`demoProjectName: ${demoProjectName}`);

    const subDir = isDemoMode ? `demos/${demoProjectName}/` : '';

    // const demoEntryPoints = await getEntryPoints('demos');

    // const entryPointNames: string[] = [...(isDemoMode ? demoEntryPoints : ['main'])];
    // const entryPointNames: string[] = [...['main', 'sandbox'], ...demoEntryPoints];
    const entryPointNames: string[] = [];

    if (isDemoMode) {
        entryPointNames.push(demoProjectName);
    } else {
        entryPointNames.push('main');
    }

    const entryPoints: { [key: string]: string } = {};
    entryPointNames.forEach((entryPointName) => {
        const entryDir = isDemoMode ? subDir : '';
        // entryPointName === 'main' ? '' : `${entryPointName}/`;
        // console.log(entryPointName)
        entryPoints[entryPointName] = isBundle
            ? resolve(__dirname, `${entryDir}main.ts`) // js一個にまとめる場合
            : resolve(__dirname, `${entryDir}index.html`); // html含めてビルドする場合
    });

    console.log(`=== [entry_points] ===`);
    Object.keys(entryPoints).forEach((key) => {
        console.log(`${key}: ${entryPoints[key]}`);
    });
    console.log('===========================');

    return {
        base: '/demos/',
        // resolve: {
        //     preserveSymlinks: true
        // },
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
                    // noRenamingList: ["main,dfScene"] // object space raymarch の scene 探索用関数は rename しない
                    // preserveAllGlobals: true,
                    // noRenaming: true
                },
            }),
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint --ext .ts,.js ./',
                },
            }),
            // minifyBundles(),
            ...(isBundle ? [viteSingleFile(), createHtmlPlugin()] : []),
        ],
        assetsInclude: ['**/*.gltf'],
        build: {
            reportCompressedSize: false,
            cssCodeSplit: false,
            // このbyte数よりも小さいアセットはbase64になる
            assetsInlineLimit: isBundle ? 100000000 : 0,
            rollupOptions: {
                input: entryPoints,
                // ref: https://stackoverflow.com/questions/71180561/vite-change-ouput-directory-of-assets
                output: {
                    assetFileNames: () => {
                        return isDemoMode
                            ? `demos/${demoProjectName}/assets/[name]-[hash][extname]`
                            : `assets/${subDir}[name]-[hash][extname]`;
                    },
                    chunkFileNames: isDemoMode
                        ? `demos/${demoProjectName}/[name]-[hash].js`
                        : `assets/${subDir}/[name]-[hash].js`,
                    entryFileNames: isDemoMode
                        ? `demos/${demoProjectName}/[name]-[hash].js`
                        : `assets/${subDir}/[name]-[hash].js`,
                },
            },
            minify: 'terser',
            target: 'es2022',
            terserOptions: {
                mangle: {
                    toplevel: true,
                    properties: isMangleProperties, // TODO: 出し分けできてないかも
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
