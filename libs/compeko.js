// ref: https://gist.github.com/0b5vr/09ee96ca2efbe5bf9d64dad7220e923b

// =================================================================================================

// compeko - pack JavaScript into a self-extracting html+deflate
// v1.1.1

// Copyright (c) 2022-2023 0b5vr
// SPDX-License-Identifier: MIT

// Usage:
// - prepare a js code, which will be fed into `eval`
// - install `node-zopfli` as your (dev-) dependency
// - run: `node compeko.js input.js output.html`

// Shoutouts to:
// - gasman, for pnginator ... https://gist.github.com/gasman/2560551
// - Charles Boccato, for JsExe ... https://www.pouet.net/prod.php?which=59298
// - subzey, for fetchcrunch ... https://github.com/subzey/fetchcrunch
//   - Achieves almost the same concept. Referred several tricks of the header code

// =================================================================================================

import zopfli from 'node-zopfli';
import fs from 'fs';
import { resolve } from 'path';

// -- sanity check ---------------------------------------------------------------------------------

console.log('run packer');

if (process.argv[3] == null) {
    console.error('\x1b[31mUsage: \x1b[35mnode compeko.js input.js output.html\x1b[0m');
    process.exit(1);
}

// -- main -----------------------------------------------------------------------------------------
console.info('Compressing the file...');

(async () => {
    const inputPath = resolve(process.cwd(), process.argv[2]);
    const outputPath = resolve(process.cwd(), process.argv[3]);

    const inputFile = await fs.promises.readFile(inputPath);
    const inputSize = inputFile.length;
    console.info(`Input size: \x1b[32m${inputSize.toLocaleString()} bytes\x1b[0m`);

    const compressed = await zopfli.deflate(inputFile, {
        numiterations: 100, // increase this number to shave your last bytes
        blocksplitting: true,
    });

    // extra: output deflate
    {
        const outputPathBase = outputPath.match(/(.*)\..+$/)[1];
        const deflatePath = `${outputPathBase}.deflate.bin`;
        await fs.promises.writeFile(deflatePath, compressed);
    }

    const header =
        '<svg onload="fetch`#`.then(t=>t.blob()).then(t=>new Response(t.slice(156).stream().pipeThrough(new DecompressionStream(\'deflate-raw\'))).text()).then(eval)">';
    const headerBuffer = Buffer.alloc(header.length);
    headerBuffer.write(header);

    const concated = Buffer.concat([headerBuffer, compressed]);

    const outputSize = concated.length;
    const percentage = (100.0 * (outputSize / inputSize)).toFixed(3);
    console.info(`Output size: \x1b[32m${outputSize.toLocaleString()} bytes\x1b[0m (${percentage} %)`);

    await fs.promises.writeFile(outputPath, concated);

    console.info('Done \x1b[32m✓\x1b[0m');
})();
