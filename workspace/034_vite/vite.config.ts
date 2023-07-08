import {resolve} from "path";
import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import gltf from "vite-plugin-gltf";
import glsl from "vite-plugin-glsl";

console.log(resolve(__dirname, "index.html"));

const isBundle = false;

const replaceShaderPath = (src) => {
    // TODO: shader_minifierをかけたpathに書き換える
    // console.log("slice: ", src.slice(0, 32))
    return src;
}

function replaceShaderPathPlugin() {
    return {
        name: "replace-shader-path-plugin",
        transform(src, id) {
            return {
                code: replaceShaderPath(src),
                map: null
            }
        }
    }
}

// ref:
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig({
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
            exclude: undefined
        }),
        replaceShaderPathPlugin(),
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
