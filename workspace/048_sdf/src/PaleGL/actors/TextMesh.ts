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
import {Color} from "@/PaleGL/math/Color.ts";
// import fontAtlas from '@/PaleGL/fonts/NotoSans-Bold/atlas.png';
// import fontJson from '@/PaleGL/fonts/NotoSans-Bold/NotoSans-Bold.json';

type TextRaymarchMeshArgs = {
    gpu: GPU;
    name?: string;
    uniforms?: UniformsData;
    atlasTexture: Texture;
    atlasJson: unknown;
} & MeshOptionsArgs;

// TODO: なぜかcastshadowがきかない
export class TextMesh extends Mesh {
    constructor({ gpu, name = '', atlasTexture, atlasJson, uniforms = [] }: TextRaymarchMeshArgs) {
        const w = 256;
        const h = 128;
        // test char 'R'
        const sw = 16 / w;
        const sh = 19 / h;
        const sx = 86 / w;
        const sy = 20 / h;

        const mergedUniforms: UniformsData = [
            {
                name: UniformNames.FontMap,
                type: UniformTypes.Texture,
                value: atlasTexture,
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
                name: "uColor",
                type: UniformTypes.Color,
                value: Color.white,
            },
            ...uniforms,
        ];

        // NOTE: geometryは親から渡して使いまわしてもよい
        const geometry = new PlaneGeometry({ gpu, flipUvY: true });
        const material = new Material({
            vertexShader: gBufferVert,
            fragmentShader: unlitTextFrag,
            depthFragmentShader: unlitTextDepthFrag,
            uniforms: mergedUniforms,
            alphaTest: 0.5,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
        });

        console.log(atlasTexture, atlasJson);

        super({ name, geometry, material, actorType: ActorTypes.Mesh });
    }
}
