import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
// @ts-ignore
import gltf from 'vite-plugin-gltf';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';
import eslint from '@nabla/vite-plugin-eslint';
import * as process from 'process';
import { transformGlslLayout } from './plugins/vite-transform-glsl-layout-plugin.ts';
import string from 'vite-plugin-string';
import { shaderMinifierPlugin } from './plugins/vite-shader-minifier-plugin.ts';
import { deleteTmpCachesPlugin } from './plugins/vite-delete-tmp-caches-plugin.ts';
import { isWin } from './node-libs/env';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { createHtmlPlugin } from 'vite-plugin-html';
import * as path from "node:path";

type EntryPointInfo = { name: string; path: string };

// ---------------------------------------------------

// ビルドするentryを定義
const ENTRY_POINTS: { [key: string]: string } = {
    ['sandbox']: 'labs/sandbox',
    ['street-light']: 'labs/street-light',
    ['morph-glass']: 'labs/morph-glass',
};

// rootモードになってるときは pages直下を使用
const ROOT_MODE_PATH = '';

// ---------------------------------------------------

// ref:
// https://ja.vitejs.dev/config/
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig((config) => {
    const { mode } = config;

    const env = loadEnv(mode, process.cwd());

    // NOTE: 本来はなくてもいいはず
    Object.assign(process.env, env);

    const isDropConsole = env.VITE_DROP_CONSOLE === 'true';
    const isMinifyShader = env.VITE_MINIFY_SHADER === 'true';
    const isRoot = env.VITE_ROOT === 'true';
    const isBundle = env.VITE_BUNDLE === 'true';

    console.log(`===== [env] mode: ${mode} =====`);
    console.log(`isDropConsole: ${isDropConsole}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`entryNames: ${ENTRY_POINTS}`);
    console.log(`isRoot: ${isRoot}`);
    console.log(`isBundle: ${isBundle}`);

    // NOTE: 今はentryを一つにしているので複数管理前提にする必要はない
    const entryPointInfos: EntryPointInfo[] = [];

    if (isRoot) {
        entryPointInfos.push({
            name: 'index',
            path: ROOT_MODE_PATH,
        });
    } else {
        Object.keys(ENTRY_POINTS).forEach((key) => {
            const path = ENTRY_POINTS[key];
            entryPointInfos.push({
                name: path,
                path,
            });
        });
    }

    const entryPoints: { [key: string]: string } = {};
    entryPointInfos.forEach((entryPointInfo) => {
        entryPoints[entryPointInfo.name] = resolve(path.join(__dirname, 'pages', entryPointInfo.path, 'index.html')); // html含めてビルドする場合
    });

    console.log(`===== [entry_points] =====`);
    Object.keys(entryPoints).forEach((key) => {
        console.log(`${key}: ${entryPoints[key]}`);
    });
    console.log('==========================');

    // ref:
    // https://uga-box.hatenablog.com/entry/2022/05/03/000000
    // https://vitejs.dev/config/
    return {
        plugins: [
            deleteTmpCachesPlugin(),
            tsconfigPaths(),
            checker({
                overlay: false,
                typescript: true,
            }),
            eslint({
                eslintOptions: {
                    overrideConfigFile: 'eslint.config.js', // 明示
                },
            }),
            string({
                include: '**/*.txt',
            }),
            gltf(),
            glsl({
                include: ['./src/**/*.glsl', './pages/**/*.glsl'],
                watch: true,
                root: 'src/PaleGL',
                defaultExtension: 'glsl',
                warnDuplicatedImports: true,
                exclude: undefined,
            }),
            transformGlslLayout(),
            shaderMinifierPlugin({
                minify: isMinifyShader,
                minifierOptions: {
                    preserveExternals: true,
                    aggressiveInlining: false,
                    noRenamingList: [
                        // 最低限この2つは置き換える
                        'main',
                        'dfScene',
                        // 適宜置き換える
                        // NOTE: ドキュメント的には関数だけ指定できるみたいだが、変数も可？
                        'uv',
                        'baseColor',
                        'emissiveColor',
                        // 'resultColor'
                    ],
                },
            }),
            visualizer({
                template: 'treemap',
            }),
            ...(isBundle ? [viteSingleFile(), createHtmlPlugin()] : []),
        ],
        // assetsInclude: ['**/*.gltf', '**/*.dxt'], // dxt使う場合合った方がいい？
        assetsInclude: ['**/*.gltf'],
        root: './pages',
        publicDir: resolve(__dirname, 'public'),
        build: {
            reportCompressedSize: false,
            cssCodeSplit: false,
            // このbyte数よりも小さいアセットはbase64になる
            assetsInlineLimit: 0,
            outDir: resolve(__dirname, 'dist'),
            emptyOutDir: true,
            rollupOptions: {
                input: entryPoints,
                output: {
                    inlineDynamicImports: false,
                    entryFileNames: (chunk) => {
                        return isRoot ? `assets/main.js` : `${chunk.name}/assets/main.js`;
                    },
                    assetFileNames: () => {
                        return isRoot ? `assets/[name].[ext]` : `assets/[name].[ext]`;
                    },
                    chunkFileNames: () => {
                        return isRoot ? `assets/chunk-[hash].js` : `assets/chunk-[hash].js`;
                    },
                },
            },
            minify: 'terser',
            target: 'esnext',
            terserOptions: {
                mangle: {
                    toplevel: true,
                    // 関数ベースにする場合
                    // properties: true,
                    // class使う場合
                    // properties: {
                    //     regex: /^(_|\$)/,
                    // },
                },
                compress: {
                    passes: 16,
                    // arguments: true,
                    // booleans_as_integers: true,
                    drop_console: isDropConsole,
                    drop_debugger: true,
                    // keep_fargs: false,
                    // module: true,
                    // pure_getters: true,
                    // unsafe: true,
                    // unsafe_math: true,
                    // unsafe_methods: true,
                    // unsafe_proto: true,
                    // unsafe_undefined: true,
                },
            },
        },
        ...(isWin(process)
            ? {
                  // for WSL
                  server: {
                      watch: {
                          usePolling: true,
                          interval: 2000,
                      },
                  },
              }
            : {}),
    };
});
