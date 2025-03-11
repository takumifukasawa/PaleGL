// import { PostProcessPassType, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
// import { GPU } from '@/PaleGL/core/GPU.ts';
// import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';
// import {
//     PostProcessPassBase
// } from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBase';
// import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
//
// export type GlitchPassParameters = PostProcessPassParametersBase & {
//     blendRate: number;
// };
//
// export type GlitchPassParametersArgs = Partial<GlitchPassParameters>;
//
// export function generateGlitchPassParameters(params: GlitchPassParametersArgs = {}): GlitchPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//         blendRate: params.blendRate ?? 0,
//     };
// }
//
// const UNIFORM_NAME_BLEND_RATE = UniformNames.BlendRate;
//
// export class GlitchPass extends PostProcessPassBase {
//     parameters: GlitchPassParameters;
//
//     constructor(args: { gpu: GPU; parameters?: GlitchPassParametersArgs }) {
//         const { gpu } = args;
//
//         const parameters = generateGlitchPassParameters(args.parameters ?? {});
//
//         const fragmentShader = glitchFragment;
//
//         super({
//             gpu,
//             type: PostProcessPassType.Glitch,
//             fragmentShader,
//             uniforms: [
//                 {
//                     name: UNIFORM_NAME_BLEND_RATE,
//                     type: UniformTypes.Float,
//                     value: parameters.blendRate,
//                 },
//                 {
//                     name: UniformNames.Aspect,
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//             ],
//             uniformBlockNames: [UniformBlockNames.Common],
//             parameters,
//         });
//
//         this.parameters = parameters;
//     }
//
//     setSize(width: number, height: number) {
//         super.setSize(width, height);
//         setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//         setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
//         setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
//     }
//
//     render(options: PostProcessPassRenderArgs) {
//         setMaterialUniformValue(this.material, UNIFORM_NAME_BLEND_RATE, this.parameters.blendRate);
//
//         super.render(options);
//     }
// }

import { PostProcessPassType, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU.ts';
import glitchFragment from '@/PaleGL/shaders/glitch-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassBase
} from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
import { PostProcessPassParametersBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessPass} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

export type GlitchPassParameters = PostProcessPassParametersBase & {
    blendRate: number;
};

export type GlitchPassParametersArgs = Partial<GlitchPassParameters>;

export function generateGlitchPassParameters(params: GlitchPassParametersArgs = {}): GlitchPassParameters {
    return {
        enabled: params.enabled ?? true,
        blendRate: params.blendRate ?? 0,
    };
}

const UNIFORM_NAME_BLEND_RATE = UniformNames.BlendRate;

export type GlitchPass = PostProcessSinglePass;

export function createGlitchPass(args: { gpu: GPU; parameters?: GlitchPassParametersArgs }): GlitchPass {
    const { gpu } = args;
    const parameters = generateGlitchPassParameters(args.parameters ?? {});

    const fragmentShader = glitchFragment;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.Glitch,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UniformTypes.Float,
                    value: parameters.blendRate,
                },
                {
                    name: UniformNames.Aspect,
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Common],
            parameters,
        }),
    };
}

// export function setGlitchPassSize(glitchPass: GlitchPass, width: number, height: number) {
//     setPostProcessPassSize(glitchPass, width, height);
//     setMaterialUniformValue(glitchPass.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(glitchPass.material, UniformNames.TargetHeight, height);
//     setMaterialUniformValue(glitchPass.material, UniformNames.Aspect, width / height);
// }

export function renderGlitchPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const glitchPass = postProcessPass as GlitchPass;
    const parameters = glitchPass.parameters as GlitchPassParameters;
    setMaterialUniformValue(glitchPass.material, UNIFORM_NAME_BLEND_RATE, parameters.blendRate);
    renderPostProcessPass(glitchPass, options);
}
