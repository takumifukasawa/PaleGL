import { exec } from 'child_process';
import { glob } from 'glob';
import path from 'path';

// TODO: 引数を受け取るなりして動的に変えられるようにしたい
const entryName = 'main';
const dir = path.join(process.cwd(), 'dist/assets/');
const findPattern = path.join(dir, '*.js');

const pack = async (filePath) => {
    const regex = new RegExp(`${entryName}-([a-zA-Z0-9]*)\.js$`);
    const match = filePath.match(regex);
    const id = match[1];
    return new Promise((resolve) => {
        const packShellPath = path.join(process.cwd(), 'libs/packer.js');
        const distPath = path.join(process.cwd(), `dist/packed-${id}.html`);
        const command = `node ${packShellPath} ${filePath} ${distPath}`;
        console.log(`run: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            resolve();
        });
    });
};

const main = async () => {
    const res = await glob(findPattern);
    if (res.length < 1) {
        console.log('target file not found');
        return;
    }
    for (let i = 0; i < res.length; i++) {
        await pack(res[i]);
    }
};

main();
// const command = "";
// exec("")
