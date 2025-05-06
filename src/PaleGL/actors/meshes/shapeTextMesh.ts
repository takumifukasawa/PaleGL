import { Actor, addChildActor, createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { createTexture, Texture, updateTexture } from '@/PaleGL/core/texture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createShapeCharMesh } from '@/PaleGL/actors/meshes/shapeCharMesh.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { Color } from '@/PaleGL/math/color.ts';

type ShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = {
    gpu: Gpu;
    name?: string;
    text: string;
    color?: Color;
    shapeFontTexture: Texture;
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
};

export type ShapeTextMesh<T, U extends ShapeFontBase<T>> = Actor & {
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
};

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export function createShapeTextMesh<T, U extends ShapeFontBase<T>>({
    gpu,
    name,
    text,
    color,
    shapeFontTexture,
    shapeFontRenderer,
    shapeFontService,
}: ShapeTextMeshArgs<T, U>): ShapeTextMesh<T, U> {
    const actor = createActor({ name: name || `shape-text-${text}` });

    const [shapeFont, renderFunc] = shapeFontService;

    renderFunc(shapeFontRenderer);

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const ci = shapeFont.charInfo.findIndex(([elem]) => char === elem);

        const colIndex = ci % shapeFont.colNum;
        const rowIndex = Math.floor(ci / shapeFont.colNum);
        
        const shapeCharMesh = createShapeCharMesh({
            gpu,
            name: `shape-char-${char}`,
            fontTexture: shapeFontTexture,
            shapeFontRenderer,
            color,
            x: colIndex,
            y: rowIndex,
        });

        addChildActor(actor, shapeCharMesh);
    }

    // // for debug
    // const img = document.createElement('img');
    // img.src = shapeFontRenderer.canvas.toDataURL();
    // document.body.appendChild(img);

    return { ...actor, shapeFontRenderer, shapeFontService };
}
