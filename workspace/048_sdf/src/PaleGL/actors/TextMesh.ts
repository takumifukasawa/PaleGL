import { GPU } from '@/PaleGL/core/GPU.ts';
import { ActorTypes, PrimitiveTypes, ShadingModelIds, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { Material } from '@/PaleGL/materials/Material.ts';
import unlitTextFrag from '@/PaleGL/shaders/unlit-text-fragment.glsl';
import unlitTextDepthFrag from '@/PaleGL/shaders/unlit-text-depth-fragment.glsl';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
// import fontAtlas from '@/PaleGL/fonts/NotoSans-Bold/atlas.png';
// import fontJson from '@/PaleGL/fonts/NotoSans-Bold/NotoSans-Bold.json';

type FontAtlasData = {
    pages: string[];
    chars: {
        char: string;
        width: number;
        height: number;
        x: number;
        y: number;
    }[];
    common: {
        scaleW: number;
        scaleH: number;
    };
};

type TextMeshArgs = {
    gpu: GPU;
    name?: string;
    text: string;
    fontAtlas: FontAtlasData;
    fontTexture: Texture;
    align?: TextAlignType;
    castShadow?: boolean;
};

export const TextAlignType = {
    Left: 0,
    Center: 1,
} as const;

export type TextAlignType = (typeof TextAlignType)[keyof typeof TextAlignType];

export class TextMesh extends Actor {
    align: TextAlignType = TextAlignType.Left;
    charMeshes: CharMesh[] = [];

    constructor({ gpu, name, text, fontTexture, fontAtlas, align = TextAlignType.Left, castShadow }: TextMeshArgs) {
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
            const mesh = new CharMesh({
                gpu,
                name: `char-${char}`,
                fontTexture: fontTexture,
                atlasInfo: {
                    width: fontAtlas.common.scaleW,
                    height: fontAtlas.common.scaleH,
                },
                charInfo: {
                    x: charInfo.x,
                    y: charInfo.y,
                    width: charInfo.width,
                    height: charInfo.height,
                },
                castShadow,
            });
            this.addChild(mesh);
            this.charMeshes.push(mesh);

            accWidth += mesh.charWidth;
            // accHeight += mesh.charHeight;
        }

        switch (align) {
            case TextAlignType.Center:
                originX -= accWidth / 2;
                break;
        }

        for (let i = 0; i < this.charMeshes.length; i++) {
            const mesh = this.charMeshes[i];
            originX += mesh.charWidth / 2;
            mesh.transform.position.x = originX;
            originX += mesh.charWidth / 2;
        }
    }
}

type CharMeshArgs = {
    gpu: GPU;
    name?: string;
    uniforms?: UniformsData;
    fontTexture: Texture;
    atlasInfo: {
        width: number;
        height: number;
    };
    charInfo: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
} & MeshOptionsArgs;

// TODO: なぜかcastshadowがきかない
class CharMesh extends Mesh {
    charWidth: number;
    charHeight: number;

    constructor({ gpu, name = '', fontTexture, atlasInfo, charInfo, uniforms = [] }: CharMeshArgs) {
        const w = atlasInfo.width;
        const h = atlasInfo.height;
        // test char 'R'
        const sw = charInfo.width / w;
        const sh = charInfo.height / h;
        const sx = charInfo.x / w;
        const sy = charInfo.y / h;
        const aspect = charInfo.width / charInfo.height;

        const mergedUniforms: UniformsData = [
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
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int,
                value: ShadingModelIds.Unlit,
            },
            {
                name: 'uColor',
                type: UniformTypes.Color,
                value: Color.white,
            },
            ...uniforms,
        ];

        const planeHeight = 2;
        const planeWidth = planeHeight * aspect;

        // NOTE: geometryは親から渡して使いまわしてもよい
        const geometry = new PlaneGeometry({
            gpu,
            flipUvY: true,
            width: planeWidth,
            height: planeHeight,
        });
        const material = new Material({
            vertexShader: gBufferVert,
            fragmentShader: unlitTextFrag,
            depthFragmentShader: unlitTextDepthFrag,
            uniforms: mergedUniforms,
            alphaTest: 0.5,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
        });

        super({ name, geometry, material, actorType: ActorTypes.Mesh });

        this.charWidth = planeWidth;
        this.charHeight = planeHeight;
    }
}
