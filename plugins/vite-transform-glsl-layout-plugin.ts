import { Plugin } from 'vite';

/**
 *
 * #pragma BLOCK_***_START ~~ #pragma BLOCK_***_END を block として、その中身を挿入する
 */
export const transformGlslLayout: () => Plugin = () => {
    return {
        name: 'transform-glsl-layout',
        enforce: 'pre',
        // eslint-disable-next-line @typescript-eslint/require-await
        async transform(src: string, id: string) {
            const fileRegex = /\.glsl$/;
            if (fileRegex.test(id)) {
                const blockSrcRegex = /#pragma BLOCK_([A-Z_]*?)_START([\s\S]*?)#pragma BLOCK_[A-Z_]*?_END/g;
                const blockSrcMatches = [...src.matchAll(blockSrcRegex)];

                // for debug
                // const originalSrc = src;
                // console.log(`[transform-glsl-layout] target - id: ${id}`);
                // console.log("---------------------------------")
                // console.log(originalSrc)
                // console.log("---------------------------------")
                // console.log(blockSrcMatches)

                for (let i = 0; i < blockSrcMatches.length; i++) {
                    const [matchContent, blockName, blockContent] = blockSrcMatches[i];
                    const blockDestRegex = new RegExp(`#pragma BLOCK_${blockName}`, 'g');

                    // for debug
                    // console.log("---------------------------------")
                    // console.log("matchContent: ", matchContent);
                    // console.log("blockName: ", blockName);
                    // console.log("blockContent: ", blockContent);
                    // console.log("---------------------------------")
                    // console.log([...src.matchAll(blockDestRegex)]);
                    // console.log("---------------------------------")
                    // console.log("match block content: ", src.match(new RegExp(blockContent, 'g')));

                    // blockの囲い含めすべて消す
                    src = src.replaceAll(matchContent, '');
                    // 消した後、block内の記述を挿入（置き換え）
                    src = src.replaceAll(blockDestRegex, blockContent);
                }

                // for debug
                // console.log("---------------------------------")
                // console.log("original src: ------------------------------")
                // console.log(originalSrc)
                // console.log("result: ------------------------------")
                // console.log(src)

                return src;
            }
            return src;
        },
    };
};
