import {resolve} from "path";
import {defineConfig, Plugin} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import gltf from "vite-plugin-gltf";
import glsl from "vite-plugin-glsl"
import {shaderMinifierPlugin, ShaderMinifierPluginOptions} from "./vite-shader-minifier-plugin";
import checker from "vite-plugin-checker";
import {rimraf} from "rimraf";
import path from "path";
import {createDirectoryAsync} from "./node-libs/file-io";
import {wait} from "./node-libs/wait";

const isBundle = false;
const isMinifyShader = true;

export const deleteTmpCachesPlugin: () => Plugin = () => {
    return {
        name: 'delete-tmp-caches-plugin',
        // enforce: 'pre',
        async buildStart() {
            console.log("build start: delete-tmp-caches-plugin");
            const basePath = './'
            const tmpDirPath = path.join(basePath, 'tmp');
            await rimraf(tmpDirPath);
            await wait(10);
            await createDirectoryAsync(tmpDirPath);
        }
    }
}

// ref:
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig({
    base: "./",
    plugins: [
        deleteTmpCachesPlugin(),
        tsconfigPaths(),
        checker({typescript: true}),
        gltf(),
        glsl({
            // compress: false,
            include: [
                "**/*.glsl"
            ],
            watch: true,
            root: "src/PaleGL",
            defaultExtension: 'glsl',
            warnDuplicatedImports: true,
            exclude: undefined,
            compress: false,
            enforce: "pre",
        }),
        shaderMinifierPlugin({
            minify: isMinifyShader,
            minifierOptions: {
                preserveExternals: true
            }
        }),
        checker({
            typescript: true,
            eslint: {
                lintCommand: 'eslint --ext .ts,.js ./'
            }
        }),
        // replaceShaderPathPlugin(),
        ...(isBundle ? [
            viteSingleFile(),
            createHtmlPlugin(),
        ] : [])
    ],
    assetsInclude: ['**/*.gltf'],
    build: {
        cssCodeSplit: false,
        // このbyte数よりも小さいアセットはbase64になる
        assetsInlineLimit:
            isBundle
                ? 100000000
                : 0,
        rollupOptions: {
            input: {
                main: isBundle
                    ? resolve(__dirname, "src/main.ts") // js一個にまとめる場合
                    : resolve(__dirname, "index.html") // html含めてビルドする場合
            },
        },
    },
    server: {
        watch: {
            usePolling: true
        }
    }
});
