import {resolve} from "path";
import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import gltf from "vite-plugin-gltf";
import glsl from "vite-plugin-glsl"
import {shaderMinifierPlugin} from "./vite-shader-minifier-plugin";

const isBundle = false;
const minifyShader = false;

// ref:
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig({
    base: "./",
    plugins: [
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
            defaultExpression: 'glsl',
            warnDuplicatedImports: true,
            exclude: undefined,
            enforce: "pre",
        }),
        shaderMinifierPlugin({
            minify: minifyShader,
            minifierOptions: {
                // preserveExternals: true
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
                // html含めてビルドする場合
                main: resolve(__dirname, "index.html"),
                // jsだけビルドする場合
                // main: resolve(__dirname, "src/main.ts"), 
            },
        },
    },
    server: {
        watch: {
            usePolling: true
        }
    }
});
