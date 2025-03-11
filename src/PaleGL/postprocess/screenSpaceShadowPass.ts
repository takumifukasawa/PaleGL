// import { UniformNames, UniformTypes, UniformBlockNames, PostProcessPassType } from '@/PaleGL/constants';
// import { Gpu } from '@/PaleGL/core/Gpu.ts';
// import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
// import {
//     PostProcessPassBaseDEPRECATED
// } from '@/PaleGL/postprocess/postProcessPassBase.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED.ts';
// import { Vector3 } from '@/PaleGL/math/vector3.ts';
// import { Override } from '@/PaleGL/palegl';
// import {setMaterialUniformValue} from "@/PaleGL/materials/material.ts";
//
// export type ScreenSpaceShadowPassParametersBase = {
//     bias: number;
//     jitterSize: Vector3;
//     sharpness: number;
//     strength: number;
//     ratio: number;
//     rayStepMultiplier: number;
// };
//
// export type ScreenSpaceShadowPassParameters = PostProcessPassParametersBase & ScreenSpaceShadowPassParametersBase;
//
// export type ScreenSpaceShadowPassArgs = Partial<ScreenSpaceShadowPassParameters>;
//
// const UNIFORM_BIAS_NAME = 'uBias';
// const UNIFORM_JITTER_SIZE_NAME = 'uJitterSize';
// const UNIFORM_SHARPNESS_NAME = 'uSharpness';
// const UNIFORM_STRENGTH_NAME = 'uStrength';
// const UNIFORM_RAY_STEP_MULTIPLIER_NAME = 'uRayStepMultiplier';
//
// export function generateScreenSpaceShadowPassParameters(
//     params: ScreenSpaceShadowPassArgs = {}
// ): ScreenSpaceShadowPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//         bias: params.bias ?? 0,
//         jitterSize: params.jitterSize ?? new Vector3(0.025, 0.025, 0.025),
//         sharpness: params.sharpness ?? 2,
//         strength: params.strength ?? 1,
//         ratio: params.ratio ?? 0.5,
//         rayStepMultiplier: params.rayStepMultiplier ?? 1,
//     };
// }
//
// export class ScreenSpaceShadowPass extends PostProcessPassBaseDEPRECATED {
//     // bias: number = 0;
//     // // jitterSize: Vector3 = new Vector3(0.2, 0.2, 0.2);
//     // jitterSize: Vector3 = new Vector3(0.025, 0.025, 0.025);
//     // // sharpness: number = 0.3;
//     // sharpness: number = 2;
//     // strength: number = 1;
//
//     // ratio: number = 0.5;
//
//     parameters: Override<PostProcessPassParametersBase, ScreenSpaceShadowPassParameters>;
//
//     /**
//      *
//      * @param args
//      */
//     constructor(args: { gpu: Gpu; parameters?: ScreenSpaceShadowPassParameters }) {
//         const { gpu } = args;
//         const fragmentShader = screenSpaceShadowFragmentShader;
//         // { gpu, ratio, parameters }
//         const parameters = generateScreenSpaceShadowPassParameters(args.parameters ?? {});
//
//         super({
//             gpu,
//             type: PostProcessPassType.ScreenSpaceShadow,
//             parameters,
//             fragmentShader,
//             uniforms: [
//                 {
//                     name: UniformNames.GBufferBTexture,
//                     type: UniformTypes.Texture,
//                     value: null,
//                 },
//                 {
//                     name: UniformNames.DepthTexture,
//                     type: UniformTypes.Texture,
//                     value: null,
//                 },
//                 {
//                     name: UNIFORM_BIAS_NAME,
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//                 {
//                     name: UNIFORM_JITTER_SIZE_NAME,
//                     type: UniformTypes.Vector3,
//                     value: Vector3.zero,
//                 },
//                 {
//                     name: UNIFORM_SHARPNESS_NAME,
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//                 {
//                     name: UNIFORM_STRENGTH_NAME,
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//                 {
//                     name: UNIFORM_RAY_STEP_MULTIPLIER_NAME,
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//             ],
//             uniformBlockNames: [
//                 UniformBlockNames.Common,
//                 UniformBlockNames.Transformations,
//                 UniformBlockNames.Camera,
//                 UniformBlockNames.PointLight,
//             ],
//             // renderTargetType: RenderTargetTypes.R16F,
//         });
//
//         // if (args.ratio) {
//         //     this.ratio = ratio;
//         // }
//
//         this.parameters = parameters;
//     }
//
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         super.setSize(width * this.parameters.ratio, height * this.parameters.ratio);
//         // this.material.uniforms.setValue(UniformNames.TargetWidth, width);
//         // this.material.uniforms.setValue(UniformNames.TargetHeight, height);
//     }
//
//     /**
//      *
//      * @param options
//      */
//     render(options: PostProcessPassRenderArgs) {
//         setMaterialUniformValue(this.material, UNIFORM_BIAS_NAME, this.parameters.bias);
//         setMaterialUniformValue(this.material, UNIFORM_JITTER_SIZE_NAME, this.parameters.jitterSize);
//         setMaterialUniformValue(this.material, UNIFORM_SHARPNESS_NAME, this.parameters.sharpness);
//         setMaterialUniformValue(this.material, UNIFORM_STRENGTH_NAME, this.parameters.strength);
//         setMaterialUniformValue(this.material, UNIFORM_RAY_STEP_MULTIPLIER_NAME, this.parameters.rayStepMultiplier);
//         super.render(options);
//     }
// }

