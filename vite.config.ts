import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
// @ts-ignore
import gltf from 'vite-plugin-gltf';
import glsl from 'vite-plugin-glsl';
import checker from 'vite-plugin-checker';
import * as process from 'process';
import { transformGlslLayout } from './plugins/vite-transform-glsl-layout-plugin.ts';
import string from 'vite-plugin-string';
import { shaderMinifierPlugin } from './plugins/vite-shader-minifier-plugin.ts';
import { deleteTmpCachesPlugin } from './plugins/vite-delete-tmp-caches-plugin.ts';
import { isWin } from './node-libs/env';

type EntryPointInfo = { name: string; path: string };

// ---------------------------------------------------
// ビルドするentryを定義. TODO: 手動で切り替えるの面倒なので自動で分けたい
const ENTRY_POINTS: { [key: string]: string } = {
    ['sandbox']: 'labs/sandbox',
    ['street-light']: 'labs/street-light',
    ['morph-glass']: 'labs/morph-glass',
};

// ---------------------------------------------------

// ref:
// https://ja.vitejs.dev/config/
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig(async (config) => {
    
    const { mode } = config;
    
    const env = loadEnv(mode, process.cwd());
    
    // NOTE: 本来はなくてもいいはず
    Object.assign(process.env, env);

    const isDropConsole = env.VITE_DROP_CONSOLE === 'true';
    const isMinifyShader = env.VITE_MINIFY_SHADER === 'true';

    console.log(`=== [env] mode: ${mode} ===`);
    console.log(`isDropConsole: ${isDropConsole}`);
    console.log(`isMinifyShader: ${isMinifyShader}`);
    console.log(`entryNames: ${ENTRY_POINTS}`);

    // NOTE: 今はentryを一つにしているので複数管理前提にする必要はない
    const entryPointInfos: EntryPointInfo[] = [];

    Object.keys(ENTRY_POINTS).forEach((key) => {
        const path = ENTRY_POINTS[key];
        entryPointInfos.push({
            name: path,
            path,
        });
    });

    const entryPoints: { [key: string]: string } = {};
    entryPointInfos.forEach((entryPointInfo) => {
        entryPoints[entryPointInfo.name] = resolve(__dirname, `pages/${entryPointInfo.path}/index.html`); // html含めてビルドする場合
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
            checker({
                overlay: false,
            }),
            deleteTmpCachesPlugin(),
            tsconfigPaths(),
            checker({ typescript: true }),
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
                compress: false,
            }),
            transformGlslLayout(),
            shaderMinifierPlugin({
                minify: isMinifyShader,
                minifierOptions: {
                    preserveExternals: true,
                    aggressiveInlining: false,
                    noRenamingList: [
                        // 最低限この2つは置き換える
                        "main",
                        "dfScene",
                        // 適宜置き換える
                        'uv',
                        'baseColor',
                        'emissiveColor',
                        'resultColor'
                    ]
                },
            }),
            checker({
                typescript: true,
                eslint: {
                    lintCommand: 'eslint --ext .ts,.js ./',
                },
            }),
            visualizer({
                template: 'treemap',
            }),
        ],
        // assetsInclude: ['**/*.gltf', '**/*.dxt'],
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
                        return `${chunk.name}/assets/main.js`;
                    },
                    assetFileNames: (chunk) => {
                        return `${chunk.name}/assets/[name].[ext]`;
                    },
                    chunkFileNames: () => {
                        return `assets/chunk-[hash].js`;
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
        ...(isWin(process) ? {
            // for WSL
            server: {
                watch: {
                    usePolling: true,
                    interval: 2000,
                },
            },
        } : {})
    };
});
