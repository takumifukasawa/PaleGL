import { MaterialArgs, Material } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, ShadingModelIds, UniformNames, UniformTypes, VertexShaderModifier } from '@/PaleGL/constants';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { GPU } from '@/PaleGL/core/GPU';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import litObjectSpaceRaymarchFrag from '@/PaleGL/shaders/lit-object-space-raymarch-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ObjectSpaceRaymarchMaterialArgs = {
    vertexShaderModifier?: VertexShaderModifier;
    uniforms?: UniformsData;
    shadingModelId?: ShadingModelIds;
} & MaterialArgs;

export class ObjectSpaceRaymarchMaterial extends Material {
    constructor({
        // TODO: 外部化
        vertexShaderModifier = {},
        shadingModelId = ShadingModelIds.Lit,
        uniforms = [],
        ...options
    }: ObjectSpaceRaymarchMaterialArgs = {}) {
        const baseUniforms: UniformsData = [
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int, // float,intどちらでもいい
                value: shadingModelId,
            },
        ];

        const mergedUniforms: UniformsData = [...baseUniforms, ...(uniforms ? uniforms : [])];

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: 'ObjectSpaceRaymarchMaterial',
            vertexShaderModifier,
            uniforms: mergedUniforms,
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

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }) {
        this.vertexShader = raymarchVert;
        this.fragmentShader = litObjectSpaceRaymarchFrag;
        super.start({ gpu, attributeDescriptors });
    }
}
