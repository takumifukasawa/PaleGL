import { NeedsShorten } from '@/Marionetter/types';
import { POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION, UNIFORM_TYPE_FLOAT } from '@/PaleGL/constants';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import chromaticAberrationFragment from '@/PaleGL/shaders/chromatic-aberration-fragment.glsl';

const UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE = 'uScale';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE = 0.015;

const UNIFORM_NAME_CHROMATIC_ABERRATION_POWER = 'uPower';
const UNIFORM_VALUE_CHROMATIC_ABERRATION_POWER = 1;

// ---

export type ChromaticAberrationPassParameters = {
    enabled: boolean;
    scale: number;
    power: number;
    blendRate: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'ca_on' : 'enabled';
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_PROPERTY_SCALE = NeedsShorten ? 'ca_s' : 'scale';
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_PROPERTY_POWER = NeedsShorten ? 'ca_p' : 'power';
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'ca_br' : 'blendRate';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_KEY_SCALE = 'scale' as const;
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_KEY_POWER = 'power' as const;
export const CHROMATIC_ABERRATION_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;

// ---

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
            type: POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_CHROMATIC_ABERRATION_SCALE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: UNIFORM_VALUE_CHROMATIC_ABERRATION_SCALE,
                },
                {
                    name: UNIFORM_NAME_CHROMATIC_ABERRATION_POWER,
                    type: UNIFORM_TYPE_FLOAT,
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
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_WIDTH, width);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_HEIGHT, height);
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
