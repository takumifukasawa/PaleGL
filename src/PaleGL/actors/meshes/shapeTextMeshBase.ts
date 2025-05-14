import { Actor, addChildActor, createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeFontRenderer } from '@/PaleGL/shapeFont/shapeFontRenderer.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { UnlitShapeCharMesh } from '@/PaleGL/actors/meshes/unlitShapeCharMesh.ts';
import { ShapeFontService } from '@/PaleGL/shapeFont/shapeFontService.ts';
import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { CreateShapeCharMeshFunc } from '@/PaleGL/actors/meshes/shapeCharMeshBase.ts';
import {MeshType, UIQueueType, UIQueueTypes} from '@/PaleGL/constants.ts';
import {createUIActor, UIActor} from "@/PaleGL/actors/meshes/UIActor.ts";

type ShapeTextMeshBaseArgs<T, U extends ShapeFontBase<T>> = {
    gpu: Gpu;
    name?: string;
    text: string;
    color?: Color;
    shapeFontTexture: Texture;
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    createCharMeshFunc: CreateShapeCharMeshFunc<T, U>;
    uiQueueType?: UIQueueType;
    meshType: MeshType;
    planeWidth: number;
};

export type ShapeTextMeshArgs<T, U extends ShapeFontBase<T>> = Omit<
    ShapeTextMeshBaseArgs<T, U>,
    'createCharMeshFunc' | 'uiQueueType' | 'meshType'
    // 'createCharMeshFunc' | 'meshType'
> & {
    align?: TextAlignType;
    characterSpacing?: number;
};

export type ShapeTextMesh<T, U extends ShapeFontBase<T>> = UIActor & {
    container: Actor;
    shapeFontService: ShapeFontService<T, U>;
    shapeFontRenderer: ShapeFontRenderer<T, U>;
    shapeCharMeshes: UnlitShapeCharMesh[];
    uiQueueType: UIQueueType;
};

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export function createShapeTextMeshBase<T, U extends ShapeFontBase<T>>(args: ShapeTextMeshBaseArgs<T, U>): ShapeTextMesh<T, U> {
    const {
        gpu,
        name,
        text,
        color,
        shapeFontTexture,
        shapeFontRenderer,
        shapeFontService,
        createCharMeshFunc,
        uiQueueType = UIQueueTypes.None,
        meshType,
        planeWidth
    } = args;
    
    // const actor = createActor({ name: name || `shape-text-${text}` });
    const actor = createUIActor({ name: name || `shape-text-${text}` })
    
    const container = createActor();
    
    addChildActor(actor, container);

    const [shapeFont] = shapeFontService;

    const shapeCharMeshes: UnlitShapeCharMesh[] = [];

    const charArray = text.split('');

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
            meshType,
            planeWidth
        });

        shapeCharMeshes.push(shapeCharMesh);

        addChildActor(container, shapeCharMesh);
    }

    return { ...actor, container, shapeFontRenderer, shapeFontService, shapeCharMeshes, uiQueueType };
}
