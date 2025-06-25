import {
    ShapeFontRenderFunc
} from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';

export type ShapeFontService<T, U extends ShapeFontBase<T>> = [
    U, // shape font
    ShapeFontRenderFunc<T, U>, // render func
];
