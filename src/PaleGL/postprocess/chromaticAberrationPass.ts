import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassRenderArgs,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uScale';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;

const UNIFORM_NAME_CHROMATIC_ABERRATION_POWER = 'uPower';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER = 1;

export type ChromaticAberrationPassParameters = {
    scale: number;
    power: number;
    blendRate: number;
};

export type ChromaticAberrationPass = PostProcessSinglePass & ChromaticAberrationPassParameters;

type ChromaticAberrationPassArgs = PostProcessPassParametersBaseArgs & Partial<ChromaticAberrationPassParameters>;

export function createChromaticAberrationPass(args: ChromaticAberrationPassArgs): ChromaticAberrationPass {
    const { gpu, enabled } = args;
    
    const scale = args.scale ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE;
    const power = args.power ?? UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER;
    const blendRate = args.blendRate ?? 1;

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
            enabled,
        }),
        // parameters
        scale,
        power,
        blendRate,
    };
}

// export function setChromaticAberrationPassSize(postProcessPass: PostProcessPassBaseDEPRECATED, width: number, height: number) {
//     const pass = postProcessPass as PostProcessSinglePass;
//     setPostProcessSinglePassSizeBehaviour(pass, width, height);
//     setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
// }

export function renderChromaticAberrationPass(
    postProcessPass: PostProcessPassBase,
    options: PostProcessPassRenderArgs
) {
    const chromaticAberrationPass = postProcessPass as ChromaticAberrationPass;
    setMaterialUniformValue(
        chromaticAberrationPass.material,
        UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
        chromaticAberrationPass.scale
    );
    setMaterialUniformValue(
        chromaticAberrationPass.material,
        UNIFORM_NAME_CHROMATIC_ABERRATION_POWER,
        chromaticAberrationPass.power
    );
    renderPostProcessSinglePassBehaviour(chromaticAberrationPass, options);
}
