import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, ShadingModelIds, UniformNames, UniformTypes } from '@/PaleGL/constants';
import postprocessVert from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
// import postprocessVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ScreenSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
} & MaterialArgs & {
        fragmentShader: string;
        depthFragmentShader: string;
    };

export class ScreenSpaceRaymarchMaterial extends Material {
    constructor({
        // TODO: 外部化
        fragmentShader,
        depthFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        ...options
    }: ScreenSpaceRaymarchMaterialArgs) {
        const commonUniforms: UniformsData = [
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: 0
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: 0,
            }
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
            depthUniforms: commonUniforms,
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
        });
    }
}
