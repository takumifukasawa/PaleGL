import { PostProcessPass } from '@/PaleGL/postprocess/PostProcessPass';
import { PostProcessUniformNames, UniformTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import ssaoFragmentShader from '@/PaleGL/shaders/ssao-fragment.glsl';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { PostProcessRenderArgs } from '@/PaleGL/postprocess/AbstractPostProcessPass.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { randomRange } from '@/PaleGL/utilities/mathUtilities';

const samplingCount = 6;

// TODO: 4x4ピクセルのテーブル化させたい
const createSamplingTables: () => { samplingRotations: number[]; samplingDistances: number[] } = () => {
    
    const samplingRotations: number[] = [
        Math.PI * 0.1,
        Math.PI * 0.4,
        Math.PI * 1.6,
        Math.PI * 0.8,
        Math.PI * 1.2,
        Math.PI * 1.9,
    ];
    const samplingDistances: number[] = [
        1,
        1.5,
        1.7,
        2,
        1.3,
        1.9
    ];

    // // TODO: sampling rotations, distances は固定化できるとよい
    // for (let i = 0; i < samplingCount; i++) {
    //     // calc sampling rotations
    //     const pieceRad = (Math.PI * 2) / samplingCount;
    //     const rad = randomRange(pieceRad * i, pieceRad * (i + 1));
    //     // samplingRotations.push(pieceRad * i);
    //     samplingRotations.push(rad);
    //     
    //     // calc sampling distances 
    //     // const baseDistance = 0.5;
    //     // const pieceDistance = (1 - baseDistance) / samplingCount;
    //     // const distance = randomRange(pieceDistance * i, pieceDistance * (i + 1));
    //     const distance = randomRange(1, 2);
    //     // const distance = baseDistance + pieceDistance * i;
    //     samplingDistances.push(distance);
    //     // samplingDistances.push(1);
    // }
    
    return {
        samplingRotations,
        samplingDistances,
    };
};

export class SSAOPass extends PostProcessPass {
    occlusionSampleLength: number = 0.033;
    occlusionBias: number = 0.0001;
    occlusionMinDistance: number = 0.006;
    occlusionMaxDistance: number = 0.244;
    occlusionColor: Color = new Color(1, 0, 0, 1);
    occlusionStrength: number = 1;
    blendRate: number = 1;

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = ssaoFragmentShader;

        const { samplingRotations, samplingDistances } = createSamplingTables();

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
        this.material.updateUniform('uOcclusionStrength', this.occlusionStrength);
        this.material.updateUniform('uBlendRate', this.blendRate);

        super.render(options);
    }
}
