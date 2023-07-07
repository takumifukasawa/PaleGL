import {resolve} from "path";
import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
// import gltf from "vite-plugin-gltf";

console.log(resolve(__dirname, "index.html"));

const isBundle = false;

// ref:
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        checker({typescript: true}),
        // gltf(),
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
                // main: resolve(__dirname, "index.html"),
                main: resolve(__dirname, "src/main.ts"),
            },
        },
    },
    server: {
        watch: {
            usePolling: true
        }
    }
});
