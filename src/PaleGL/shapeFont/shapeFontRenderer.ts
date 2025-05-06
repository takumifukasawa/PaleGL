import { buildShapeFontAtlas, ShapeFontAtlas } from '@/PaleGL/shapeFont/buildShaderFontAtlas.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';

export type ShapeFontRenderer<T, U extends ShapeFontBase<T>> = {
    shapeFont: U;
    renderFunc: ShapeFontRenderFunc<T, U>;
    shapeFontAtlas: ShapeFontAtlas;
    canvasWidth: number;
    canvasHeight: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
};

export type ShapeFontRenderFunc<T, U extends ShapeFontBase<T>> = (renderer: ShapeFontRenderer<T, U>) => void;

export const createShapeFontRenderer: <T, U extends ShapeFontBase<T>>(
    shapeFontService: ShapeFontService<T, U>,
    srcCanvas: HTMLCanvasElement | null,
    canvasWidth: number,
    canvasHeight: number
) => ShapeFontRenderer<T, U> = (
    // prettier-ignore
    shapeFontService,
    srcCanvas = null,
    canvasWidth,
    canvasHeight
) => {
    const canvas = srcCanvas || document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const [shapeFont, renderFunc] = shapeFontService;

    const shapeFontAtlas = buildShapeFontAtlas(shapeFont, canvasWidth, canvasHeight);

    return { shapeFont, renderFunc, shapeFontAtlas, canvasWidth, canvasHeight, canvas, ctx };
};
