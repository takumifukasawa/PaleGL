import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";
import checker from 'vite-plugin-checker';

// ref:
// https://github.com/vitejs/vite/issues/621
export default defineConfig({
    plugins: [
        checker({typescript: true}),
        viteSingleFile(),
        createHtmlPlugin(),
    ],
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
    }
});
