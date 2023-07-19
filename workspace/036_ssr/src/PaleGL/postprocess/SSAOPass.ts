import { PostProcessPass } from '@/PaleGL/postprocess/PostProcessPass';
import { PostProcessUniformNames, TextureTypes, TextureWrapTypes, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { PostProcessRenderArgs } from '@/PaleGL/postprocess/AbstractPostProcessPass';
import { Color } from '@/PaleGL/math/Color';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { randomRange } from '@/PaleGL/utilities/mathUtilities';

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

    const samplingTexture = new Texture({
        gpu,
        width: 4,
        height: 4,
        type: TextureTypes.RGBA32F,
        wrapS: TextureWrapTypes.Repeat,
        wrapT: TextureWrapTypes.Repeat,
    });

    samplingTexture.update({
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

export class SSAOPass extends PostProcessPass {
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
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = ssaoFragmentShader;

        const { samplingRotations, samplingDistances, samplingTexture } = createSamplingTables(gpu);

        super({
            gpu,
            fragmentShader,
            uniforms: {
                [PostProcessUniformNames.TargetWidth]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.TargetHeight]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uBaseColorTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uNormalTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uDepthTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uTransposeInverseViewMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uInverseProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                uInverseViewProjectionMatrix: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
                [PostProcessUniformNames.CameraNear]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                [PostProcessUniformNames.CameraFar]: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uSamplingRotations: {
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(samplingRotations),
                },
                uSamplingDistances: {
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(samplingDistances),
                },
                uSamplingTexture: {
                    type: UniformTypes.Texture,
                    value: samplingTexture,
                },
                uOcclusionSampleLength: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uOcclusionBias: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uOcclusionMinDistance: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uOcclusionMaxDistance: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uOcclusionColor: {
                    type: UniformTypes.Color,
                    value: new Color(0, 0, 0, 1),
                },
                uOcclusionPower: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uOcclusionStrength: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uBlendRate: {
                    type: UniformTypes.Float,
                    value: 1,
                },
            },
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
        // this.material.uniforms.uTargetWidth.value = width;
        // this.material.uniforms.uTargetHeight.value = height;
        this.material.updateUniform(PostProcessUniformNames.TargetWidth, width);
        this.material.updateUniform(PostProcessUniformNames.TargetHeight, height);
    }

    render(options: PostProcessRenderArgs) {
        this.material.updateUniform('uOcclusionSampleLength', this.occlusionSampleLength);
        this.material.updateUniform('uOcclusionBias', this.occlusionBias);
        this.material.updateUniform('uOcclusionMinDistance', this.occlusionMinDistance);
        this.material.updateUniform('uOcclusionMaxDistance', this.occlusionMaxDistance);
        this.material.updateUniform('uOcclusionColor', this.occlusionColor);
        this.material.updateUniform('uOcclusionPower', this.occlusionPower);
        this.material.updateUniform('uOcclusionStrength', this.occlusionStrength);
        this.material.updateUniform('uBlendRate', this.blendRate);
        this.material.updateUniform('uSamplingTexture', this.samplingTexture);

        super.render(options);
    }
}
