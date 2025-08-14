import { Plugin } from 'vite';
import * as path from 'path';
import { readFileAysnc, writeFileAsync } from '../node-libs/file-io';

function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .split('-')
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
}

/*
// https://gist.github.com/think49/071350bcc987d82dd836885ea6f5c0d4
function matchAllCharacterPair(str: string, startChar: string, endChar: string) {
    'use strict';

    startChar = String(startChar)[0];
    endChar = String(endChar)[0];

    let result;
    const reg = new RegExp('[\\' + startChar + '\\' + endChar + ']|[^\\' + startChar + '\\' + endChar + ']+', 'g');
    const pairList = [];
    let nestLevel = 0;
    let matchString: string;
    let pair;

    while ((result = reg.exec(str)) !== null) {
        matchString = result[0];

        switch (matchString) {
            case startChar:
                ++nestLevel;
                pair += matchString;
                break;
            case endChar:
                if (nestLevel === 0) {
                    break;
                }

                pair += matchString;

                if (--nestLevel === 0) {
                    pairList.push(pair);
                    pair = '';
                }
                break;
            default:
                if (nestLevel) {
                    pair += matchString;
                }
        }
    }

    return pairList;
}
*/

/*
function extractDfSceneBlock(code: string) {
    const dfScenePattern = /vec2 dfScene\s*\(\)\s*\{/g;
    let match;
    let startIndex;
    let openBraces = 0;

    // dfScene ブロックの開始位置を探す
    while ((match = dfScenePattern.exec(code)) !== null) {
        startIndex = match.index + match[0].length;
        openBraces = 1;

        // 波括弧のペアを追跡する
        for (let i = startIndex; i < code.length; i++) {
            if (code[i] === '{') {
                openBraces++;
            } else if (code[i] === '}') {
                openBraces--;
            }

            // 波括弧がすべて閉じられたらブロックを返す
            if (openBraces === 0) {
                return code.slice(match.index, i + 1);
            }
        }
    }

    return null; // 見つからなかった場合
}
 */

async function writeTemplateFileAndExtractScene(templateName: string, rawSrc: string): Promise<string> {
    console.log('===================================');
    console.log('[transformExtractGlslRaymarchTemplate.writeTemplateFileAndExtractScene]', templateName);
    const streamSrcRegex = /export\s+default\s+`([^`]+)`/;
    const streamSrcMatch = rawSrc.match(streamSrcRegex);
    if (!streamSrcMatch) {
        console.log('streamSrcMatch is null');
        console.log('===================================');
        return rawSrc;
    }

    const [, src] = streamSrcMatch;

    // template書き出しファイルのパス
    const basePath = './src/PaleGL/shaders/templates';
    const templatesDirPath = path.join(basePath);
    const templateFilePath = path.join(templatesDirPath, `${templateName}-template.ts`);

    // wip
    // const raymarchContentRegex = /#define RAYMARCH_CONTENT\n#ifdef RAYMARCH_CONTENT([\s\S]*?)#endif/g;
    const raymarchContentRegex = /(vec2 dfScene\(.*?\)\{.*?;\})/;
    const raymarchContentRegexMatch = src.match(raymarchContentRegex);

    // for debug
    // console.log('[transformExtractGlslRaymarchTemplate.writeTemplateFileAndExtractScene] src:\n', src);

    if (!raymarchContentRegexMatch) {
        console.log('raymarchContentRegexMatch is null');
        console.log('===================================');
        return rawSrc;
    }
    const [, raymarchBody] = raymarchContentRegexMatch;

    if (!raymarchBody) {
        console.log('raymarchContentRegexMatch is null');
        console.log('===================================');
        return rawSrc;
    }

    const templateShader = src.replace(raymarchBody, '\n#pragma RAYMARCH_SCENE\n');
    const variableName = `${toCamelCase(templateName)}Template`;
    const templateContent = `export const ${variableName} = \`${templateShader}\`;`;

    console.log('templateName, variableName: ', templateName, variableName);
    // console.log('raymarchBody: ', raymarchBody);
    // console.log('templateContent: ', templateContent);
    console.log('templateFilePath: ', templateFilePath);
    console.log('===================================');

    const existsTemplateContent = await readFileAysnc(templateFilePath);

    const isSameExistsContent = existsTemplateContent === templateContent;
    console.log(
        `[transformExtractGlslRaymarchTemplate.writeTemplateFileAndExtractScene] check same content... name: ${variableName}, same: ${isSameExistsContent})`
    );
    if (!isSameExistsContent) {
        await writeFileAsync(templateFilePath, templateContent);
    }

    return `export default \`${raymarchBody}\``;
}

export interface TransformExtractGlslRaymarchTemplateOptions {
    extractEnabled: boolean;
}

export const transformExtractGlslRaymarchTemplate: (options: TransformExtractGlslRaymarchTemplateOptions) => Plugin = ({
    extractEnabled,
}: {
    extractEnabled: boolean;
}) => {
    return {
        name: 'extract-glsl-layout',
        enforce: 'pre',
        // eslint-disable-next-line @typescript-eslint/require-await
        async transform(src: string, id: string) {
            if (!extractEnabled) {
                return src;
            }

            // 列挙の形にしたくないが許容
            const regexList = [
                /^.*(gbuffer-object-space-raymarch-depth-fragment)-.*\.glsl$/,
                /^.*(gbuffer-screen-space-raymarch-depth-fragment)-.*\.glsl$/,
                /^.*(lit-object-space-raymarch-fragment)-.*\.glsl$/,
                /^.*(lit-screen-space-raymarch-fragment)-.*\.glsl$/,
            ];

            for await (const regex of regexList) {
                const fileNameMatch = id.match(regex);
                if (fileNameMatch) {
                    const [, templateName] = fileNameMatch;
                    const extractedSrc = await writeTemplateFileAndExtractScene(templateName, src);
                    return extractedSrc;
                }
            }

            // const gBufferDepthFileNameMatch = id.match(gBufferDepthFileRegex);
            // const litFileNameMatch = id.match(litFileRegex);

            // if (gBufferDepthFileNameMatch) {
            //     const [, templateName] = gBufferDepthFileNameMatch;
            //     const extractedSrc = await writeTemplateFileAndExtractScene(templateName, src);
            //     return extractedSrc;
            // }
            // if (litFileNameMatch) {
            //     const [, templateName] = litFileNameMatch;
            //     const extractedSrc = await writeTemplateFileAndExtractScene(templateName, src);
            //     return extractedSrc;
            // }

            return src;
        },
    };
};
