import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';

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

export const buildShapeFontAtlas = <T>(
    shapeFont: ShapeFontBase<T>,
    textureWidth: number,
    textureHeight: number
): ShapeFontAtlas => {
    const { colNum } = shapeFont;
    const charNum = shapeFont.charInfo.length;
    const charset = shapeFont.charInfo.map(([key,,]) => key).join('');
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
