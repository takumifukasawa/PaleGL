// import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import fxaaFragmentShader from '@/PaleGL/shaders/fxaa-fragment.glsl';
// import {
//     PostProcessPassBaseDEPRECATED, PostProcessSinglePass
// } from '@/PaleGL/postprocess/postProcessPassBase.ts';
// import {
//     PostProcessPassParametersBase
// } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED';
// import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// 
// // ref:
// // https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// // http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// // https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// // http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf
// 
// export type FXAAPassParameters = PostProcessPassParametersBase;
// 
// export type FXAAPassParametersArgs = Partial<FXAAPassParameters>;
// 
// export function generateFXAAPassParameters(params: FXAAPassParametersArgs = {}): FXAAPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//     };
// }
// 
// export class FxaaPass extends PostProcessPassBaseDEPRECATED {
//     constructor(args: { gpu: Gpu; parameters?: FXAAPassParametersArgs }) {
//         const { gpu } = args;
//         const fragmentShader = fxaaFragmentShader;
// 
//         const parameters = generateFXAAPassParameters(args.parameters ?? {});
// 
//         super({
//             gpu,
//             type: PostProcessPassType.FXAA,
//             parameters,
//             fragmentShader,
//             renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
//             uniforms: [
//                 // uTargetWidth: {
//                 //     type: UniformTypes.Float,
//                 //     value: 1,
//                 // },
//                 // uTargetHeight: {
//                 //     type: UniformTypes.Float,
//                 //     value: 1,
//                 // },
//                 // 1/32 = 0.03125 ... visible limit
//                 // 1/16 = 0.0625 ... high quality
//                 // 1/12 = 0.0833 ... upper limit
//                 {
//                     name: 'uContrastThreshold',
//                     type: UniformTypes.Float,
//                     value: 0.0625,
//                 },
//                 // 1/3 = 0.333 ... too little
//                 // 1/4 = 0.25 ... low quality
//                 // 1/8 = 0.125 ... high quality
//                 // 1/16 = 0.0625 ... overkill
//                 {
//                     name: 'uRelativeThreshold',
//                     type: UniformTypes.Float,
//                     value: 0.125,
//                 },
//                 {
//                     name: 'uSubpixelBlending',
//                     type: UniformTypes.Float,
//                     value: 0.75,
//                 },
//                 // ...PostProcessPassBaseDEPRECATED.commonUniforms,
//             ],
//         });
//         // this.gpu = gpu;
//     }
// 
//     setSize(width: number, height: number) {
//         super.setSize(width, height);
//         setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//         setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
//     }
// }


import {PostProcessPassType, RenderTargetTypes, UniformTypes} from '@/PaleGL/constants';
import {Gpu} from '@/PaleGL/core/gpu.ts';
import fxaaFragmentShader from '@/PaleGL/shaders/fxaa-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassParametersBase
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
// import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import {setPostProcessPassSize} from "@/PaleGL/postprocess/postProcessPassBehaviours.ts";

// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export type FXAAPassParameters = PostProcessPassParametersBase;

export type FXAAPassParametersArgs = Partial<FXAAPassParameters>;

export function generateFXAAPassParameters(params: FXAAPassParametersArgs = {}): FXAAPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export type FxaaPass = PostProcessSinglePass;

export function createFXAAPass(args: { gpu: Gpu; parameters?: FXAAPassParametersArgs }): FxaaPass {
    const {gpu} = args;
    const fragmentShader = fxaaFragmentShader;

    const parameters = generateFXAAPassParameters(args.parameters ?? {});

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: PostProcessPassType.FXAA,
            parameters,
            fragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                // uTargetWidth: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // uTargetHeight: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // 1/32 = 0.03125 ... visible limit
                // 1/16 = 0.0625 ... high quality
                // 1/12 = 0.0833 ... upper limit
                {
                    name: 'uContrastThreshold',
                    type: UniformTypes.Float,
                    value: 0.0625,
                },
                // 1/3 = 0.333 ... too little
                // 1/4 = 0.25 ... low quality
                // 1/8 = 0.125 ... high quality
                // 1/16 = 0.0625 ... overkill
                {
                    name: 'uRelativeThreshold',
                    type: UniformTypes.Float,
                    value: 0.125,
                },
                {
                    name: 'uSubpixelBlending',
                    type: UniformTypes.Float,
                    value: 0.75,
                },
                // ...PostProcessPassBaseDEPRECATED.commonUniforms,
            ],
        })
    }
}

// export function setFXAAPassSize(fxaaPass: FxaaPass, width: number, height: number) {
//     setPostProcessPassSize(fxaaPass, width, height);
//     setMaterialUniformValue(fxaaPass.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(fxaaPass.material, UniformNames.TargetHeight, height);
// }
