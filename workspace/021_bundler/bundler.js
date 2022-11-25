const fs = require("fs");
const path = require("path");

const interval = 100;
const watchPath = path.join(__dirname, "PaleGL");
const outputFilePath = path.join(__dirname, "pale-gl.js");
const rootModulePath = path.join(__dirname, "PaleGL/index.mjs");

function bundle() {
    const filePathList = [];

    const listFiles = (dirPath) => {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if(stats.isFile() && filePath !== rootModulePath) {
                filePathList.push(filePath);
            } else if(stats.isDirectory()) {
                listFiles(filePath);
            }
        });
    }
    
    listFiles(watchPath)
    
    // 手動でrootのmjsを末尾にpush
    filePathList.push(rootModulePath);
    
    const importRegex = /import \{[a-zA-Z0-9\s\n\,]*\} from \"[a-zA-Z0-9\/\.\s\-_]*\.js\";?/g;
    // const exportRegex = /export (class|const|default|function)\s/g;
    const exportRegex = /export\s/g;
    
    const replacedContents = [];
    
    filePathList.forEach((filePath, i) => {
        const data = fs.readFileSync(filePath, "utf-8");
        
        // 手動でrootのmjsが末尾にいるのでparseしない
        if(i === filePathList.length - 1) {
            replacedContents.push(data)
            return;
        }
        const replacedData = data
            .replaceAll(importRegex, "")
            .replaceAll(exportRegex, "");
        replacedContents.push(replacedData);
    });
    
    fs.writeFile(outputFilePath, replacedContents.join("\n"), () => {
        console.log("completed bundle file.");
    });
}

function main() {
    console.log("start watch...");
    fs.watchFile(watchPath, {
        persistent: true,
        recursive: true,
        interval,
    }, (current, prev) => {
        console.log("try bundle.")
        bundle();
    })
}

main();