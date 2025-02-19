import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, ShadingModelIds, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import postprocessVert from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
// import postprocessVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Color } from '@/PaleGL/math/Color.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ScreenSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
    fragmentShader?: string;
    depthFragmentShader?: string;

    // TODO: GBufferから引っ張ってきたい
    diffuseColor?: Color;
    metallic?: number;
    roughness?: number;
    emissiveColor?: Color;
} & MaterialArgs;

export class ScreenSpaceRaymarchMaterial extends Material {
    constructor({
        // TODO: 外部化
        fragmentShader,
        depthFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        diffuseColor,
        emissiveColor,
        metallic,
        roughness,
        uniformBlockNames,
        ...options
    }: ScreenSpaceRaymarchMaterialArgs) {
        const commonUniforms: UniformsData = [
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.CameraFov,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraAspect,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.DiffuseColor,
                type: UniformTypes.Color,
                value: diffuseColor || Color.white,
            },
            {
                name: UniformNames.Metallic,
                type: UniformTypes.Float,
                value: metallic || 0,
            },
            {
                name: UniformNames.Roughness,
                type: UniformTypes.Float,
                value: roughness || 0,
            },
            {
                name: UniformNames.EmissiveColor,
                type: UniformTypes.Color,
                value: emissiveColor || Color.black,
            },
        ];
        const shadingUniforms: UniformsData = [
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int, // float,intどちらでもいい
                value: shadingModelId,
            },
        ];

        const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: 'ScreenSpaceRaymarchMaterial',
            vertexShader: postprocessVert,
            fragmentShader,
            depthFragmentShader,
            uniforms: mergedUniforms,
            // depthUniforms: commonUniforms,
            depthUniforms: mergedUniforms, // TODO: common, uniforms の2つで十分なはず。alpha test をしない限り
            // NOTE: GBufferMaterialの設定
            // useNormalMap: !!normalMap,
            // depthTest: true,
            // depthWrite: false,
            // depthFuncType: DepthFuncTypes.Equal,
            // NOTE: GBufferMaterialと違う点
            depthTest: true,
            depthWrite: true,
            depthFuncType: DepthFuncTypes.Lequal,
            skipDepthPrePass: true,
            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                ...(uniformBlockNames ? uniformBlockNames : []),
            ],
        });
    }
}
