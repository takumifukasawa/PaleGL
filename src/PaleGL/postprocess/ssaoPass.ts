import {
    UniformNames,
    TextureTypes,
    TextureWrapTypes,
    UniformTypes,
    UniformBlockNames,
    PostProcessPassType,
} from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Color, createColorBlack } from '@/PaleGL/math/color.ts';
import { createTexture, Texture, updateTexture } from '@/PaleGL/core/texture.ts';
import { randomRange } from '@/PaleGL/utilities/mathUtilities';
import {
    createPostProcessSinglePass,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { renderPostProcessSinglePassBehaviour } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

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
        type: TextureTypes.RGBA32F,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
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

export type SSAOPassParameters = {
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
        ...createPostProcessSinglePass(
            {
                gpu,
                enabled,
                type: PostProcessPassType.SSAO,
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
                        name: 'uSamplingRotations',
                        type: UniformTypes.FloatArray,
                        value: new Float32Array(samplingRotations),
                    },
                    {
                        name: 'uSamplingDistances',
                        type: UniformTypes.FloatArray,
                        value: new Float32Array(samplingDistances),
                    },
                    {
                        name: 'uSamplingTexture',
                        type: UniformTypes.Texture,
                        value: samplingTexture,
                    },
                    {
                        name: 'uOcclusionSampleLength',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uOcclusionBias',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uOcclusionMinDistance',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uOcclusionMaxDistance',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uOcclusionColor',
                        type: UniformTypes.Color,
                        value: createColorBlack(),
                    },
                    {
                        name: 'uOcclusionPower',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uOcclusionStrength',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uBlendRate',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                ],
                uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
            },
        ),
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
//     setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
//     setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
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
