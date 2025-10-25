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

            try {
                await rimraf(tmpDirPath);
                await wait(100); // WSL環境でのファイルシステム遅延を考慮
                await createDirectoryAsync(tmpDirPath);
            } catch (error) {
                // WSL環境でのファイルロック等によるエラーを無視して続行
                console.warn('[delete-tmp-caches-plugin] Warning: Failed to clean tmp directory, continuing...', error);
                try {
                    // ディレクトリが存在しない場合は作成
                    await createDirectoryAsync(tmpDirPath);
                } catch (e) {
                    // ディレクトリ作成も失敗した場合は警告のみ
                    console.warn('[delete-tmp-caches-plugin] Warning: Failed to create tmp directory', e);
                }
            }
        },
    };
};
