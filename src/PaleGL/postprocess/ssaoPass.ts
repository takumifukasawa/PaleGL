import {
    POST_PROCESS_PASS_TYPE_SSAO,
    TEXTURE_TYPE_RGBA32F,
    TEXTURE_WRAP_TYPE_REPEAT,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_FLOAT_ARRAY,
    UNIFORM_TYPE_COLOR,
    UNIFORM_NAME_GBUFFER_B_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
} from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { NeedsShorten } from '@/Marionetter/types';
import { createTexture, Texture, updateTexture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Color, createColorBlack } from '@/PaleGL/math/color.ts';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { randomRange } from '@/PaleGL/utilities/mathUtilities';

export type SSAOPassParameters = {
    enabled: boolean;
    occlusionSampleLength: number;
    occlusionBias: number;
    occlusionMinDistance: number;
    occlusionMaxDistance: number;
    occlusionColor: Color;
    occlusionPower: number;
    occlusionStrength: number;
    blendRate: number;
    samplingTexture: Texture;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const SSAO_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'ao_on' : 'enabled';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_SAMPLE_LENGTH = NeedsShorten ? 'ao_sl' : 'occlusionSampleLength';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_BIAS = NeedsShorten ? 'ao_b' : 'occlusionBias';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_MIN_DISTANCE = NeedsShorten ? 'ao_mid' : 'occlusionMinDistance';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_MAX_DISTANCE = NeedsShorten ? 'ao_mad' : 'occlusionMaxDistance';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_COLOR = NeedsShorten ? 'ao_c' : 'occlusionColor';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_POWER = NeedsShorten ? 'ao_p' : 'occlusionPower';
export const SSAO_PASS_PARAMETERS_PROPERTY_OCCLUSION_STRENGTH = NeedsShorten ? 'ao_s' : 'occlusionStrength';
export const SSAO_PASS_PARAMETERS_PROPERTY_BLEND_RATE = NeedsShorten ? 'ao_br' : 'blendRate';
export const SSAO_PASS_PARAMETERS_PROPERTY_SAMPLING_TEXTURE = NeedsShorten ? 'ao_tex' : 'samplingTexture';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const SSAO_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_SAMPLE_LENGTH = 'occlusionSampleLength' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_BIAS = 'occlusionBias' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_MIN_DISTANCE = 'occlusionMinDistance' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_MAX_DISTANCE = 'occlusionMaxDistance' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_COLOR = 'occlusionColor' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_POWER = 'occlusionPower' as const;
export const SSAO_PASS_PARAMETERS_KEY_OCCLUSION_STRENGTH = 'occlusionStrength' as const;
export const SSAO_PASS_PARAMETERS_KEY_BLEND_RATE = 'blendRate' as const;
export const SSAO_PASS_PARAMETERS_KEY_SAMPLING_TEXTURE = 'samplingTexture' as const;

/**
 *
 * @param gpu
 */
const createSamplingTables: (gpu: Gpu) => {
    samplingRotations: number[];
    samplingDistances: number[];
    samplingTexture: Texture;
} = (gpu) => {
    // 任意にtableを作成
    const samplingRotations: number[] = [
        Math.PI * ((1 / 3) * 0 + 0.1),
        Math.PI * ((1 / 3) * 4 + 0.1),
        Math.PI * ((1 / 3) * 2 + 0.1),
        Math.PI * ((1 / 3) * 1 + 0.1),
        Math.PI * ((1 / 3) * 3 + 0.1),
        Math.PI * ((1 / 3) * 5 + 0.1),
    ];
    const samplingDistances: number[] = [
        ((0.9 - 0.1) / 6) * 0 + 0.1,
        ((0.9 - 0.1) / 6) * 4 + 0.1,
        ((0.9 - 0.1) / 6) * 2 + 0.1,
        ((0.9 - 0.1) / 6) * 1 + 0.1,
        ((0.9 - 0.1) / 6) * 3 + 0.1,
        ((0.9 - 0.1) / 6) * 5 + 0.1,
    ];

    const tableWidth = 4;
    const tableHeight = 4;
    const pixelNum = tableWidth * tableHeight;

    // const minRad = 0;
    // const maxRad = Math.PI * 2;
    const minLen = 1;
    const maxLen = 2;
    const pieceRad = (1 / pixelNum) * Math.PI * 2;
    const pieceLen = (maxLen - minLen) / pixelNum;

    const data = new Array(pixelNum)
        .fill(0)
        .map((_, i) => {
            // const rad = randomRange(minRad, maxRad);
            // const len = randomRange(minLen, maxLen);
            // radを適当にoffset
            const rad = randomRange(pieceRad * (i * 4), pieceRad * (i * 4 + 4)) % (Math.PI * 2);
            const len = minLen + pieceLen * i;
            // for debug
            // console.log(rad, len);
            return [rad, len, 1, 1];
        })
        .flat();

    const samplingTexture = createTexture({
        gpu,
        width: 4,
        height: 4,
        type: TEXTURE_TYPE_RGBA32F,
        wrapS: TEXTURE_WRAP_TYPE_REPEAT,
        wrapT: TEXTURE_WRAP_TYPE_REPEAT,
    });

    updateTexture(samplingTexture, {
        width: 4,
        height: 4,
        data: new Float32Array(data),
    });

    return {
        samplingRotations,
        samplingDistances,
        samplingTexture,
    };
};

// pass ---

export type SsaoPass = PostProcessSinglePass & SSAOPassParameters;

export type SSAOPassParametersArgs = PostProcessPassParametersBaseArgs & Partial<SSAOPassParameters>;

export function createSSAOPass(args: SSAOPassParametersArgs): SsaoPass {
    const { gpu, enabled } = args;

    const occlusionSampleLength: number = args.occlusionSampleLength ?? 0.121;
    const occlusionBias: number = args.occlusionBias ?? 0.0001;
    const occlusionMinDistance: number = args.occlusionMinDistance ?? 0.006;
    const occlusionMaxDistance: number = args.occlusionMaxDistance ?? 0.2;
    const occlusionColor: Color = args.occlusionColor ?? createColorBlack();
    const occlusionPower: number = args.occlusionPower ?? 1.85;
    const occlusionStrength: number = args.occlusionStrength ?? 0.448;
    const blendRate: number = args.blendRate ?? 1;

    const fragmentShader = ssaoFragmentShader;

    const { samplingRotations, samplingDistances, samplingTexture } = createSamplingTables(gpu);

    return {
        ...createPostProcessSinglePass({
            gpu,
            enabled,
            type: POST_PROCESS_PASS_TYPE_SSAO,
            fragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_GBUFFER_B_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_DEPTH_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: 'uSamplingRotations',
                    type: UNIFORM_TYPE_FLOAT_ARRAY,
                    value: new Float32Array(samplingRotations),
                },
                {
                    name: 'uSamplingDistances',
                    type: UNIFORM_TYPE_FLOAT_ARRAY,
                    value: new Float32Array(samplingDistances),
                },
                {
                    name: 'uSamplingTexture',
                    type: UNIFORM_TYPE_TEXTURE,
                    value: samplingTexture,
                },
                {
                    name: 'uOcclusionSampleLength',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uOcclusionBias',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uOcclusionMinDistance',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uOcclusionMaxDistance',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uOcclusionColor',
                    type: UNIFORM_TYPE_COLOR,
                    value: createColorBlack(),
                },
                {
                    name: 'uOcclusionPower',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uOcclusionStrength',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
                {
                    name: 'uBlendRate',
                    type: UNIFORM_TYPE_FLOAT,
                    value: 1,
                },
            ],
            uniformBlockNames: [UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_BLOCK_NAME_CAMERA],
        }),
        // params
        occlusionSampleLength,
        occlusionBias,
        occlusionMinDistance,
        occlusionMaxDistance,
        occlusionColor,
        occlusionPower,
        occlusionStrength,
        blendRate,
        samplingTexture,
    };
}

