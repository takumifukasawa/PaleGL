const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------
// NOTE:
// - 一階層下までをwatch
// - ファイルのadd,remove,moveがある時は手動で一度killして再度立ち上げる
// - circular dependency には対応してない
//
// TODO:
// - catch error
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------

const watchRootPath = path.join(__dirname, "PaleGL");
const outputFilePath = path.join(__dirname, "pale-gl.js");
const rootModulePath = path.join(__dirname, "PaleGL/index.mjs");

const watchOptions = {
    persistent: true,
    interval: 100,
}

// ---------------------------------------------------------------------
// caches
// ---------------------------------------------------------------------

const importMaps = new Set();
const watchPaths = [];

// ---------------------------------------------------------------------
// functions
// ---------------------------------------------------------------------

function getDirectories(searchPath) {
    const dirents = fs.readdirSync(searchPath, {withFileTypes: true});
    const directoryPaths = [];
    for (const dirent of dirents) {
        if (dirent.isDirectory()) {
            const dirPath = path.join(searchPath, dirent.name);
            directoryPaths.push(dirPath);
        }
    }
    return directoryPaths;
}

function replaceContents(data, isLast = false) {
    // 手動でrootのmjsを末尾においているため
    if (isLast) {
        return data
            .replace(/ from (\'|\").*\.js(\'|\")/g, "");
    }

    const importRegex = /import \{[a-zA-Z0-9\s\,\/]*\} from (\'|\")[a-zA-Z0-9\/\.\s\-_]*(\.js)?(\'|\");?/g;
    const exportRegex = /export\s/g;
    return data
        .replace(importRegex, "")
        .replace(exportRegex, "");
}

function hasItemInImportMaps(path) {
    for (let [, value] of importMaps.entries()) {
        if (path === value.path) {
            return true;
        }
    }
    return false;
}

function extractImportFilePaths(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");

    // for debug
    // console.log("-----------");
    // console.log(`target file path: ${filePath}`);
    
    const regex = /(\'|\")(.*?\.js)(\'|\");/g;
    const matches = [...content.matchAll(regex)];
    const fileDir = path.dirname(filePath);
    matches.forEach((match) => {
        const importFilePath = path.normalize(path.join(fileDir, match[2]));
        if (!hasItemInImportMaps(importFilePath)) {
            extractImportFilePaths(importFilePath);
        }
    });

    // NOTE: has item のチェックいらないはずだけど一応
    if (!hasItemInImportMaps(filePath)) {
        importMaps.add({
            id: importMaps.size,
            path: filePath,
            content,
        });
    }
}


function bundle() {
    importMaps.clear();
    watchPaths.splice(0);

    extractImportFilePaths(rootModulePath);

    const replacedContents = Array.from(importMaps).map((item, i) => {
        const isLast = i === importMaps.size - 1;
        // for debug
        // console.log(item.id, item.path, isLast)
        return replaceContents(item.content, isLast);
    });

    const outputContent = replacedContents.join("\n");
    
    // TODO: minify
    // const bundledContent = replacedContents
    //     .join("\n")
    //     .replaceAll(/\/\*.*\*\//g, "");
    // const newLines = [];
    // bundledContent.split("\n").forEach(line => {
    //     let str = line;
    //     str = str
    //         .replace(/\/\/.*/, "");
    //     if(str !== "" || str !== "\n") {
    //         newLines.push(str);
    //     }
    // });
    // const outputContent = newLines.join("\n");

    fs.writeFile(outputFilePath, outputContent, "utf-8", () => {
        console.log("completed bundle file. -> " + outputFilePath);
    });
}

function watchFileHandler(current, prev) {
    console.log("start bundle.")
    bundle();
}

// cleanups
// ref: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits

function exitHandler(options) {
    watchPaths.forEach(watchPath => {
        fs.unwatchFile(watchPath, watchFileHandler);
    });
    if (options.cleanup) {
        console.log('cleanup exit.');
    }
    if (options.exit) {
        console.log("interrupted exit.");
        process.exit();
    }
}

function main() {
    console.log("start watch...");

    // initial exec
    console.log("initial bundle.");
    bundle();

    const subDirectoryPaths = getDirectories(watchRootPath);
    watchPaths.push(watchRootPath);
    watchPaths.push(...subDirectoryPaths);

    watchPaths.forEach(watchPath => {
        fs.watchFile(watchPath, watchOptions, watchFileHandler);
    });
}

// ---------------------------------------------------------------------
// execute
// ---------------------------------------------------------------------

process.on('exit', () => exitHandler({cleanup: true}));
process.on('SIGINT', () => exitHandler({exit: true}));
process.on('SIGUSR1', () => exitHandler({exit: true}));
process.on('SIGUSR2', () => exitHandler.bind({exit: true}));
process.on('uncaughtException', () => exitHandler.bind({exit: true}));

main();