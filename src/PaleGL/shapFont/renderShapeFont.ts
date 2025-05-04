import { ShapeFontRenderer } from '@/PaleGL/shapFont/shapeFontRenderer.ts';
import { ShapeCharInfo, ShapeFont } from '@/PaleGL/shapFont/shapeFont.ts';

export type ShapeFontAtlas = {
    textureWidth: number;
    textureHeight: number;
    cellWidth: number;
    cellHeight: number;
    spacing: number;
    charNum: number;
    charset: string;
    rowNum: number;
    colNum: number;
    aspect: number;
    ratio: number;
};

export const buildShapeFontAtlas = (
    shapeFont: ShapeFont,
    textureWidth: number,
    textureHeight: number
): ShapeFontAtlas => {
    const { colNum } = shapeFont;
    const charNum = shapeFont.charInfo.length;
    const charset = shapeFont.charInfo.map((charInfo) => charInfo.char).join('');
    const rowNum = Math.ceil(charNum / colNum);
    const fontAspect = shapeFont.rawCellWidth / shapeFont.rawCellHeight; // w / h
    const cellWidth = Math.floor(textureWidth / colNum);
    const ratio = cellWidth / shapeFont.rawCellWidth;
    const cellHeight = Math.floor(cellWidth / fontAspect);

    return {
        textureWidth,
        textureHeight,
        cellWidth,
        cellHeight,
        spacing: 0,
        charNum,
        charset,
        rowNum,
        colNum,
        aspect: fontAspect,
        ratio,
    };
};

const renderChar: (
    ctx: CanvasRenderingContext2D,
    shapeFont: ShapeFont,
    charInfo: ShapeCharInfo,
    srcX: number,
    srcY: number,
    ratio: number
) => void = (ctx, shapeFont, charInfo, srcX, srcY, ratio) => {
    const { lineWidth, dotLineWidth, dotRadius } = shapeFont;
    const { lines, dots, strokeDots } = charInfo;

    // draw lines
    ctx.save();
    ctx.lineWidth = lineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    for (let i = 0; i < lines.length; i++) {
        const path = lines[i];
        const pathNum = path.length / 2;
        ctx.beginPath();
        for (let j = 0; j < pathNum; j++) {
            const beginIndex = j * 2;
            const fromX = path[beginIndex];
            const fromY = path[beginIndex + 1];
            const toIndex = beginIndex + 2;
            const toX = path[toIndex];
            const toY = path[toIndex + 1];
            ctx.moveTo(srcX + fromX * ratio, srcY + fromY * ratio);
            ctx.lineTo(srcX + toX * ratio, srcY + toY * ratio);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();

    // draw dots
    ctx.save();
    ctx.lineWidth = dotLineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        ctx.beginPath();
        ctx.arc(srcX + dot[0] * ratio, srcY + dot[1] * ratio, dotRadius * ratio, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();

    // draw stroke dots
    ctx.save();
    ctx.lineWidth = dotLineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    for (let i = 0; i < strokeDots.length; i++) {
        const dot = strokeDots[i];
        ctx.beginPath();
        ctx.arc(srcX + dot[0] * ratio, srcY + dot[1] * ratio, dotRadius * ratio, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
};

export const renderShapeFont: (shapeFontRenderer: ShapeFontRenderer) => void = (shapeFontRenderer) => {
    const { shapeFont, shapeFontAtlas, ctx, canvasWidth, canvasHeight } = shapeFontRenderer;
    const { rowNum, colNum, charNum, cellWidth, cellHeight, ratio } = shapeFontAtlas;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    for (let y = 0; y < rowNum; y++) {
        for (let x = 0; x < colNum; x++) {
            const charIndex = y * colNum + x;
            if (charIndex >= charNum) {
                break;
            }
            const cellX = x * cellWidth;
            const cellY = y * cellHeight;
            const charInfo = shapeFont.charInfo[charIndex];
            ctx.save();
            renderChar(ctx, shapeFont, charInfo, cellX, cellY, ratio);
            ctx.restore();
        }
    }
};
