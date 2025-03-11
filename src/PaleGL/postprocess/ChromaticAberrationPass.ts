// import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
// import { GPU } from '@/PaleGL/core/GPU.ts';
// import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
// import {
//     PostProcessPassBase
// } from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBase';
// import { Override } from '@/PaleGL/palegl';
// import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// 
// const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uScale';
// const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;
// 
// const UNIFORM_NAME_CHROMATIC_ABERRATION_POWER = 'uPower';
// const UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER = 1;
// 
// export type ChromaticAberrationPassParametersBase = {
//     scale: number;
//     power: number;
//     blendRate: number;
// };
// export type ChromaticAberrationPassParameters = PostProcessPassParametersBase & ChromaticAberrationPassParametersBase;
// 
// export type ChromaticAberrationPassParametersArgs = Partial<ChromaticAberrationPassParameters>;
// 
// export function generateChromaticAberrationPassParameters(
//     params: ChromaticAberrationPassParametersArgs = {}
// ): ChromaticAberrationPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//         scale: params.scale ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
//         power: params.power ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER,
//         blendRate: params.blendRate ?? 1,
//     };
// }
// 
// export class ChromaticAberrationPass extends PostProcessPassBase {
//     parameters: Override<PostProcessPassParametersBase, ChromaticAberrationPassParameters>;
// 
//     constructor(args: { gpu: GPU; parameters?: ChromaticAberrationPassParametersArgs }) {
//         const { gpu } = args;
// 
//         const parameters = generateChromaticAberrationPassParameters(args.parameters ?? {});
// 
//         const fragmentShader = chromaticAberrationFragment;
// 
//         super({
//             gpu,
//             type: PostProcessPassType.ChromaticAberration,
//             fragmentShader,
//             uniforms: [
//                 {
//                     name: UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
//                 },
//                 {
//                     name: UNIFORM_NAME_CHROMATIC_ABERRATION_POWER,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER,
//                 },
//             ],
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
//     }
// 
//     render(options: PostProcessPassRenderArgs) {
//         setMaterialUniformValue(this.material, UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE, this.parameters.scale);
//         setMaterialUniformValue(this.material, UNIFORM_NAME_CHROMATIC_ABERRATION_POWER, this.parameters.power);
// 
//         super.render(options);
//     }
// }


import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU.ts';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase, PostProcessSinglePass
} from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
import {
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase';
import { Override } from '@/PaleGL/palegl';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    renderPostProcessSinglePassBehaviour,
} from "@/PaleGL/postprocess/postProcessPassBehaviours.ts";

const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uScale';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;

const UNIFORM_NAME_CHROMATIC_ABERRATION_POWER = 'uPower';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER = 1;

export type ChromaticAberrationPassParametersBase = {
    scale: number;
    power: number;
    blendRate: number;
};
export type ChromaticAberrationPassParameters = PostProcessPassParametersBase & ChromaticAberrationPassParametersBase;

export type ChromaticAberrationPassParametersArgs = Partial<ChromaticAberrationPassParameters>;

export function generateChromaticAberrationPassParameters(
    params: ChromaticAberrationPassParametersArgs = {}
): ChromaticAberrationPassParameters {
    return {
        enabled: params.enabled ?? true,
        scale: params.scale ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
        power: params.power ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER,
        blendRate: params.blendRate ?? 1,
    };
}

export type ChromaticAberrationPass = PostProcessSinglePass;

export function createChromaticAberrationPass(args: { gpu: GPU; parameters?: ChromaticAberrationPassParametersArgs }): ChromaticAberrationPass {
    const { gpu } = args;

    const parameters: Override<PostProcessPassParametersBase, ChromaticAberrationPassParameters> = generateChromaticAberrationPassParameters(args.parameters ?? {});

    const fragmentShader = chromaticAberrationFragment;

    return {
    ...createPostProcessSinglePass({
        gpu,
        type: PostProcessPassType.ChromaticAberration,
        fragmentShader,
        uniforms: [
            {
                name: UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
            },
            {
                name: UNIFORM_NAME_CHROMATIC_ABERRATION_POWER,
                type: UniformTypes.Float,
                value: UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER,
            },
        ],
        parameters,
    })
    }
}

// export function setChromaticAberrationPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
//     const pass = postProcessPass as PostProcessSinglePass;
//     setPostProcessSinglePassSizeBehaviour(pass, width, height);
//     setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
// }

export function renderChromaticAberrationPass (postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const chromaticAberrationPass = postProcessPass as ChromaticAberrationPass;
    const parameters = chromaticAberrationPass.parameters as ChromaticAberrationPassParameters;
    setMaterialUniformValue(chromaticAberrationPass.material, UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE, parameters.scale);
    setMaterialUniformValue(chromaticAberrationPass.material, UNIFORM_NAME_CHROMATIC_ABERRATION_POWER, parameters.power);
    renderPostProcessSinglePassBehaviour(chromaticAberrationPass, options)
}
