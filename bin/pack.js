import { exec } from 'child_process';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);

const useHash = args[0] === '--hash';

// TODO: 引数を受け取るなりして動的に変えられるようにしたい
// const entryName = 'main';
const dir = path.join(process.cwd(), 'dist/assets/');
const findPattern = path.join(dir, '*.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function padTime(str) {
    return ('' + str).padStart(2, '0');
}

const pack = async (filePath) => {
    // hashある場合
    // const regex = new RegExp(`${entryName}-([a-zA-Z0-9]*)\.js$`);
    // hashない場合
    const regex = new RegExp(/main.js/);

    const match = filePath.match(regex);
    // const id = match[1]
    const date = new Date();
    const id = `${padTime(date.getFullYear())}${padTime(date.getMonth() + 1)}${padTime(date.getDate())}${padTime(date.getHours())}${padTime(date.getMinutes())}`;

    return new Promise((resolve) => {
        const packShellPath = path.join(__dirname, '../libs/packer.js');

        // id使う場合
        // id追加しない場合
        const distDir = path.join(__dirname, '../../dist');
        const distPath = useHash
            ? path.join(distDir, `packed-${id}.html`)
            : path.join(distDir, 'packed.html');

        const command = `node ${packShellPath} ${filePath} ${distPath}`;
        // // pattern2: jsexe
        // const packShellPath = path.join(process.cwd(), 'libs/jsexe.exe');
        // const distPath = path.join(process.cwd(), `dist/packed-${id}.html`);
        // const command = `${packShellPath} -po -cn ./dist/assets/main.js ./dist/packed-${id}.html`;
        // pattern2: pnginator
        // const packShellPath = path.join(process.cwd(), 'libs/pnginator.rb');
        // const distPath = path.join(process.cwd(), `dist/packed-${id}.html`);
        // const command = `ruby ${packShellPath} ./dist/assets/main.js ./dist/packed-${id}.png.html`;

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
