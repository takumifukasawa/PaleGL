const fs = require("fs");
const path = require("path");

const interval = 100;
const watchPath = path.join(__dirname, "PaleGL");
const outputFilePath = path.join(__dirname, "pale-gl.js");
const rootModulePath = path.join(__dirname, "PaleGL/index.mjs");

const importMaps = new Set();

function replaceContents(data, isLast = false) {
    const importRegex = /import \{[a-zA-Z0-9\s\,\/]*\} from \"[a-zA-Z0-9\/\.\s\-_]*\.js\";?/g;
    // const exportRegex = /export (class|const|default|function)\s/g;
    const exportRegex = /export\s/g;
    
    // 手動でrootのmjsが末尾にいるのでparseしない
    if(isLast) {
        return data.replaceAll(/ from \".*\.js\"/g, "");
    } else {
        return data
            .replaceAll(importRegex, "")
            .replaceAll(exportRegex, "");
    }
}

function hasItemInImportMaps(path) {
    for(let [, value] of importMaps.entries()) {
        if(path === value.path) {
            return true;
        }
    }
    return false;
}

function extractImportFilePaths(filePath, data = null, needsPush = true) {
    const content = data || fs.readFileSync(filePath, "utf-8");

    if(needsPush) {
        importMaps.add({
            id: importMaps.size,
            path: filePath,
            content,
        });
    }
    
    // for debug
    // console.log("-----------");
    // console.log(`target file path: ${filePath}`);
    
    const regex = /\"(.*?\.js)\";/g;
    const matches = [...content.matchAll(regex)];
    const fileDir = path.dirname(filePath);
    matches.forEach((match) => {
        const importFilePath = path.normalize(path.join(fileDir, match[1]));
        if(!hasItemInImportMaps(importFilePath)) {
            extractImportFilePaths(importFilePath);
        }
    });
}

function bundle() {
    const rootContent = fs.readFileSync(rootModulePath, "utf-8");
    
    extractImportFilePaths(rootModulePath, rootContent, false);

    importMaps.add({
        id: importMaps.size,
        path: rootModulePath,
        content: rootContent,
    });
    
    const replacedContents = Array.from(importMaps).map((item, i) => {
        const isLast = i === importMaps.size - 1;
        console.log(item.id, item.path, isLast)
        return replaceContents(item.content, isLast);
    });

    fs.writeFile(outputFilePath, replacedContents.join("\n"), () => {
        console.log("completed bundle file. -> " + outputFilePath);
    });
   
}

function main() {
    console.log("start watch...");
   
    bundle();
 
    // fs.watchFile(watchPath, {
    //     persistent: true,
    //     recursive: true,
    //     interval,
    // }, (current, prev) => {
    //     console.log("try bundle.")
    //     bundle();
    // })
}

main();