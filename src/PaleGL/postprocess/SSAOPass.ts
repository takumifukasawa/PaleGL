﻿import {
    UniformNames,
    TextureTypes,
    TextureWrapTypes,
    UniformTypes,
    UniformBlockNames,
    PostProcessPassType,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU.ts';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Color } from '@/PaleGL/math/Color';
import { createTexture, Texture, updateTexture } from '@/PaleGL/core/texture.ts';
import { randomRange } from '@/PaleGL/utilities/mathUtilities';
import {
    PostProcessPassBase
} from '@/PaleGL/postprocess/postprocessPassBaseWIP.ts';
import {
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';

export type SSAOPassParameters = PostProcessPassParametersBaseArgs;

export type SSAOPassParametersArgs = Partial<SSAOPassParameters>;

export function generateSSAOPassParameters(params: SSAOPassParametersArgs = {}): SSAOPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

/**
 *
 * @param gpu
 */
const createSamplingTables: (gpu: GPU) => {
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

/**
 *
 */
export class SSAOPass extends PostProcessPassBase {
    occlusionSampleLength: number = 0.121;
    occlusionBias: number = 0.0001;
    occlusionMinDistance: number = 0.006;
    occlusionMaxDistance: number = 0.2;
    occlusionColor: Color = new Color(0, 0, 0, 1);
    occlusionPower: number = 1.85;
    occlusionStrength: number = 0.448;
    blendRate: number = 1;

    samplingTexture: Texture;

    /**
     *
     * @param gpu
     */
    constructor(args: { gpu: GPU; parameters?: SSAOPassParametersArgs }) {
        const { gpu } = args;
        const fragmentShader = ssaoFragmentShader;

        const { samplingRotations, samplingDistances, samplingTexture } = createSamplingTables(gpu);

        const parameters = generateSSAOPassParameters(args.parameters ?? {});

        super({
            gpu,
            type: PostProcessPassType.SSAO,
            fragmentShader,
            parameters,
            uniforms: [
                // [UniformNames.TargetWidth]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // [UniformNames.TargetHeight]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                {
                    name: UniformNames.GBufferBTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                // uBaseColorTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
                // uNormalTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
                {
                    name: UniformNames.DepthTexture,
                    // uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                // uTransposeInverseViewMatrix: {
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                // uProjectionMatrix: {
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                // uInverseProjectionMatrix: {
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                // uInverseViewProjectionMatrix: {
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                // [UniformNames.CameraNear]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // [UniformNames.CameraFar]: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
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
                    value: new Color(0, 0, 0, 1),
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
        });

        this.samplingTexture = samplingTexture;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width, height);
        setMaterialUniformValue(this.material, UniformNames.TargetWidth, width);
        setMaterialUniformValue(this.material, UniformNames.TargetHeight, height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        setMaterialUniformValue(this.material, 'uOcclusionSampleLength', this.occlusionSampleLength);
        setMaterialUniformValue(this.material, 'uOcclusionBias', this.occlusionBias);
        setMaterialUniformValue(this.material, 'uOcclusionMinDistance', this.occlusionMinDistance);
        setMaterialUniformValue(this.material, 'uOcclusionMaxDistance', this.occlusionMaxDistance);
        setMaterialUniformValue(this.material, 'uOcclusionColor', this.occlusionColor);
        setMaterialUniformValue(this.material, 'uOcclusionPower', this.occlusionPower);
        setMaterialUniformValue(this.material, 'uOcclusionStrength', this.occlusionStrength);
        setMaterialUniformValue(this.material, 'uBlendRate', this.blendRate);
        setMaterialUniformValue(this.material, 'uSamplingTexture', this.samplingTexture);

        super.render(options);
    }
}
