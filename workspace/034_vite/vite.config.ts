import {resolve} from "path";
import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";

console.log(resolve(__dirname, "index.html"));

// ref:
// https://github.com/vitejs/vite/issues/621
/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        tsconfigPaths(),
        checker({typescript: true}),
        viteSingleFile(),
        createHtmlPlugin(),
    ],
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
    server: {
        watch: {
            usePolling: true
        }
    }
});
