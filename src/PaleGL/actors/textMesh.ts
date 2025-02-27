import { GPU } from '@/PaleGL/core/GPU.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Actor, addChildActor, createActor } from '@/PaleGL/actors/actor.ts';
import { CharMesh, createCharMesh } from '@/PaleGL/actors/charMesh.ts';

export type FontAtlasData = {
    chars: {
        char: string;
        width: number;
        height: number;
        xoffset: number;
        yoffset: number;
        x: number;
        y: number;
    }[];
    common: {
        lineHeight: number;
        base: number;
        scaleW: number;
        scaleH: number;
    };
};

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

type TextMeshArgs = {
    gpu: GPU;
    name?: string;
    text: string;
    color?: Color;
    fontAtlas: FontAtlasData;
    fontTexture: Texture;
    align?: TextAlignType;
    characterSpacing?: number;
    castShadow?: boolean;
};

export const TextAlignType = {
    Left: 0,
    Center: 1,
} as const;

export type TextAlignType = (typeof TextAlignType)[keyof typeof TextAlignType];

export type TextMesh = Actor & {
    charMeshes: CharMesh[];
};

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export function createTextMesh({
    gpu,
    name,
    text,
    color = Color.white,
    fontTexture,
    fontAtlas,
    align = TextAlignType.Left,
    characterSpacing = 0,
    castShadow,
}: TextMeshArgs): TextMesh {
    // const charMeshes: CharMesh[] = [];

    const actor = createActor({ name: name || `text-${text}`});

    const textMesh: TextMesh = {
        ...actor,
        charMeshes: []
    };
    
    const charArray = text.split('');

    let originX = 0;
    let accWidth = 0;
    // let accHeight = 0;

    for (let i = 0; i < charArray.length; i++) {
        const char = charArray[i];
        const charInfo = fontAtlas.chars.find((charData) => charData.char === char);
        if (!charInfo) {
            continue;
        }

        // TODO: 任意のスペースのサイズを指定したい
        const additionalOffsetX = i > 0 && charArray[i - 1] === ' ' ? fontAtlas.common.base * 0.5 : 0;

        const mesh = createCharMesh({
            gpu,
            name: `char-${char}`,
            fontTexture: fontTexture,
            color,
            atlasInfo: {
                width: fontAtlas.common.scaleW,
                height: fontAtlas.common.scaleH,
                lh: fontAtlas.common.lineHeight,
                b: fontAtlas.common.base,
            },
            charInfo: {
                char,
                x: charInfo.x,
                y: charInfo.y,
                width: charInfo.width,
                height: charInfo.height,
                xOffset: charInfo.xoffset + additionalOffsetX,
                yOffset: charInfo.yoffset,
            },
            castShadow,
        });
        addChildActor(textMesh, mesh);
        textMesh.charMeshes.push(mesh);

        accWidth += mesh.charWidth + mesh.charOffsetX;
        // accHeight += mesh.charHeight;
    }

    switch (align) {
        case TextAlignType.Center:
            originX -= accWidth / 2 + (characterSpacing * (charArray.length - 1)) / 2;
            break;
    }

    for (let i = 0; i < textMesh.charMeshes.length; i++) {
        const mesh = textMesh.charMeshes[i];
        originX += mesh.charWidth / 2 + mesh.charOffsetX;
        mesh.transform.position.x = originX;
        mesh.transform.position.y = mesh.charOffsetY;
        originX += mesh.charWidth / 2 + characterSpacing;
        // console.log("hogehoge",  mesh.name, mesh.parent)
    }

    
    return textMesh;
}
