import { resolve } from 'path';
import { defineConfig, Plugin, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHtmlPlugin } from 'vite-plugin-html';
import tsconfigPaths from 'vite-tsconfig-paths';
// @ts-ignore
import gltf from 'vite-plugin-gltf';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';
import { rimraf } from 'rimraf';
import * as path from 'path';
// import { minify } from 'terser';
import { shaderMinifierPlugin } from './vite-shader-minifier-plugin';
import { createDirectoryAsync } from './node-libs/file-io';
import { wait } from './node-libs/wait';
import * as process from 'process';
// import { NormalizedOutputOptions, OutputBundle, OutputChunk } from 'rollup';

export const deleteTmpCachesPlugin: () => Plugin = () => {
    return {
        name: 'delete-tmp-caches-plugin',
        // enforce: 'pre',
        async buildStart() {
            console.log('build start: delete-tmp-caches-plugin');
            const basePath = './';
            const tmpDirPath = path.join(basePath, 'tmp');
            await rimraf(tmpDirPath);
            await wait(10);
            await createDirectoryAsync(tmpDirPath);
        },
    };
};

// DEPRECATED
// // ref: https://github.com/vitejs/vite/issues/6555
// export const minifyBundles: () => Plugin = () => {
//     return {
//         name: 'minifyBundles',
//         async generateBundle(_: NormalizedOutputOptions, bundle: OutputBundle) {
//             for (let key in bundle) {
//                 if (bundle[key].type == 'chunk' && key.endsWith('.js')) {
//                     const chunk = (bundle[key] as OutputChunk);
//                     const minifyCode = await minify(chunk.code, {
//                         mangle: {
//                             properties: true
//                         },
//                         toplevel: true,
//                     });
//                     chunk.code = minifyCode.code!;
//                 }
//             }
//             // return bundle;
//         },
//     };
// };

// ref:
// https://ja.vitejs.dev/config/
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    const isBundle = env.VITE_BUNDLE === 'true';
    const isMinifyShader = env.VITE_MINIFY_SHADER === 'true';
    const isMangleProperties = env.VITE_MANGLE_PROPERTIES === 'true';

    console.log(`=== [env] mode: ${mode} ===`);
    console.log(`isBundle: ${isBundle}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`isMangleProperties: ${isMangleProperties}`);
    console.log('===========================');

    return {
        base: './',
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
            shaderMinifierPlugin({
                minify: isMinifyShader,
                minifierOptions: {
                    preserveExternals: true,
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
                input: {
                    main: isBundle
                        ? resolve(__dirname, 'main.ts') // js一個にまとめる場合
                        : resolve(__dirname, 'index.html'), // html含めてビルドする場合
                    // sandbox: isBundle
                    //     ? resolve(__dirname, 'sandbox/main.ts') // js一個にまとめる場合
                    //     : resolve(__dirname, 'sandbox/index.html'), // html含めてビルドする場合
                },
            },
            minify: 'terser',
            target: 'es2022',
            terserOptions: {
                // keep_classnames: false,
                // keep_fnames: true,
                mangle: {
                    toplevel: true,
                    properties: isMangleProperties, // TODO: 出し分けできてないかも
                    // WIP
                    // properties: {
                    //     regex: /^_/
                    //     // regex: /^(Hoge)$/
                    // }
                },
                compress: {
                    drop_console: false,
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
