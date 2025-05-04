// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import { Texture } from '@/PaleGL/core/texture.ts';
// import { Color/*, createColorWhite*/ } from '@/PaleGL/math/color.ts';
import { Actor, addChildActor, /* addChildActor,*/ createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeFont } from '@/PaleGL/shapFont/shapeFont.ts';
import { createShapeFontRenderer, ShapeFontRenderer } from '@/PaleGL/shapFont/shapeFontRenderer.ts';
import { renderShapeFont } from '@/PaleGL/shapFont/renderShapeFont.ts';
import { createTexture, updateTexture } from '@/PaleGL/core/texture.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
// import { createMesh } from '@/PaleGL/actors/meshes/mesh.ts';
// import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
// import { createUnlitMaterial } from '@/PaleGL/materials/unlitMaterial.ts';
// import { renderRenderer } from '@/PaleGL/core/renderer.ts';
// import { setScaling } from '@/PaleGL/core/transform.ts';
// import { createVector3 } from '@/PaleGL/math/vector3.ts';
import { createShapeCharMesh } from '@/PaleGL/actors/meshes/shapeCharMesh.ts';
// import { CharMesh, createCharMesh } from '@/PaleGL/actors/meshes/charMesh.ts';
// import { setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
// import {ShapeCharMesh} from "@/PaleGL/actors/meshes/shapeCharMesh.ts";

// export type FontAtlasData = {
//     chars: {
//         char: string;
//         width: number;
//         height: number;
//         xoffset: number;
//         yoffset: number;
//         x: number;
//         y: number;
//     }[];
//     common: {
//         lineHeight: number;
//         base: number;
//         scaleW: number;
//         scaleH: number;
//     };
// };

// shorten
// export type FontAtlasData = {
//     cs: {
//         c: string;
//         w: number;
//         h: number;
//         xo: number;
//         yo: number;
//         x: number;
//         y: number;
//     }[];
//     common: {
//         lh: number;
//         b: number;
//         sw: number;
//         sh: number;
//     };
// };

type ShapeTextMeshArgs = {
    gpu: Gpu;
    name?: string;
    text: string;
    shapeFont: ShapeFont;
    // color?: Color;
    // // fontAtlas: FontAtlasData;
    // // fontTexture: Texture;
    // characterSpacing?: number;
    // castShadow?: boolean;
};

export type ShapeTextMesh = Actor & {
    // charMeshes: ShapeCharMesh[];
    shapeFontRenderer: ShapeFontRenderer;
};

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export function createShapeTextMesh({
    gpu,
    name,
    text,
    shapeFont,
    // color = createColorWhite(),
    // fontTexture,
    // fontAtlas,
    // align = TextAlignType.Left,
    // characterSpacing = 0,
    // castShadow,
}: ShapeTextMeshArgs): ShapeTextMesh {
    // const charMeshes: CharMesh[] = [];

    const actor = createActor({ name: name || `shape-text-${text}` });

    const width = 4096;
    const height = 1024;

    const shapeFontRenderer = createShapeFontRenderer(null, shapeFont, width, height);

    // renderShapeFont(shapeFontRenderer);
    renderShapeFont(shapeFontRenderer);

    const fontTexture = createTexture({
        gpu,
        img: shapeFontRenderer.canvas,
        width,
        height,
    });

    renderShapeFont(shapeFontRenderer);

    updateTexture(fontTexture, { img: shapeFontRenderer.canvas });

    // const mesh = createMesh({
    //     name: `shape-text-mesh-${text}`,
    //     geometry: createPlaneGeometry({
    //         gpu,
    //     }),
    //     material: createUnlitMaterial({
    //         baseMap: fontTexture,
    //     }),
    //     castShadow: true,
    // });

    // setScaling(mesh.transform, createVector3(4, 1, 1));
    // addChildActor(actor, mesh);

    const char = 'A';

    const shapeCharMesh = createShapeCharMesh({
        gpu,
        name: `shape-char-${char}`,
        fontTexture,
        shapeFontRenderer,
        x: 0,
        y: 0
        // color,
        // atlasInfo: {
        //     width: fontAtlas.common.scaleW,
        //     height: fontAtlas.common.scaleH,
        //     lh: fontAtlas.common.lineHeight,
        //     b: fontAtlas.common.base,
        // },
        // charInfo: {
        //     char,
        //     x: charInfo.x,
        //     y: charInfo.y,
        //     width: charInfo.width,
        //     height: charInfo.height,
        //     xOffset: charInfo.xoffset + additionalOffsetX,
        //     yOffset: charInfo.yoffset,
        // },
        // castShadow,
    });

    // setScaling(shapeCharMesh.transform, createVector3(4, 1, 1));
    addChildActor(actor, shapeCharMesh);

    const img = document.createElement('img');
    img.src = shapeFontRenderer.canvas.toDataURL();
    document.body.appendChild(img);

    return { ...actor, shapeFontRenderer };

    // const textMesh: TextMesh = {
    //     ...actor,
    //     charMeshes: [],
    // };

    // const charArray = text.split('');

    // let originX = 0;
    // let accWidth = 0;
    // // let accHeight = 0;

    // for (let i = 0; i < charArray.length; i++) {
    //     const char = charArray[i];
    //     const charInfo = fontAtlas.chars.find((charData) => charData.char === char);
    //     if (!charInfo) {
    //         continue;
    //     }

    //     // TODO: 任意のスペースのサイズを指定したい
    //     const additionalOffsetX = i > 0 && charArray[i - 1] === ' ' ? fontAtlas.common.base * 0.5 : 0;

    //     const mesh = createCharMesh({
    //         gpu,
    //         name: `char-${char}`,
    //         fontTexture: fontTexture,
    //         color,
    //         atlasInfo: {
    //             width: fontAtlas.common.scaleW,
    //             height: fontAtlas.common.scaleH,
    //             lh: fontAtlas.common.lineHeight,
    //             b: fontAtlas.common.base,
    //         },
    //         charInfo: {
    //             char,
    //             x: charInfo.x,
    //             y: charInfo.y,
    //             width: charInfo.width,
    //             height: charInfo.height,
    //             xOffset: charInfo.xoffset + additionalOffsetX,
    //             yOffset: charInfo.yoffset,
    //         },
    //         castShadow,
    //     });
    //     addChildActor(textMesh, mesh);
    //     textMesh.charMeshes.push(mesh);

    //     accWidth += mesh.charWidth + mesh.charOffsetX;
    //     // accHeight += mesh.charHeight;
    // }

    // for (let i = 0; i < textMesh.charMeshes.length; i++) {
    //     const mesh = textMesh.charMeshes[i];
    //     originX += mesh.charWidth / 2 + mesh.charOffsetX;
    //     setV3x(mesh.transform.position, originX);
    //     setV3y(mesh.transform.position, mesh.charOffsetY);
    //     originX += mesh.charWidth / 2 + characterSpacing;
    //     // console.log("hogehoge",  mesh.name, mesh.parent)
    // }

    // return textMesh;
}
