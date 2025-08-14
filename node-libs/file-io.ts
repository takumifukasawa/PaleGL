import * as fs from 'fs';

export async function createDirectoryAsync(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path)) {
            console.warn('directory already exists: ', path);
            resolve();
            return;
        }
        fs.mkdir(path, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

export async function writeFileAsync(path: string, data: string | NodeJS.ArrayBufferView): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

export async function readFileAysnc(path: string) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}
