import { Actor, addChildActor, createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    UnlitShapeCharMesh
} from '@/PaleGL/actors/meshes/unlitShapeCharMesh.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import {CreateShapeCharMeshFunc} from "@/PaleGL/actors/meshes/shapeCharMeshBase.ts";

type ShapeTextMeshBaseArgs<T, U extends ShapeFontBase<T>> = {
    gpu: Gpu;
    name?: string;
    text: string;
    color?: Color;
    shapeFontTexture: Texture;
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    align?: TextAlignType;
    characterSpacing?: number;
    createCharMeshFunc: CreateShapeCharMeshFunc<T, U>
};

export type ShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = Omit<ShapeTextMeshBaseArgs<T, U>, 'createCharMeshFunc'>;
    
export type ShapeTextMesh<T, U extends ShapeFontBase<T>> = Actor & {
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    shapeCharMeshes: UnlitShapeCharMesh[];
};

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export function createShapeTextMeshBase<T, U extends ShapeFontBase<T>>({
    gpu,
    name,
    text,
    color,
    shapeFontTexture,
    shapeFontRenderer,
    shapeFontService,
    align = TextAlignType.Left,
    characterSpacing = 0,
    createCharMeshFunc,
}: ShapeTextMeshBaseArgs<T, U>): ShapeTextMesh<T, U> {
    const actor = createActor({ name: name || `shape-text-${text}` });

    const [shapeFont] = shapeFontService;

    let originX = 0;

    const shapeCharMeshes: UnlitShapeCharMesh[] = [];
    
    const charArray = text.split('');
    let accWidth = 0;

    for (let i = 0; i < charArray.length; i++) {
        const char = charArray[i];
        const ci = shapeFont.charInfo.findIndex(([elem]) => char === elem);

        const colIndex = ci % shapeFont.colNum;
        const rowIndex = Math.floor(ci / shapeFont.colNum);

        const shapeCharMesh = createCharMeshFunc({
            gpu,
            name: `shape-char-${char}`,
            fontTexture: shapeFontTexture,
            char,
            shapeFontRenderer,
            color,
            x: colIndex,
            y: rowIndex,
        });

        shapeCharMeshes.push(shapeCharMesh);

        accWidth += shapeCharMesh.charWidth;

        addChildActor(actor, shapeCharMesh);
    }

    switch (align) {
        case TextAlignType.Center:
            originX -= accWidth / 2 + (characterSpacing * (charArray.length - 1)) / 2;
            break;
    }

    for (let i = 0; i < shapeCharMeshes.length; i++) {
        const mesh = shapeCharMeshes[i];
        originX += mesh.charWidth / 2;
        setV3x(mesh.transform.position, originX);
        const offsetY = -mesh.charHeight * .5;
        setV3y(mesh.transform.position, offsetY);
        originX += mesh.charWidth / 2 + characterSpacing;
        // console.log("hogehoge",  mesh.name, mesh.parent)
    }

    // // for debug
    // const img = document.createElement('img');
    // img.src = shapeFontRenderer.canvas.toDataURL();
    // document.body.appendChild(img);

    return { ...actor, shapeFontRenderer, shapeFontService, shapeCharMeshes };
}
