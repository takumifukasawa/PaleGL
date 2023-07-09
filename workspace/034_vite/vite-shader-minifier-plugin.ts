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

import {Plugin} from 'vite';
import {promisify} from 'util';
import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from "crypto";
import {rimraf} from "rimraf";

const exec = promisify(cp.exec);

const fileRegex = /\?shader$/;
// const fileRegex = /\?glsl$/;

export interface ShaderMinifierOptions {
    hlsl?: boolean;
    fieldNames?: string;
    preserveExternals?: boolean;
    preserveAllGlobals?: boolean;
    noRenaming?: boolean;
    noRenamingList?: string[];
    noSequence?: boolean;
    smoothstep?: boolean;
}

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

    return str;
}

export interface ShaderMinifierPluginOptions {
    minify: boolean;
    minifierOptions: ShaderMinifierOptions;
}

async function wait(msec) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, msec);
    });
}

async function createDirectoryAsync(path) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(path)) {
            console.warn("directory already exists: ", path);
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
    })
}

async function writeFileAsync(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    })
}

async function readFileAysnc(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf8", (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    })
}


export const shaderMinifierPlugin: (
    options: ShaderMinifierPluginOptions
) => Plugin = ({minify, minifierOptions}) => {
    return {
        name: 'shader-minifier',
        enforce: 'pre',
        async transform(src: string, id: string) {
            // console.log(`[shaderMinifierPlugin] id: ${id}`);
            if (fileRegex.test(id)) {
                await wait(100);
               
                // for debug
                // console.log(`[shaderMinifierPlugin] shader file id: ${id}`);
                if (minify === false) {
                    return `export default \`${src}\`;`;
                }

                if (/^#pragma shader_minifier_plugin bypass$/m.test(src)) {
                    console.warn(`\`#pragma shader_minifier_plugin bypass\` detected in ${id}. Bypassing shader minifier`);

                    return `export default \`${src}\`;`;
                }

                const name = path.basename(id).split('?')[0];
                // const name = path.basename( id ).split( '.' )[ 0 ];

                // for debug
                // console.log("name: ", name)

                const minifierOptionsString = buildMinifierOptionsString(minifierOptions);

                // for debug
                // console.log("minifierOptionsString: ", minifierOptionsString)

                const hashOriginalSrc = crypto.createHash('sha512').update((+new Date()).toString()).digest('hex').slice(0, 16);
                await wait(10);
                const hashTransformed = crypto.createHash('sha512').update((+new Date()).toString()).digest('hex').slice(0, 16);
                await wait(10);

                const basePath = "./";
                const tmpDirPath = path.join(basePath, "tmp");
                // for debug
                // console.log("tmpDirPath: ", tmpDirPath)
                const tmpHashOriginalSrcDirPath = path.join(tmpDirPath, hashOriginalSrc);
                // for debug
                // console.log("tmpHashOriginalSrcDirPath: ", tmpHashOriginalSrcDirPath)
                const tmpHashTransformedDirPath = path.join(tmpDirPath, hashTransformed);
                // for debug
                // console.log("tmpHashTransformedDirPath: ", tmpHashTransformedDirPath)
                const tmpCopiedFilePath = path.join(tmpHashOriginalSrcDirPath, name);
                // for debug
                // console.log("tmpCopiedFilePath: ", tmpCopiedFilePath)
                const tmpTransformedFilePath = path.join(tmpHashTransformedDirPath, name);
                // for debug
                // console.log("tmpTransformedFilePath: ", tmpTransformedFilePath)
                await createDirectoryAsync(tmpDirPath);
                await createDirectoryAsync(tmpHashOriginalSrcDirPath);
                await createDirectoryAsync(tmpHashTransformedDirPath);
                await writeFileAsync(tmpCopiedFilePath, src);
                const command = `shader_minifier.exe ${tmpCopiedFilePath} ${minifierOptionsString}-o ${tmpTransformedFilePath}`;
                console.log("command: ", command)
                await exec(command).catch(error => {
                    console.log("error: ", error);
                    throw new Error(`[shaderMinifierPlugin] shader_minifier.exe failed: ${error}`);
                });
                console.log("success shader_minifier.exe");
                const minifiedContent = await readFileAysnc(tmpTransformedFilePath);

                // for debug
                // console.log("remove dir: ", tmpHashOriginalSrcDirPath);
                await rimraf(tmpHashOriginalSrcDirPath);
                // for debug
                // console.log("remove dir: ", tmpHashTransformedDirPath);
                await rimraf(tmpHashTransformedDirPath);
                
                return {
                    code: `export default \`${minifiedContent}\`;`,
                };
            }
        }
    };
};
