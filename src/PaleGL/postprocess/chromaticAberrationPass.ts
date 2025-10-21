import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
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

// ---- Type（既存）----
export type ChromaticAberrationPassParameters = {
    enabled: boolean;
    scale: number;
    power: number;
    blendRate: number;
};

// ---- Short names（C#定数に完全一致）----
export const ChromaticAberration_ShortNames = {
    enabled: 'ca_on',
    scale: 'ca_s',
    power: 'ca_p',
    blendRate: 'ca_br',
} as const satisfies ShortNamesFor<ChromaticAberrationPassParameters>;

// ---- 派生（テンプレ同様）----
const ChromaticAberration = createShortenKit<ChromaticAberrationPassParameters>()(ChromaticAberration_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const ChromaticAberrationPassParametersPropertyMap = ChromaticAberration.map(NeedsShorten);

// 常に long キー（論理キー）
export const ChromaticAberrationPassParametersKey = makeLongKeyMap(ChromaticAberration_ShortNames);

// 任意：キーのユニオン／拡張型
export type ChromaticAberrationPassParametersKey = keyof typeof ChromaticAberrationPassParametersKey;
export type ChromaticAberrationPassParametersProperty = typeof ChromaticAberration.type;

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
