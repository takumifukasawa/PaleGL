import { GPU } from '@/PaleGL/core/GPU.ts';
import {
    ActorTypes,
    DepthFuncTypes,
    PrimitiveTypes,
    ShadingModelIds,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { Material } from '@/PaleGL/materials/Material.ts';
import unlitTextFrag from '@/PaleGL/shaders/unlit-text-fragment.glsl';
import unlitTextDepthFrag from '@/PaleGL/shaders/unlit-text-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';

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

/**
 * TODO: できれば文字のmeshはまとめて1つのgeometryにしたい
 */
export class TextMesh extends Actor {
    align: TextAlignType = TextAlignType.Left;
    charMeshes: CharMesh[] = [];

    constructor({
        gpu,
        name,
        text,
        color = Color.white,
        fontTexture,
        fontAtlas,
        align = TextAlignType.Left,
        characterSpacing = 0,
        castShadow,
    }: TextMeshArgs) {
        super({ name });
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

            const mesh = new CharMesh({
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
            this.addChild(mesh);
            this.charMeshes.push(mesh);

            accWidth += mesh.charWidth + mesh.charOffsetX;
            // accHeight += mesh.charHeight;
        }

        switch (align) {
            case TextAlignType.Center:
                originX -= accWidth / 2 + (characterSpacing * (charArray.length - 1)) / 2;
                break;
        }

        for (let i = 0; i < this.charMeshes.length; i++) {
            const mesh = this.charMeshes[i];
            originX += mesh.charWidth / 2 + mesh.charOffsetX;
            mesh.transform.getPosition().x = originX;
            mesh.transform.getPosition().y = mesh.charOffsetY;
            originX += mesh.charWidth / 2 + characterSpacing;
        }
    }
}

type CharMeshArgs = {
    gpu: GPU;
    name?: string;
    uniforms?: UniformsData;
    color: Color;
    fontTexture: Texture;
    atlasInfo: {
        width: number;
        height: number;
        lh: number;
        b: number;
    };
    charInfo: {
        char: string;
        x: number;
        y: number;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
    };
} & MeshOptionsArgs;

// TODO: なぜかcastshadowがきかない
class CharMesh extends Mesh {
    charWidth: number;
    charHeight: number;
    charOffsetX: number;
    charOffsetY: number;
    char: string;

    constructor({ gpu, name = '', color, fontTexture, atlasInfo, charInfo, castShadow, uniforms = [] }: CharMeshArgs) {
        const w = atlasInfo.width;
        const h = atlasInfo.height;
        const sw = charInfo.width / w;
        const sh = charInfo.height / h;
        const sx = charInfo.x / w;
        const sy = charInfo.y / h;

        const bUniforms: UniformsData = [
            {
                name: 'uColor',
                type: UniformTypes.Color,
                value: color,
            },
            {
                name: UniformNames.FontMap,
                type: UniformTypes.Texture,
                value: fontTexture,
            },
            {
                name: UniformNames.FontTiling,
                type: UniformTypes.Vector4,
                // value: Vector4.one
                value: new Vector4(sw, sh, sx, sy), // TODO: dummy
            },
        ];

        const mergedUniforms: UniformsData = [
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int,
                value: ShadingModelIds.Unlit,
            },
            ...bUniforms,
            ...uniforms,
        ];

        const depthUniforms: UniformsData = [...bUniforms, ...uniforms];

        const maxWidth = 2;
        const maxHeight = 2;
        const pixelSizeW = maxWidth / atlasInfo.lh;
        const pixelSizeH = maxHeight / atlasInfo.lh;
        const planeHeight = charInfo.height * pixelSizeH;
        const planeWidth = charInfo.width * pixelSizeW;
        const topPadding = (maxHeight - planeHeight) * 0.5;
        // 上下: 上に揃えてからoffsetYする. yOffsetは左上が原点なので反転
        const offsetY = topPadding - charInfo.yOffset * pixelSizeH;
        // 左右: widthの時点で幅調整がかかっているので、xOffsetのみでよい
        const offsetX = charInfo.xOffset * pixelSizeW;

        const geometry = createPlaneGeometry({
            gpu,
            flipUvY: true,
            width: planeWidth,
            height: planeHeight,
            // offset: new Vector3(offsetX, offsetY, 0),
        });
        const material = new Material({
            vertexShader: gBufferVert,
            fragmentShader: unlitTextFrag,
            depthFragmentShader: unlitTextDepthFrag,
            uniforms: mergedUniforms,
            depthUniforms,
            alphaTest: 0.5,
            depthTest: true,
            depthWrite: false,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
            depthFuncType: DepthFuncTypes.Equal,
        });

        super({ name, geometry, material, actorType: ActorTypes.Mesh, castShadow });

        this.charWidth = planeWidth;
        this.charHeight = planeHeight;
        this.charOffsetX = offsetX;
        this.charOffsetY = offsetY;
        this.char = charInfo.char;

        // for debug
        // console.log(this.char, planeWidth, planeHeight, offsetX, offsetY);
    }

    // start({ gpu }: {gpu: GPU}) {
    //     super.start({ gpu});
    //     console.log(this.depthMaterial)
    // }
}