import { UniformNames, UniformTypes, UniformBlockNames, PostProcessPassType } from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {createVector3, createVector3Zero, Vector3} from '@/PaleGL/math/vector3.ts';
import { Override } from '@/PaleGL/palegl';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    renderPostProcessSinglePassBehaviour,
    setPostProcessSinglePassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

export type ScreenSpaceShadowPassParametersBase = {
    bias: number;
    jitterSize: Vector3;
    sharpness: number;
    strength: number;
    ratio: number;
    rayStepMultiplier: number;
};

export type ScreenSpaceShadowPassParameters = PostProcessPassParametersBase & ScreenSpaceShadowPassParametersBase;

export type ScreenSpaceShadowPassArgs = Partial<ScreenSpaceShadowPassParameters>;

const UNIFORM_BIAS_NAME = 'uBias';
const UNIFORM_JITTER_SIZE_NAME = 'uJitterSize';
const UNIFORM_SHARPNESS_NAME = 'uSharpness';
const UNIFORM_STRENGTH_NAME = 'uStrength';
const UNIFORM_RAY_STEP_MULTIPLIER_NAME = 'uRayStepMultiplier';

export function generateScreenSpaceShadowPassParameters(
    params: ScreenSpaceShadowPassArgs = {}
): ScreenSpaceShadowPassParameters {
    return {
        enabled: params.enabled ?? true,
        bias: params.bias ?? 0,
        jitterSize: params.jitterSize ?? createVector3(0.025, 0.025, 0.025),
        sharpness: params.sharpness ?? 2,
        strength: params.strength ?? 1,
        ratio: params.ratio ?? 0.5,
        rayStepMultiplier: params.rayStepMultiplier ?? 1,
    };
}

export type ScreenSpaceShadowPass = PostProcessSinglePass;

export function createScreenSpaceShadowPass(args: { gpu: Gpu; parameters?: ScreenSpaceShadowPassParameters }) {
    const { gpu } = args;

    const fragmentShader = screenSpaceShadowFragmentShader;

    const parameters: Override<PostProcessPassParametersBase, ScreenSpaceShadowPassParameters> =
        generateScreenSpaceShadowPassParameters(args.parameters ?? {});

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.ScreenSpaceShadow,
            parameters,
            fragmentShader,
            uniforms: [
                {
                    name: UniformNames.GBufferBTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_BIAS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_JITTER_SIZE_NAME,
                    type: UniformTypes.Vector3,
                    value: createVector3Zero(),
                },
                {
                    name: UNIFORM_SHARPNESS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_STRENGTH_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_RAY_STEP_MULTIPLIER_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                UniformBlockNames.PointLight,
            ],
            // renderTargetType: RenderTargetTypes.R16F,
        }),
    };
}

export function setScreenSpaceShadowPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const screenSpaceShadowPass = postProcessPass as ScreenSpaceShadowPass;
    const parameters = screenSpaceShadowPass.parameters as ScreenSpaceShadowPassParameters;
    setPostProcessSinglePassSizeBehaviour(screenSpaceShadowPass, width * parameters.ratio, height * parameters.ratio);
}

export function renderScreenShadowPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const screenSpaceShadowPass = postProcessPass as ScreenSpaceShadowPass;
    const parameters = screenSpaceShadowPass.parameters as ScreenSpaceShadowPassParameters;
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_BIAS_NAME, parameters.bias);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_JITTER_SIZE_NAME, parameters.jitterSize);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_SHARPNESS_NAME, parameters.sharpness);
    setMaterialUniformValue(screenSpaceShadowPass.material, UNIFORM_STRENGTH_NAME, parameters.strength);
    setMaterialUniformValue(
        screenSpaceShadowPass.material,
        UNIFORM_RAY_STEP_MULTIPLIER_NAME,
        parameters.rayStepMultiplier
    );
    renderPostProcessSinglePassBehaviour(screenSpaceShadowPass, options);
}
