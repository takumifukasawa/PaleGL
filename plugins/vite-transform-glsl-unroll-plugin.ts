import { Plugin } from 'vite';

/**
 *
 * #pragma UNROLL_START ~~ #pragma UNROLL_END を block として、その中身を挿入する
 * # 仕様
 * - 固定値 or definesを探す
 * - indexは0始まり
 * - unrollの中はfor文章一つという前提
 * - 2重ループは非対応。ただし、内側のループに対してのunrollは有効
 */
export const transformGlslUnroll: () => Plugin = () => {
    return {
        name: 'transform-glsl-unroll',
        enforce: 'pre',
        // eslint-disable-next-line @typescript-eslint/require-await
        async transform(src: string, id: string) {
            const fileRegex = /\.glsl$/;
            if (fileRegex.test(id)) {
                const unrollSrcRegex = /#pragma UNROLL_START([\s\S]*?)#pragma UNROLL_END/g;
                const unrollSrcMatches = [...src.matchAll(unrollSrcRegex)];
                // blockを抜き出す
                for (let i = 0; i < unrollSrcMatches.length; i++) {
                    // #pragmaの囲い自体を消す
                    const [needsUnrollBlockContent, needsUnrollContent] = unrollSrcMatches[i];
                    // const [, needsUnrollContent] = unrollSrcMatches[i];
                    // src = src.replaceAll(needsUnrollBlockContent, needsUnrollContent);

                    // forのブロックを中身だけに置き換え
                    // const forRegex = new RegExp('for.*?\\(int.*?;.*?<\\s+?.*?(.*?);.*?\\).*?{(.*?)}', 'g');
                    const forRegex = new RegExp('for.*?\\(int\\s([a-zA-Z0-9]+?).+?;.*?<\\s+?.*?(.*?);.*?\\).*?{(.*)}', 'g');
                    const forMatches = [...needsUnrollContent.matchAll(forRegex)];
                    if (forMatches.length < 1) {
                        console.error(`[transform-glsl-unroll] specify unroll but for loop not found: ${id}`);
                        continue;
                    }

                    // unrollの中はfor文が一つだけという前提
                    const [, forIterateName, forLoopNumStr, forContent] = forMatches[0];
                    // console.log(forIterateName, forLoopNumStr, forContent)

                    // 固定値の場合はそのまま使い、#define で定義されている場合はdefineの値をシェーダー内から拾ってくる
                    let loopCount = parseInt(forLoopNumStr);
                    if (isNaN(loopCount)) {
                        const defineRegex = new RegExp(`#define\\s+?${forLoopNumStr}\\s+?(\\d+)`, 'g');
                        const defineMatches = [...src.matchAll(defineRegex)];
                        if (defineMatches.length > 0) {
                            loopCount = parseInt(defineMatches[0][1]);
                            // for debug
                            // console.log(`[transform-glsl-unroll] loop count is defined: ${forLoopNumStr} = ${loopCount}`);
                        } else {
                            console.error(`[transform-glsl-unroll] loop count is not defined: ${forLoopNumStr}`);
                        }
                    } else {
                        // for debug
                        // console.log(`[transform-glsl-unroll] loop count is specified: ${forLoopNumStr} = ${loopCount}`);
                    }

                    let unrolledStr = '';
                    for (let j = 0; j < loopCount; j++) {
                        // ループのindexを置き換え. UNROLL_i を i に置き換える
                        const indexRegex = new RegExp(`UNROLL_${forIterateName}`, 'g');
                        unrolledStr += forContent.replaceAll(indexRegex, j.toString());
                    }

                    src = src.replaceAll(needsUnrollBlockContent, unrolledStr);
                }

                return src;
            }
            return src;
        },
    };
};