// export function setSSAOPassSize(postProcessPass: PostProcessPassBaseDEPRECATED, width: number, height: number) {
//     const ssaoPass = postProcessPass as SsaoPass;
//     setPostProcessPassSize();
//     super.setSize(width, height);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_WIDTH, width);
//     setMaterialUniformValue(this.material, UNIFORM_NAME_TARGET_HEIGHT, height);
// }

export function renderSSAOPass(postProcessPass: PostProcessPassBase, options: PostProcessPassRenderArgs) {
    const ssaoPass = postProcessPass as SsaoPass;
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionSampleLength', ssaoPass.occlusionSampleLength);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionBias', ssaoPass.occlusionBias);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionMinDistance', ssaoPass.occlusionMinDistance);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionMaxDistance', ssaoPass.occlusionMaxDistance);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionColor', ssaoPass.occlusionColor);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionPower', ssaoPass.occlusionPower);
    setMaterialUniformValue(ssaoPass.material, 'uOcclusionStrength', ssaoPass.occlusionStrength);
    setMaterialUniformValue(ssaoPass.material, 'uBlendRate', ssaoPass.blendRate);
    setMaterialUniformValue(ssaoPass.material, 'uSamplingTexture', ssaoPass.samplingTexture);

    renderPostProcessSinglePassBehaviour(ssaoPass, options);
}
