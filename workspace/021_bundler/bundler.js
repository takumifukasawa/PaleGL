const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------
// NOTE
// - 一階層下までをwatch
// - ファイルのadd,remove,moveがある時は手動で一度killして再度立ち上げる
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

function replaceContents(data, isLast = false) {
    // 手動でrootのmjsを末尾においているのでparseしない
    if (isLast) {
        return data.replaceAll(/ from \".*\.js\"/g, "");
    }

    const importRegex = /import \{[a-zA-Z0-9\s\,\/]*\} from \"[a-zA-Z0-9\/\.\s\-_]*\.js\";?/g;
    const exportRegex = /export\s/g;
    return data
        .replaceAll(importRegex, "")
        .replaceAll(exportRegex, "");
}

function hasItemInImportMaps(path) {
    for (let [, value] of importMaps.entries()) {
        if (path === value.path) {
            return true;
        }
    }
    return false;
}

function extractImportFilePaths(filePath, data = null, needsPush = true) {
    const content = data || fs.readFileSync(filePath, "utf-8");
    
    // for debug
    // console.log("-----------");
    // console.log(`target file path: ${filePath}`);

    const regex = /\"(.*?\.js)\";/g;
    const matches = [...content.matchAll(regex)];
    const fileDir = path.dirname(filePath);
    matches.forEach((match) => {
        const importFilePath = path.normalize(path.join(fileDir, match[1]));
        if (!hasItemInImportMaps(importFilePath)) {
            extractImportFilePaths(importFilePath);
        }
    });

    // has item のチェックいらないはずだけど一応
    if (needsPush && !hasItemInImportMaps(filePath)) {
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
    
        
    const rootContent = fs.readFileSync(rootModulePath, "utf-8");

    extractImportFilePaths(rootModulePath, rootContent, false);

    importMaps.add({
        id: importMaps.size,
        path: rootModulePath,
        content: rootContent,
    });

    const replacedContents = Array.from(importMaps).map((item, i) => {
        const isLast = i === importMaps.size - 1;
        // for debug
        // console.log(item.id, item.path, isLast)
        return replaceContents(item.content, isLast);
    });

    fs.writeFile(outputFilePath, replacedContents.join("\n"), () => {
        console.log("completed bundle file. -> " + outputFilePath);
    });
}

function watchFileHandler() {
    console.log("start bundle.")
    bundle();
}

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

// cleanups
// ref: https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits

function exitHandler(options) {
    watchPaths.forEach(watchPath => {
        fs.unwatchFile(watchPath, watchFileHandler);
    });
    if (options.cleanup) {
        console.log('cleanup on exit');
    }
    if (options.exit) {
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