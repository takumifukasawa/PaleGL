import { UniformNames, UniformTypes, UniformBlockNames, PostProcessPassType } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import screenSpaceShadowFragmentShader from '@/PaleGL/shaders/screen-space-shadow-fragment.glsl';
import {
    PostProcessPassParametersBase,
    PostProcessPassBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Override } from '@/PaleGL/palegl';

export type ScreenSpaceShadowPassParametersBase = {
    bias: number;
    jitterSize: Vector3;
    sharpness: number;
    strength: number;
    ratio: number;
};

export type ScreenSpaceShadowPassParameters = PostProcessPassParametersBase & ScreenSpaceShadowPassParametersBase;

export type ScreenSpaceShadowPassArgs = Partial<ScreenSpaceShadowPassParameters>;

export function generateScreenSpaceShadowPassParameters(params: ScreenSpaceShadowPassArgs = {}): ScreenSpaceShadowPassParameters {
    return {
        type: PostProcessPassType.ScreenSpaceShadow,
        enabled: params.enabled ?? true,
        bias: params.bias ?? 0,
        jitterSize: params.jitterSize ?? new Vector3(0.025, 0.025, 0.025),
        sharpness: params.sharpness ?? 2,
        strength: params.strength ?? 1,
        ratio: params.ratio ?? 0.5,
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
    constructor(args: { gpu: GPU; parameters?: ScreenSpaceShadowPassParameters }) {
        const { gpu } = args;
        const fragmentShader = screenSpaceShadowFragmentShader;
        // { gpu, ratio, parameters }
        const parameters = generateScreenSpaceShadowPassParameters(args.parameters ?? {});

        super({
            gpu,
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
                    name: 'uBias',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uJitterSize',
                    type: UniformTypes.Vector3,
                    value: Vector3.zero,
                },
                {
                    name: 'uSharpness',
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: 'uStrength',
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
        this.material.uniforms.setValue('uBias', this.parameters.bias);
        this.material.uniforms.setValue('uJitterSize', this.parameters.jitterSize);
        this.material.uniforms.setValue('uSharpness', this.parameters.sharpness);
        this.material.uniforms.setValue('uStrength', this.parameters.strength);
        super.render(options);
    }
}
