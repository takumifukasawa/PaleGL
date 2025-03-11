// import {PostProcessPassType, UniformNames, UniformTypes} from '@/PaleGL/constants';
// import { GPU } from '@/PaleGL/core/GPU.ts';
// import vignetteFragment from '@/PaleGL/shaders/vignette-fragment.glsl';
// import {
//     PostProcessPassBase
// } from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBase';
// import { Override } from '@/PaleGL/palegl';
// import {setMaterialUniformValue} from "@/PaleGL/materials/material.ts";
//
// // ref:
//
// const UNIFORM_NAME_VIGNETTE_RADIUS_FROM = 'uVignetteRadiusFrom';
// const UNIFORM_NAME_VIGNETTE_RADIUS_TO = 'uVignetteRadiusTo';
// const UNIFORM_VALUE_VIGNETTE_RADIUS_FROM = 1.77;
// const UNIFORM_VALUE_VIGNETTE_RADIUS_TO = 4.484;
// const UNIFORM_NAME_VIGNETTE_POWER = 'uVignettePower';
// const UNIFORM_VALUE_VIGNETTE_POWER = 1.345;
// const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
// const UNIFORM_VALUE_BLEND_RATE = 0.73;
//
// export type VignettePassParametersBase = {
//     vignetteRadiusFrom: number;
//     vignetteRadiusTo: number;
//     vignettePower: number;
//     blendRate: number;
// };
//
// export type VignettePassParameters = PostProcessPassParametersBase & VignettePassParametersBase;
//
// export type VignettePassParametersArgs = Partial<VignettePassParameters>;
//
// export function generateVignetteParameters(params: VignettePassParametersArgs = {}): VignettePassParameters {
//     return {
//         enabled: params.enabled ?? true,
//         vignetteRadiusFrom: params.vignetteRadiusFrom ?? UNIFORM_VALUE_VIGNETTE_RADIUS_FROM,
//         vignetteRadiusTo: params.vignetteRadiusTo ?? UNIFORM_VALUE_VIGNETTE_RADIUS_TO,
//         vignettePower: params.vignettePower ?? UNIFORM_VALUE_VIGNETTE_POWER,
//         blendRate: params.blendRate ?? UNIFORM_VALUE_BLEND_RATE,
//     };
// }
//
// export class VignettePass extends PostProcessPassBase {
//     // vignetteRadius: number;
//     // vignettePower: number;
//     // blendRate: number;
//     parameters: Override<PostProcessPassParametersBase, VignettePassParameters>;
//
//     constructor(args: { gpu: GPU; parameters?: VignettePassParametersArgs }) {
//         const { gpu } = args;
//         const fragmentShader = vignetteFragment;
//
//         const parameters = generateVignetteParameters(args.parameters ?? {});
//
//         super({
//             gpu,
//             type: PostProcessPassType.Vignette,
//             fragmentShader,
//             uniforms: [
//                 {
//                     name: UNIFORM_NAME_VIGNETTE_RADIUS_FROM,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_VIGNETTE_RADIUS_FROM,
//                 },
//                 {
//                     name: UNIFORM_NAME_VIGNETTE_RADIUS_TO,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_VIGNETTE_RADIUS_TO,
//                 },
//                 {
//                     name: UNIFORM_NAME_VIGNETTE_POWER,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_VIGNETTE_POWER,
//                 },
//                 {
//                     name: UNIFORM_NAME_BLEND_RATE,
//                     type: UniformTypes.Float,
//                     value: UNIFORM_VALUE_BLEND_RATE,
//                 },
//                 {
//                     name: UniformNames.Aspect,
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//             ],
//             parameters,
//         });
//
//         this.parameters = parameters;
//
//         // this.vignetteRadius = UNIFORM_VALUE_VIGNETTE_RADIUS;
//         // this.vignettePower = UNIFORM_VALUE_VIGNETTE_POWER;
//         // this.blendRate = UNIFORM_VALUE_BLEND_RATE;
//     }
//
//     setSize(width: number, height: number) {
//         super.setSize(width, height);
//         setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
//     }
//
//     render(options: PostProcessPassRenderArgs) {
//         setMaterialUniformValue(this.material,UNIFORM_NAME_VIGNETTE_RADIUS_FROM, this.parameters.vignetteRadiusFrom);
//         setMaterialUniformValue(this.material,UNIFORM_NAME_VIGNETTE_RADIUS_TO, this.parameters.vignetteRadiusTo);
//         setMaterialUniformValue(this.material,UNIFORM_NAME_VIGNETTE_POWER, this.parameters.vignettePower);
//         setMaterialUniformValue(this.material,UNIFORM_NAME_BLEND_RATE, this.parameters.blendRate);
//
//         super.render(options);
//     }
// }

