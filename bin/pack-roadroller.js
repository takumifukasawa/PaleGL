import { Packer } from 'roadroller';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'node:url';
import fs from 'fs';
import zopfli from 'node-zopfli';

const args = process.argv.slice(2);

const useHash = args.includes('--hash');
const showReport = !args.includes('--no-report');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir = path.join(__dirname, '../../dist');

const dir = path.join(distDir, 'assets');
const findPattern = path.join(dir, '*.js');

function padTime(str) {
    return ('' + str).padStart(2, '0');
}

const pack = async (filePath) => {
    const regex = new RegExp(/main.js/);
    const match = filePath.match(regex);
    const date = new Date();
    const id = `${padTime(date.getFullYear())}${padTime(date.getMonth() + 1)}${padTime(date.getDate())}${padTime(date.getHours())}${padTime(date.getMinutes())}`;

    const distPath = useHash
        ? path.join(distDir, `packed-${id}.html`)
        : path.join(distDir, 'packed.html');

    console.log(`Reading: ${filePath}`);
    const jsCode = await fs.promises.readFile(filePath, 'utf-8');
    const inputSize = jsCode.length;
    console.log(`Input size: ${inputSize.toLocaleString()} bytes`);

    // Roadroller setup
    const inputs = [{
        data: jsCode,
        type: 'js',
        action: 'eval'
    }];

    const packer = new Packer(inputs);

    // Optimization (this may take a while)
    console.log('Optimizing with Roadroller... (this may take 30s ~ few minutes)');
    const startTime = Date.now();

    await packer.optimize({
        // optimization level: 0=fast, 1=normal, 2=best
        optimization: 2,

        // Dictionary size (larger = better compression but slower)
        numAbbreviations: [2048, 512, 128],
        // numAbbreviations: [4096, 1024, 256],

        // Other options
        // maxMemoryMB: 150, // Memory limit
        // precision: 5, // Precision (lower = faster but worse compression)
    });

    const optimizeTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Optimization took ${optimizeTime}s`);

    // Generate decoder (Roadroller-optimized JS code)
    const { firstLine, secondLine } = packer.makeDecoder();
    const roadrollerOutput = firstLine + secondLine;
    const roadrollerSize = roadrollerOutput.length;

    console.log(`Roadroller output: ${roadrollerSize.toLocaleString()} bytes`);

    // Further compress with zopfli (2nd stage compression)
    console.log('Compressing with zopfli...');
    const zopfliStartTime = Date.now();

    const zopfliCompressed = await zopfli.deflate(Buffer.from(roadrollerOutput), {
        numiterations: 100,
        blocksplitting: true,
    });

    const zopfliTime = ((Date.now() - zopfliStartTime) / 1000).toFixed(1);
    console.log(`Zopfli compression took ${zopfliTime}s`);

    // Create self-extracting HTML
    // Using the same approach as compeko: SVG with DecompressionStream
    const licenseComment = '<!-- License information: See ./LICENSES.txt | Copyright (c) 2025 takumifukasawa. All Rights Reserved. -->';
    const svgTagBefore = '<svg onload="fetch`#`.then(t=>t.blob()).then(t=>new Response(t.slice(';
    const svgTagAfter = ').stream().pipeThrough(new DecompressionStream(\'deflate-raw\'))).text()).then(eval)">';

    // Calculate header size iteratively (since the size number itself affects the total length)
    const basePart = licenseComment + svgTagBefore + svgTagAfter;
    let headerSize = basePart.length + 3; // Start with assumption of 3-digit number
    let headerSizeStr = headerSize.toString();

    // Iterate until size converges
    while (basePart.length + headerSizeStr.length !== headerSize) {
        headerSize = basePart.length + headerSizeStr.length;
        headerSizeStr = headerSize.toString();
    }

    const header = licenseComment + svgTagBefore + headerSizeStr + svgTagAfter;
    const headerBuffer = Buffer.alloc(header.length);
    headerBuffer.write(header);

    const final = Buffer.concat([headerBuffer, zopfliCompressed]);

    const outputSize = final.length;
    const ratio = ((outputSize / inputSize) * 100).toFixed(2);

    console.log(`Final output size: ${outputSize.toLocaleString()} bytes (${ratio}%)`);

    // Save
    await fs.promises.writeFile(distPath, final);
    console.log(`Packed to: ${distPath}`);

    return distPath;
};

const HISTORY_FILE = path.join(__dirname, '../../.build-size-history.json');
const SIZE_LIMIT_64KB = 65536;

function formatBytes(bytes) {
    return bytes.toLocaleString('en-US');
}

function formatKB(bytes) {
    return (bytes / 1024).toFixed(2);
}

function loadSizeHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn('Failed to load size history:', error.message);
    }
    return {};
}

function saveSizeHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    } catch (error) {
        console.warn('Failed to save size history:', error.message);
    }
}

function reportFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    const stats = fs.statSync(filePath);
    const currentSize = stats.size;
    const history = loadSizeHistory();
    const previousSize = history.packedSize;

    console.log('\n' + '='.repeat(60));
    console.log(`✓ Packed file created: ${path.relative(process.cwd(), filePath)}`);
    console.log(`📦 File size: ${formatBytes(currentSize)} bytes (${formatKB(currentSize)} KB)`);

    if (previousSize !== undefined) {
        const diff = currentSize - previousSize;
        const diffKB = diff / 1024;
        const diffPercent = ((diff / previousSize) * 100).toFixed(2);
        const diffSign = diff > 0 ? '+' : '';
        const diffIcon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';

        console.log(`📊 Previous size: ${formatBytes(previousSize)} bytes (${formatKB(previousSize)} KB)`);
        console.log(`${diffIcon} Difference: ${diffSign}${formatBytes(diff)} bytes (${diffSign}${diffKB.toFixed(2)} KB) [${diffSign}${diffPercent}%]`);
    }

    if (currentSize <= SIZE_LIMIT_64KB) {
        const remaining = SIZE_LIMIT_64KB - currentSize;
        console.log(`✅ Under 64KB limit! Remaining: ${formatBytes(remaining)} bytes (${formatKB(remaining)} KB)`);
    } else {
        const exceeded = currentSize - SIZE_LIMIT_64KB;
        console.log(`⚠️  OVER 64KB limit! Exceeded by: ${formatBytes(exceeded)} bytes (${formatKB(exceeded)} KB)`);
    }
    console.log('='.repeat(60) + '\n');

    // Save history
    history.packedSize = currentSize;
    history.lastBuild = new Date().toISOString();
    saveSizeHistory(history);
}

const main = async () => {
    const res = await glob(findPattern);
    if (res.length < 1) {
        console.log('target file not found');
        return;
    }

    let packedPath;
    for (let i = 0; i < res.length; i++) {
        packedPath = await pack(res[i]);
    }

    // Report file size
    if (packedPath && showReport) {
        // Wait a bit for file write to complete
        setTimeout(() => {
            reportFileSize(packedPath);
        }, 100);
    }
};

main();
