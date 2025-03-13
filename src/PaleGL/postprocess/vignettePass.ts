import { PostProcessPassType, UniformNames, UniformTypes } from '@/PaleGL/constants';
import vignetteFragment from '@/PaleGL/shaders/vignette-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassRenderArgs,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

// ref:

const UNIFORM_NAME_VIGNETTE_RADIUS_FROM = 'uVignetteRadiusFrom';
const UNIFORM_NAME_VIGNETTE_RADIUS_TO = 'uVignetteRadiusTo';
const UNIFORM_VALUE_VIGNETTE_RADIUS_FROM = 1.77;
const UNIFORM_VALUE_VIGNETTE_RADIUS_TO = 4.484;
const UNIFORM_NAME_VIGNETTE_POWER = 'uVignettePower';
const UNIFORM_VALUE_VIGNETTE_POWER = 1.345;
const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
const UNIFORM_VALUE_BLEND_RATE = 0.73;

export type VignettePassParameters = {
    vignetteRadiusFrom: number;
    vignetteRadiusTo: number;
    vignettePower: number;
    blendRate: number;
};

export type VignettePass = PostProcessSinglePass & VignettePassParameters;

export type VignettePassArgs = PostProcessPassParametersBaseArgs & Partial<VignettePassParameters>;

export function createVignettePass(args: VignettePassArgs): VignettePass {
    // parameters: Override<PostProcessPassParametersBase, VignettePassParameters>;

    const { gpu, enabled } = args;
    const fragmentShader = vignetteFragment;

    const vignetteRadiusFrom = args.vignetteRadiusFrom ?? UNIFORM_VALUE_VIGNETTE_RADIUS_FROM;
    const vignetteRadiusTo = args.vignetteRadiusTo ?? UNIFORM_VALUE_VIGNETTE_RADIUS_TO;
    const vignettePower = args.vignettePower ?? UNIFORM_VALUE_VIGNETTE_POWER;
    const blendRate = args.blendRate ?? UNIFORM_VALUE_BLEND_RATE;

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
            enabled,
        }),
        // parameters
        vignetteRadiusFrom,
        vignetteRadiusTo,
        vignettePower,
        blendRate,
    };
}

// setSize(width: number, height: number) {
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UniformNames.Aspect, width / height);
// }

export function renderVignettePass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const vignettePass = postProcessPass as VignettePass;
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_FROM, vignettePass.vignetteRadiusFrom);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_RADIUS_TO, vignettePass.vignetteRadiusTo);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_VIGNETTE_POWER, vignettePass.vignettePower);
    setMaterialUniformValue(vignettePass.material, UNIFORM_NAME_BLEND_RATE, vignettePass.blendRate);

    renderPostProcessSinglePassBehaviour(postProcessPass, options);
}