import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU.ts';
import vignetteFragment from '@/PaleGL/shaders/vignette-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
import { PostProcessPassParametersBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    renderPostProcessSinglePassBehaviour
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

// ref:

const UNIFORM_NAME_VIGNETTE_RADIUS_FROM = 'uVignetteRadiusFrom';
const UNIFORM_NAME_VIGNETTE_RADIUS_TO = 'uVignetteRadiusTo';
const UNIFORM_VALUE_VIGNETTE_RADIUS_FROM = 1.77;
const UNIFORM_VALUE_VIGNETTE_RADIUS_TO = 4.484;
const UNIFORM_NAME_VIGNETTE_POWER = 'uVignettePower';
const UNIFORM_VALUE_VIGNETTE_POWER = 1.345;
const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
const UNIFORM_VALUE_BLEND_RATE = 0.73;

export type VignettePassParametersBase = {
    vignetteRadiusFrom: number;
    vignetteRadiusTo: number;
    vignettePower: number;
    blendRate: number;
};

export type VignettePassParameters = PostProcessPassParametersBase & VignettePassParametersBase;

export type VignettePassParametersArgs = Partial<VignettePassParameters>;

export function generateVignetteParameters(params: VignettePassParametersArgs = {}): VignettePassParameters {
    return {
        enabled: params.enabled ?? true,
        vignetteRadiusFrom: params.vignetteRadiusFrom ?? UNIFORM_VALUE_VIGNETTE_RADIUS_FROM,
        vignetteRadiusTo: params.vignetteRadiusTo ?? UNIFORM_VALUE_VIGNETTE_RADIUS_TO,
        vignettePower: params.vignettePower ?? UNIFORM_VALUE_VIGNETTE_POWER,
        blendRate: params.blendRate ?? UNIFORM_VALUE_BLEND_RATE,
    };
}

export type VignettePass = PostProcessSinglePass;

export function createVignettePass(args: { gpu: GPU; parameters?: VignettePassParametersArgs }): VignettePass {
    // parameters: Override<PostProcessPassParametersBase, VignettePassParameters>;

    const { gpu } = args;
    const fragmentShader = vignetteFragment;

    const parameters = generateVignetteParameters(args.parameters ?? {});

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.Vignette,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_VIGNETTE_RADIUS_FROM,
                    type: UniformTypes.Float,
                    value: UNIFORM_VALUE_VIGNETTE_RADIUS_FROM,
                },
                {
                    name: UNIFORM_NAME_VIGNETTE_RADIUS_TO,
                    type: UniformTypes.Float,
                    value: UNIFORM_VALUE_VIGNETTE_RADIUS_TO,
                },
                {
                    name: UNIFORM_NAME_VIGNETTE_POWER,
                    type: UniformTypes.Float,
                    value: UNIFORM_VALUE_VIGNETTE_POWER,
                },
                {
                    name: UNIFORM_NAME_BLEND_RATE,
                    type: UniformTypes.Float,
                    value: UNIFORM_VALUE_BLEND_RATE,
                },
                {
                    name: UniformNames.Aspect,
                    type: UniformTypes.Float,
                    value: 1,
                },
            ],
            parameters,
        }),
    };
}

// setSize(width: number, height: number) {
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
// }

export function renderVignettePass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const vignettePass = postProcessPass as VignettePass;
    const parameters = vignettePass.parameters as VignettePassParameters;
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_FROM, parameters.vignetteRadiusFrom);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_TO, parameters.vignetteRadiusTo);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_POWER, parameters.vignettePower);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_BLEND_RATE, parameters.blendRate);

    renderPostProcessSinglePassBehaviour(postProcessPass, options);
}
