import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { ShapeFontCircuit, ShapeFontCircuitChar } from '@/PaleGL/shapeFont/shapeFontCircuit/shapeFontCircuit.ts';

const renderChar: (
    ctx: CanvasRenderingContext2D,
    shapeFont: ShapeFontCircuit,
    charInfo: ShapeFontCircuitChar,
    srcX: number,
    srcY: number,
    ratio: number
) => void = (ctx, shapeFont, charInfo, srcX, srcY, ratio) => {
    const { lineWidth, dotLineWidth, dotRadius } = shapeFont;

    const [coords, lines, dots, strokeDots] = charInfo;

    // draw lines
    ctx.save();
    ctx.lineWidth = lineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        ctx.beginPath();
        for (let j = 0; j < line.length; j++) {
            const pi = line[j];
            if (pi >= 0) {
                const px = coords[pi * 2];
                const py = coords[pi * 2 + 1];
                const x = srcX + px * ratio;
                const y = srcY + py * ratio;

                // draw line
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            } else {
                ctx.closePath();
            }
        }
        ctx.stroke();
    }
    ctx.restore();

    // draw dots
    ctx.save();
    ctx.lineWidth = dotLineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    for (let i = 0; i < dots.length; i++) {
        const pi = dots[i];
        const x = coords[pi * 2];
        const y = coords[pi * 2 + 1];
        ctx.beginPath();
        ctx.arc(srcX + x * ratio, srcY + y * ratio, dotRadius * ratio, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // draw stroke dots
    ctx.save();
    ctx.lineWidth = dotLineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    for (let i = 0; i < strokeDots.length; i++) {
        const pi = strokeDots[i];
        const x = coords[pi * 2];
        const y = coords[pi * 2 + 1];
        ctx.beginPath();
        ctx.arc(srcX + x * ratio, srcY + y * ratio, dotRadius * ratio, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
};

export const renderShapeFontCircuit: (
    shapeFontRenderer: ShapeFontRenderer<ShapeFontCircuitChar, ShapeFontCircuit>
) => void = (shapeFontRenderer) => {
    const { shapeFont, shapeFontAtlas, ctx, canvasWidth, canvasHeight } = shapeFontRenderer;
    const { colNum, charNum, cellWidth, cellHeight, ratio } = shapeFontAtlas;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    let currentIndex = 0;
    for (let i = 0; i < shapeFont.charInfo.length; i++) {
        const [, charInfo] = shapeFont.charInfo[i];
        const charIndex = currentIndex % charNum;
        const cellX = (charIndex % colNum) * cellWidth;
        const cellY = Math.floor(charIndex / colNum) * cellHeight;
        ctx.save();
        renderChar(ctx, shapeFont, charInfo, cellX, cellY, ratio);
        ctx.restore();
        currentIndex++;
    }

    // for (let y = 0; y < rowNum; y++) {
    //     for (let x = 0; x < colNum; x++) {
    //         const charIndex = y * colNum + x;
    //         if (charIndex >= charNum) {
    //             break;
    //         }
    //         const cellX = x * cellWidth;
    //         const cellY = y * cellHeight;
    //         const charInfo = shapeFontCircuit.charInfo[charIndex];
    //         ctx.save();
    //         renderChar(ctx, shapeFontCircuit, charInfo, cellX, cellY, ratio);
    //         ctx.restore();
    //     }
    // }
};
