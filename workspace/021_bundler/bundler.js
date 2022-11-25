const fs = require("fs");
const path = require("path");

const watchPath = path.join(__dirname, "PaleGL");

fs.watchFile(watchPath, {
    persistent: true,
    recursive: true,
    interval: 100,
}, (current, prev) => {
    console.log(current, prev)
})
