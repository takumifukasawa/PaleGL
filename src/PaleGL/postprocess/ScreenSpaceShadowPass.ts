import { UniformNames, UniformTypes, UniformBlockNames, PostProcessPassType } from '@/PaleGL/constants';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import {
    PostProcessPassParametersBase,
    PostProcessPassBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Override } from '@/PaleGL/palegl';
import {setMaterialUniformValue} from "@/PaleGL/materials/material.ts";

export type ScreenSpaceShadowPassParametersBase = {
    bias: number;
    jitterSize: Vector3;
    sharpness: number;
    strength: number;
    ratio: number;
    rayStepMultiplier: number;
};

export type ScreenSpaceShadowPassParameters = PostProcessPassParametersBase & ScreenSpaceShadowPassParametersBase;

export type ScreenSpaceShadowPassArgs = Partial<ScreenSpaceShadowPassParameters>;

const UNIFORM_BIAS_NAME = 'uBias';
const UNIFORM_JITTER_SIZE_NAME = 'uJitterSize';
const UNIFORM_SHARPNESS_NAME = 'uSharpness';
const UNIFORM_STRENGTH_NAME = 'uStrength';
const UNIFORM_RAY_STEP_MULTIPLIER_NAME = 'uRayStepMultiplier';

export function generateScreenSpaceShadowPassParameters(
    params: ScreenSpaceShadowPassArgs = {}
): ScreenSpaceShadowPassParameters {
    return {
        enabled: params.enabled ?? true,
        bias: params.bias ?? 0,
        jitterSize: params.jitterSize ?? new Vector3(0.025, 0.025, 0.025),
        sharpness: params.sharpness ?? 2,
        strength: params.strength ?? 1,
        ratio: params.ratio ?? 0.5,
        rayStepMultiplier: params.rayStepMultiplier ?? 1,
    };
}

export class ScreenSpaceShadowPass extends PostProcessPassBase {
    // bias: number = 0;
    // // jitterSize: Vector3 = new Vector3(0.2, 0.2, 0.2);
    // jitterSize: Vector3 = new Vector3(0.025, 0.025, 0.025);
    // // sharpness: number = 0.3;
    // sharpness: number = 2;
    // strength: number = 1;

    // ratio: number = 0.5;

    parameters: Override<PostProcessPassParametersBase, ScreenSpaceShadowPassParameters>;

    /**
     *
     * @param args
     */
    constructor(args: { gpu: Gpu; parameters?: ScreenSpaceShadowPassParameters }) {
        const { gpu } = args;
        const fragmentShader = screenSpaceShadowFragmentShader;
        // { gpu, ratio, parameters }
        const parameters = generateScreenSpaceShadowPassParameters(args.parameters ?? {});

        super({
            gpu,
            type: PostProcessPassType.ScreenSpaceShadow,
            parameters,
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
                    name: UNIFORM_BIAS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_JITTER_SIZE_NAME,
                    type: UniformTypes.Vector3,
                    value: Vector3.zero,
                },
                {
                    name: UNIFORM_SHARPNESS_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_STRENGTH_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: UNIFORM_RAY_STEP_MULTIPLIER_NAME,
                    type: UniformTypes.Float,
                    value: 0,
                },
            ],
            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                UniformBlockNames.PointLight,
            ],
            // renderTargetType: RenderTargetTypes.R16F,
        });

        // if (args.ratio) {
        //     this.ratio = ratio;
        // }

        this.parameters = parameters;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        super.setSize(width * this.parameters.ratio, height * this.parameters.ratio);
        // this.material.uniforms.setValue(UniformNames.TargetWidth, width);
        // this.material.uniforms.setValue(UniformNames.TargetHeight, height);
    }

    /**
     *
     * @param options
     */
    render(options: PostProcessPassRenderArgs) {
        setMaterialUniformValue(this.material, UNIFORM_BIAS_NAME, this.parameters.bias);
        setMaterialUniformValue(this.material, UNIFORM_JITTER_SIZE_NAME, this.parameters.jitterSize);
        setMaterialUniformValue(this.material, UNIFORM_SHARPNESS_NAME, this.parameters.sharpness);
        setMaterialUniformValue(this.material, UNIFORM_STRENGTH_NAME, this.parameters.strength);
        setMaterialUniformValue(this.material, UNIFORM_RAY_STEP_MULTIPLIER_NAME, this.parameters.rayStepMultiplier);
        super.render(options);
    }
}
