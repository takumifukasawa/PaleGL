import * as path from 'path';
import { Plugin } from 'vite';
import { rimraf } from 'rimraf';
import { createDirectoryAsync } from '../node-libs/file-io';
import { wait } from '../node-libs/wait';

/**
 *
 */
export const deleteTmpCachesPlugin: () => Plugin = () => {
    return {
        name: 'delete-tmp-caches-plugin',
        // enforce: 'pre',
        async buildStart() {
            console.log('build start: delete-tmp-caches-plugin');
            const basePath = './';
            const tmpDirPath = path.join(basePath, 'tmp');
            await rimraf(tmpDirPath);
            await wait(10);
            await createDirectoryAsync(tmpDirPath);
        },
    };
};
