import {
    POST_PROCESS_PASS_TYPE_FXAA,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_TYPE_FLOAT,

} from '@/PaleGL/constants';
import fxaaFragmentShader from '@/PaleGL/shaders/fxaa-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';

// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/
// http://blog.simonrodriguez.fr/articles/2016/07/implementing_fxaa.html
// https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
// http://iryoku.com/aacourse/downloads/09-FXAA-3.11-in-15-Slides.pdf

export type FxaaPass = PostProcessSinglePass;

export type FXAAPassArgs = PostProcessPassParametersBaseArgs;

export const createFXAAPass = (args: FXAAPassArgs): FxaaPass => {
    const { gpu, enabled } = args;
    const fragmentShader = fxaaFragmentShader;

    return {
        ...createPostProcessSinglePass({
            gpu,
            type: POST_PROCESS_PASS_TYPE_FXAA,
            fragmentShader,
            renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
            uniforms: [
                // 1/32 = 0.03125 ... visible limit
                // 1/16 = 0.0625 ... high quality
                // 1/12 = 0.0833 ... upper limit
                ['uContrastThreshold', UNIFORM_TYPE_FLOAT, 0.0625],
                // 1/3 = 0.333 ... too little
                // 1/4 = 0.25 ... low quality
                // 1/8 = 0.125 ... high quality
                // 1/16 = 0.0625 ... overkill
                ['uRelativeThreshold', UNIFORM_TYPE_FLOAT, 0.125],
                ['uSubpixelBlending', UNIFORM_TYPE_FLOAT, 0.75],
                // ...PostProcessPassBaseDEPRECATED.commonUniforms,
            ],
            enabled,
        }),
    };
}

// export function setFXAAPassSize(fxaaPass: FxaaPass, width: number, height: number) {
//     setPostProcessPassSize(fxaaPass, width, height);
//     setMaterialUniformValue(fxaaPass.material, UNIFORM_NAME_TARGET_WIDTH, width);
//     setMaterialUniformValue(fxaaPass.material, UNIFORM_NAME_TARGET_HEIGHT, height);
// }
