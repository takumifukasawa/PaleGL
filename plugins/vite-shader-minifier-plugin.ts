// base: https://gist.github.com/0b5vr/7c0d000ab9a43268c47273c272b81de0
// tmpをプロジェクトのルート扱いに変更

// vite-shader-minifier-plugin

// Copyright (c) 2022 0b5vr
// SPDX-License-Identifier: MIT

// Compatible with Shader Minifier 1.2
// https://github.com/laurentlb/Shader_Minifier/releases/tag/1.2

// Usage:
// - Make sure `shader_minifier.exe` is visible via PATH
// - Install the plugin into your `vite.config.ts`
// - Optionally, you can give `minifierOptions`. You probably want to put `{ preserveExternals: true }`.

// Disclaimer: I'm pretty sure this published version will not be updated frequently

import { Plugin } from 'vite';
import { promisify } from 'util';
import * as cp from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import { rimraf } from 'rimraf';
import { wait } from '../node-libs/wait';
import { readFileAysnc, createDirectoryAsync, writeFileAsync } from '../node-libs/file-io';

export interface ShaderMinifierOptions {
    hlsl?: boolean;
    fieldNames?: string;
    preserveExternals?: boolean;
    preserveAllGlobals?: boolean;
    noRenaming?: boolean;
    noRenamingList?: string[];
    noSequence?: boolean;
    smoothstep?: boolean;
    aggressiveInlining?: boolean;
}

const exec = promisify(cp.exec);

const hashSliceNum = 32;
const ioInterval = 10;

function buildMinifierOptionsString(options: ShaderMinifierOptions): string {
    let str = '';

    if (options.hlsl) {
        str += '--hlsl ';
    }

    str += '--format text ';

    if (options.fieldNames) {
        str += `--field-names ${options.fieldNames} `;
    }

    if (options.preserveExternals) {
        str += '--preserve-externals ';
    }

    if (options.preserveAllGlobals) {
        str += '--preserve-all-globals ';
    }

    if (options.noRenaming) {
        str += '--no-renaming ';
    }

    if (options.noRenamingList) {
        str += `--no-renaming-list ${options.noRenamingList.join(',')} `;
    }

    if (options.noSequence) {
        str += '--no-sequence ';
    }

    if (options.smoothstep) {
        str += '--smoothstep ';
    }

    if (options.aggressiveInlining) {
        str += '--aggressive-inlining ';
    }

    return str;
}

export interface ShaderMinifierPluginOptions {
    minify: boolean;
    minifierOptions: ShaderMinifierOptions;
}

export const shaderMinifierPlugin: (options: ShaderMinifierPluginOptions) => Plugin = ({ minify, minifierOptions }) => {
    return {
        name: 'shader-minifier',
        enforce: 'pre',
        async transform(src: string, id: string) {
            const fileRegex = /\.glsl$/;
            if (fileRegex.test(id)) {
                await wait(100);

                const basePath = './';
                const tmpDirPath = path.join(basePath, 'tmp');

                const name = path.basename(id);
                // const name = path.basename(id).split('?')[0];
                // const name = path.basename( id ).split( '.' )[ 0 ];

                // minify

                // for debug
                // console.log(`[shaderMinifierPlugin] shader file id: ${id}`);
                // TODO: entry point じゃないシェーダーはminifyしない？
                if (!minify) {
                    // console.log('disabled minify content...: ', src);
                    return src;
                }

                // vite-plugin-glslで変換された文字列からシェーダーコードを抜き出す
                // eslint-disable-next-line no-useless-escape
                const contentRegex = /^var\s([a-zA-Z_]*)_default\s?\=\s?\"(.*)\"/;
                const bundledContent = src.split('\n').join(' ').match(contentRegex);

                if (!bundledContent) {
                    console.warn('unmatch bundledContent: ', src);
                    return src;
                }

                let [, , shaderContent] = bundledContent;

                // TODO: minify時は改行消しちゃダメな気がする
                // TODO: devとprodで改行文字の入り方が違う？確認
                shaderContent = shaderContent.replaceAll('\\n', '\n');
                shaderContent = shaderContent.replaceAll('\\r', '\n');

                const entryPointRegex = /void main\(/;
                // const entryPointRegex = /#define MINIFY\nvoid main\(/;
                const isEntryPoint = entryPointRegex.test(shaderContent);

                if (!isEntryPoint) {
                    console.log(`\nskip minify: ${id}`);
                    return src;
                }

                const minifierOptionsString = buildMinifierOptionsString(minifierOptions);

                // コピーするディレクトリのhashを作成
                const hashOriginalSrc = crypto
                    .createHash('sha512')
                    .update(`${name}:${(+new Date()).toString()}`)
                    .digest('hex')
                    .slice(0, hashSliceNum);
                await wait(ioInterval);

                // minify格納ディレクトリのhashを作成
                const hashTransformed = crypto
                    .createHash('sha512')
                    .update(`${name}:${(+new Date()).toString()}`)
                    .digest('hex')
                    .slice(0, hashSliceNum);
                await wait(ioInterval);

                const tmpHashOriginalSrcDirPath = path.join(tmpDirPath, hashOriginalSrc);
                const tmpHashTransformedDirPath = path.join(tmpDirPath, hashTransformed);
                const tmpCopiedFilePath = path.join(tmpHashOriginalSrcDirPath, name);
                const tmpTransformedFilePath = path.join(tmpHashTransformedDirPath, name);

                // シェーダーをコピーするディレクトリを作成
                await createDirectoryAsync(tmpHashOriginalSrcDirPath);
                await wait(ioInterval);

                // シェーダーをminifyするディレクトリを作成
                await createDirectoryAsync(tmpHashTransformedDirPath);
                await wait(ioInterval);

                // シェーダーをコピー
                await writeFileAsync(tmpCopiedFilePath, shaderContent);
                await wait(ioInterval);

                // for debug
                // if (name === 'gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl') {
                //     console.log(`\n----- entry point shader content - name: ${name} -----\n`);
                //     console.log(shaderContent);
                //     console.log('\n-----------\n');
                // }

                // minify
                const minifyCommand = `./libs/shader_minifier.exe ${tmpCopiedFilePath} ${minifierOptionsString}-o ${tmpTransformedFilePath}`;
                console.log('command: ', minifyCommand);
                await exec(minifyCommand).catch((error) => {
                    console.log('error: ', error);
                    throw new Error(
                        `[shaderMinifierPlugin] shader_minifier.exe failed... name: ${name}, error: ${error}`
                    );
                });
                console.log(`success shader_minifier.exe: ${name}`);

                // minifyしたシェーダーを読み込む
                const minifiedContent = await readFileAysnc(tmpTransformedFilePath);
                await wait(ioInterval);

                // シェーダーをコピーしたディレクトリを削除
                await rimraf(tmpHashOriginalSrcDirPath);
                await wait(ioInterval);

                // minifyしたシェーダーのディレクトリを削除
                await rimraf(tmpHashTransformedDirPath);
                await wait(ioInterval);

                // pluginの結果を返す
                // eslint-disable-next-line no-useless-escape
                const resultContent = `export default \`${minifiedContent as string}\``;
                return {
                    code: resultContent,
                };
            }
        },
    };
};
