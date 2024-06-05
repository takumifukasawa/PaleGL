import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHtmlPlugin } from 'vite-plugin-html';
import tsconfigPaths from 'vite-tsconfig-paths';
// @ts-ignore
import gltf from 'vite-plugin-gltf';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';
import { shaderMinifierPlugin } from './vite-shader-minifier-plugin';
import * as process from 'process';
import { transformGlslUnroll } from './vite-transform-glsl-unroll-plugin.ts';
import { transformGlslLayout } from './vite-transform-glsl-layout-plugin.ts';
import { deleteTmpCachesPlugin } from './vite-delete-tmp-caches-plugin.ts';

type EntryPointInfo = { name: string; path: string };
// type EntryPointInfo = { path: string };

/**
 *
 * @param dirName
 */
// async function getEntryPoints(dirName: string): Promise<EntryPointInfo[]> {
//     // const dirPath = path.join(__dirname, dirName);
//     const dirPath = dirName;
//     return new Promise((resolve) => {
//         fs.readdir(dirPath, (err, list) => {
//             if (err) {
//                 console.error(err);
//                 return;
//             }
//             const result: EntryPointInfo[] = [];
//             list.forEach((name) => {
//                 result.push({
//                     name,
//                     path: path.join(dirPath, name),
//                 });
//             });
//             return resolve(result);
//         });
//     });
// }

// entryがrootの場合は`index`になる
const ENTRY_NAME_INDEX: string = 'index';

// ---------------------------------------------------
// ビルドするentryを定義
// const ENTRY_NAME = ENTRY_NAME_INDEX;
const ENTRY_NAME: string = "street-light";
const IS_MAIN_ENTRY = ENTRY_NAME === ENTRY_NAME_INDEX;
const ENTRY_PATH = IS_MAIN_ENTRY ? ENTRY_NAME : `labs/${ENTRY_NAME}`;
// ---------------------------------------------------

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


    console.log(`=== [env] mode: ${mode} ===`);
    console.log(`isBundle: ${isBundle}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`isMangleProperties: ${isMangleProperties}`);
    console.log(`isDropConsole: ${isDropConsole}`);
    console.log(`entryPath: ${ENTRY_PATH}`);
    console.log(`isMainEntry: ${IS_MAIN_ENTRY}`);

    // NOTE: 今はentryを一つにしているので複数管理前提にする必要はない
    const entryPointInfos: EntryPointInfo[] = [];

    entryPointInfos.push({
        name: ENTRY_NAME,
        path: ENTRY_PATH,
    });

    const entryPoints: { [key: string]: string } = {};
    entryPointInfos.forEach((entryPointInfo) => {
        if (IS_MAIN_ENTRY) {
            entryPoints[entryPointInfo.name] = isBundle
                ? resolve(__dirname, `pages/main.ts`) // js一個にまとめる場合
                : resolve(__dirname, `pages/index.html`); // html含めてビルドする場合
        } else {
            entryPoints[entryPointInfo.name] = isBundle
                ? resolve(__dirname, `pages/${entryPointInfo.path}/main.ts`) // js一個にまとめる場合
                : resolve(__dirname, `pages/${entryPointInfo.path}/index.html`); // html含めてビルドする場合
        }

        // if (isMainEntry) {
        //     entryPoints[entryPointInfo.name] = isBundle
        //         ? resolve(__dirname, `pages/main.ts`) // js一個にまとめる場合
        //         : resolve(__dirname, `pages/index.html`); // html含めてビルドする場合
        // } else {
        //     entryPoints[entryPointInfo.name] = isBundle
        //         ? resolve(__dirname, `pages/${entryPointInfo.path}/${entryPointInfo.name}/main.ts`) // js一個にまとめる場合
        //         : resolve(__dirname, `pages/${entryPointInfo.path}/${entryPointInfo.name}/index.html`); // html含めてビルドする場合
        // }
    });

    console.log(`=== [entry_points] ===`);
    Object.keys(entryPoints).forEach((key) => {
        console.log(`${key}: ${entryPoints[key]}`);
    });
    console.log('======================');

    // ref:
    // https://uga-box.hatenablog.com/entry/2022/05/03/000000
    // https://vitejs.dev/config/
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
                    noRenaming: true
                    // noRenamingList: ['epiano'],
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
        root: './pages',
        publicDir: resolve(__dirname, 'public'),
        build: {
            reportCompressedSize: false,
            cssCodeSplit: false,
            // このbyte数よりも小さいアセットはbase64になる
            assetsInlineLimit: isBundle ? 100000000 : 0,
            outDir: resolve(__dirname, 'dist'),
            emptyOutDir: true,
            // emptyOutDir: false,
            rollupOptions: {
                // input: {
                //     // index: resolve(__dirname, 'pages/index.html'),
                //     // "sandbox": resolve(__dirname, "pages/demos/sandbox/index.html"),
                //     "street-light": resolve(__dirname, "pages/demos/street-light/index.html"),
                // },
                input: entryPoints,
                output: {
                    inlineDynamicImports: false,
                    entryFileNames: () => {
                        // return isMainEntry ? `assets/main.js` : `${ENTRY_DIR}/[name]/assets/main.js`;
                        return IS_MAIN_ENTRY ? `assets/main.js` : `${ENTRY_PATH}/assets/main.js`;
                        // if(isSingleDemoBuildMode) {
                        //     return `demos/[name]/assets/main.js`;
                        // }
                        // return args.name === 'index' ? `assets/main.js` : `assets/[name]/main.js`;
                    },
                    assetFileNames: () => {
                        return IS_MAIN_ENTRY ? `assets/[name].[ext]` : `${ENTRY_PATH}/assets/[name].[ext]`;
                        // if(isSingleDemoBuildMode) {
                        //     return `demos/${singleDemoProjectName}/assets/[name].[ext]`;
                        // }
                        // return `assets/[name].[ext]`;
                    },
                    chunkFileNames: () => {
                        return IS_MAIN_ENTRY ? `assets/[name].js` : `${ENTRY_PATH}assets/[name].js`;
                        // if(isSingleDemoBuildMode) {
                        //     return `demos/${singleDemoProjectName}/assets/[name].js`;
                        // }
                        // return `assets/[name].js`;
                    },

                    // entryFileNames: `demos/street-light/assets/main.js`,
                    // assetFileNames: () => {
                    //     return `demos/street-light/assets/[name].[ext]`;
                    // },
                    // chunkFileNames: `demos/street-light/assets/[name].js`,
                },
                // input: entryPoints,
                // // ref: https://stackoverflow.com/questions/71180561/vite-change-ouput-directory-of-assets
                // output: {
                //     assetFileNames: () => {
                //         return isSingleDemoBuildMode
                //             ? `demos/${singleDemoProjectName}/assets/[name]-[hash][extname]`
                //             : `assets/${subDir}[name]-[hash][extname]`;
                //     },
                //     chunkFileNames: isSingleDemoBuildMode
                //         ? `demos/${singleDemoProjectName}/[name]-[hash].js`
                //         : `assets/${subDir}/[name]-[hash].js`,
                //     entryFileNames: isSingleDemoBuildMode
                //         ? `demos/${singleDemoProjectName}/[name]-[hash].js`
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
