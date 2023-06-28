import {defineConfig} from "vite";
import {viteSingleFile} from "vite-plugin-singlefile";
import {createHtmlPlugin} from "vite-plugin-html";

// ref:
// https://github.com/vitejs/vite/issues/621
export default defineConfig({
    plugins: [
        viteSingleFile(),
        createHtmlPlugin()
    ],
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
    }
});