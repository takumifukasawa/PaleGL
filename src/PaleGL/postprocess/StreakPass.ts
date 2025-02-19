import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
// import { gaussianBlurFragmentShader } from '@/PaleGL/shaders/gaussianBlurShader';
// import { RenderTarget } from '@/PaleGL/core/RenderTarget';
// import {CopyPass} from "./CopyPass";
import { Material } from '@/PaleGL/materials/Material';
// import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
// import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
// import extractBrightnessFragmentShader from '@/PaleGL/shaders/extract-brightness-fragment.glsl';
// import bloomCompositeFragmentShader from '@/PaleGL/shaders/bloom-composite-fragment.glsl';
import streakPrefilterFragmentShader from '@/PaleGL/shaders/streak-prefilter-fragment.glsl';
import streakDownSampleFragmentShader from '@/PaleGL/shaders/streak-down-sample-fragment.glsl';
import streakUpSampleFragmentShader from '@/PaleGL/shaders/streak-up-sample-fragment.glsl';
import streakCompositeFragmentShader from '@/PaleGL/shaders/streak-composite-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Color } from '@/PaleGL/math/Color.ts';

const UNIFORM_NAME_PREV_TEXTURE = 'uPrevTexture';
const UNIFORM_NAME_DOWN_SAMPLE_TEXTURE = 'uDownSampleTexture';
const UNIFORM_NAME_STRETCH = 'uStretch';
const UNIFORM_NAME_HORIZONTAL_SCALE = 'uHorizontalScale';
const UNIFORM_NAME_STREAK_TEXTURE = 'uStreakTexture';
const UNIFORM_NAME_COLOR = 'uColor';
const UNIFORM_NAME_INTENSITY = 'uIntensity';

// const BLUR_PIXEL_NUM = 7;

// ref:
// https://github.com/keijiro/KinoStreak/

type StreakPassParametersBase = {
    threshold: number;
    stretch: number;
    color: Color;
    intensity: number;
    verticalScale: number;
    horizontalScale: number;
};

type StreakPassParameters = PostProcessPassParametersBase & StreakPassParametersBase;

type StreakPassParametersArgs = Partial<StreakPassParameters>;

function generateStreakPassParameters(args: StreakPassParametersArgs = {}): StreakPassParameters {
    return {
        enabled: args.enabled || true,
        threshold: args.threshold || 0.9,
        stretch: args.stretch || 0.5,
        color: args.color || Color.white,
        intensity: args.intensity || 0.6,
        verticalScale: args.verticalScale || 1.5,
        horizontalScale: args.horizontalScale || 1.25,
    };
}

export class StreakPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'StreakPass';
    type: PostProcessPassType = PostProcessPassType.Streak;
    
    // enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    // parameters
    // threshold: number = 0.9;
    // stretch: number = 0.5;
    // color: Color = Color.white;
    // intensity: number = 0.6;
    // verticalScale: number = 1.5;
    // horizontalScale: number = 1.25;
    parameters: StreakPassParameters;

    materials: Material[] = [];

    // private extractBrightnessPass;

    // tmp
    // private renderTargetExtractBrightness: RenderTarget;
    // private renderTargetBlurMip4_Horizontal: RenderTarget;
    // private renderTargetBlurMip4_Vertical: RenderTarget;
    // private renderTargetBlurMip8_Horizontal: RenderTarget;
    // private renderTargetBlurMip8_Vertical: RenderTarget;
    // private renderTargetBlurMip16_Horizontal: RenderTarget;
    // private renderTargetBlurMip16_Vertical: RenderTarget;
    // private renderTargetBlurMip32_Horizontal: RenderTarget;
    // private renderTargetBlurMip32_Vertical: RenderTarget;
    // private renderTargetBlurMip64_Horizontal: RenderTarget;
    // private renderTargetBlurMip64_Vertical: RenderTarget;

    // private renderTargetDownSampleMip2: RenderTarget;

    // get renderTargetBlurMip4() {
    //     return this.renderTargetBlurMip4_Vertical;
    // }
    // get renderTargetBlurMip8() {
    //     return this.renderTargetBlurMip8_Vertical;
    // }
    // get renderTargetBlurMip16() {
    //     return this.renderTargetBlurMip16_Vertical;
    // }
    // get renderTargetBlurMip32() {
    //     return this.renderTargetBlurMip32_Vertical;
    // }
    // get renderTargetBlurMip64() {
    //     return this.renderTargetBlurMip64_Vertical;
    // }

    // tmp
    // private horizontalBlurPass: FragmentPass;
    // private verticalBlurPass: FragmentPass;

    // #lastPass;
    // private downSampleMip2Pass: FragmentPass;
    // private downSampleMip4Pass: FragmentPass;
    // private downSampleMip8Pass: FragmentPass;
    // private downSampleMip16Pass: FragmentPass;
    // private downSampleMip32Pass: FragmentPass;
    prefilterPass: FragmentPass;
    downSamplePasses: { pass: FragmentPass; prevPass: FragmentPass; downScale: number }[] = [];
    upSamplePasses: { pass: FragmentPass; prevPass: FragmentPass; downSamplePass: FragmentPass }[] = [];
    compositePass: FragmentPass;
    // private downSampleMaterial: Material;

    private geometry: PlaneGeometry;
    // horizontalBlurMaterial: Material;
    // verticalBlurMaterial: Material;

    //tone: number = 1;
    //bloomAmount: number = 0.8;

    halfHeight: number = 0;

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    constructor({
        gpu,
        // threshold,
        // stretch,
        // intensity,
        // color,
        // verticalScale,
        // horizontalScale,
        parameters,
    }: {
        gpu: GPU;
        // threshold?: number;
        // stretch?: number;
        // intensity?: number;
        // color?: Color;
        // verticalScale?: number;
        // horizontalScale?: number;
        parameters?: StreakPassParametersArgs;
        // tone?: number;
        // bloomAmount?: number;
    }) {
        // super();

        // this.gpu = gpu;

        this.parameters = generateStreakPassParameters(parameters);

        // this.threshold = threshold !== undefined ? threshold : this.threshold;
        // this.color = color !== undefined ? color : this.color;
        // this.stretch = stretch !== undefined ? stretch : this.stretch;
        // this.intensity = intensity !== undefined ? intensity : this.intensity;
        // this.verticalScale = verticalScale !== undefined ? verticalScale : this.verticalScale;
        // this.horizontalScale = horizontalScale !== undefined ? horizontalScale : this.horizontalScale;
        // this.tone = tone;
        // this.bloomAmount = bloomAmount;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });

        this.prefilterPass = new FragmentPass({
            gpu,
            fragmentShader: streakPrefilterFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.TexelSize,
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                {
                    name: 'uThreshold',
                    type: UniformTypes.Float,
                    value: this.parameters.threshold,
                },
                {
                    name: 'uVerticalScale',
                    type: UniformTypes.Float,
                    value: this.parameters.verticalScale,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.prefilterPass.materials);

        const downSamplePassInfos = [2, 4, 8, 16, 32].map((downScale) => {
            const pass = new FragmentPass({
                name: `DownSampleMip${downScale}Pass`,
                gpu,
                fragmentShader: streakDownSampleFragmentShader,
                uniforms: [
                    {
                        name: UniformNames.TexelSize,
                        type: UniformTypes.Vector2,
                        value: Vector2.zero,
                    },
                    {
                        name: UNIFORM_NAME_PREV_TEXTURE,
                        type: UniformTypes.Texture,
                        value: null,
                    },
                    {
                        name: UNIFORM_NAME_HORIZONTAL_SCALE,
                        type: UniformTypes.Float,
                        value: this.parameters.horizontalScale,
                    },
                    ...PostProcessPassBase.commonUniforms,
                ],
            });
            this.materials.push(...pass.materials);
            return { pass, downScale };
        });
        this.downSamplePasses = downSamplePassInfos.map(({ pass, downScale }, i) => {
            return {
                pass,
                prevPass: i === 0 ? this.prefilterPass : downSamplePassInfos[i - 1].pass,
                downScale,
            };
        });

        const upSamplePassInfos = maton.range(5).map((_, index) => {
            const pass = new FragmentPass({
                name: `UpSampleMip${index}Pass`,
                gpu,
                fragmentShader: streakUpSampleFragmentShader,
                uniforms: [
                    {
                        name: UNIFORM_NAME_DOWN_SAMPLE_TEXTURE,
                        type: UniformTypes.Texture,
                        value: null,
                    },
                    {
                        name: UNIFORM_NAME_PREV_TEXTURE,
                        type: UniformTypes.Texture,
                        value: null,
                    },
                    {
                        name: UNIFORM_NAME_STRETCH,
                        type: UniformTypes.Float,
                        value: this.parameters.stretch,
                    },
                    ...PostProcessPassBase.commonUniforms,
                ],
            });
            this.materials.push(...pass.materials);
            return { pass };
        });
        this.upSamplePasses = upSamplePassInfos.map(({ pass }, index) => {
            return {
                pass,
                prevPass:
                    index === 0
                        ? this.downSamplePasses[this.downSamplePasses.length - 1].pass
                        : upSamplePassInfos[index - 1].pass,
                // downSamplePass: this.downSamplePasses[index].pass,
                downSamplePass: this.downSamplePasses[this.downSamplePasses.length - 1 - index].pass,
            };
        });

        // tmp
        // this.renderTargetExtractBrightness = new RenderTarget({gpu});
        // this.renderTargetBlurMip4_Horizontal = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip4_Vertical = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip8_Horizontal = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip8_Vertical = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip16_Horizontal = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip16_Vertical = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip32_Horizontal = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip32_Vertical = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip64_Horizontal = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetBlurMip64_Vertical = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        //     // type: RenderTargetTypes.RGBA
        // });
        // this.renderTargetDownSampleMip2 = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.R11F_G11F_B10F,
        // });

        // const copyPass = new CopyPass({ gpu });
        // this.#passes.push(copyPass);

        // this.extractBrightnessPass = new FragmentPass({
        //     gpu,
        //     fragmentShader: extractBrightnessFragmentShader,
        //     uniforms: [
        //         {
        //             name: 'uThreshold',
        //             type: UniformTypes.Float,
        //             value: this.threshold,
        //         },
        //     ],
        //     renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        //     // renderTargetType: RenderTargetTypes.RGBA
        // });
        // this.materials.push(...this.extractBrightnessPass.materials);

        // // const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, Math.floor(BLUR_PIXEL_NUM / 2));
        // const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, 0.92);
        // console.log("blurWeights", blurWeights)

        // this.horizontalBlurMaterial = new Material({
        //     vertexShader: PostProcessPassBase.baseVertexShader,
        //     fragmentShader: gaussianBlurFragmentShader,
        //     uniforms: [
        //         {
        //             name: UniformNames.SrcTexture,
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         {
        //             name: 'uBlurWeights',
        //             type: UniformTypes.FloatArray,
        //             value: new Float32Array(blurWeights),
        //         },
        //         {
        //             name: 'uIsHorizontal',
        //             type: UniformTypes.Float,
        //             value: 1,
        //         },
        //         ...PostProcessPassBase.commonUniforms,
        //     ],
        // });
        // this.materials.push(this.horizontalBlurMaterial);

        // this.verticalBlurMaterial = new Material({
        //     vertexShader: PostProcessPassBase.baseVertexShader,
        //     fragmentShader: gaussianBlurFragmentShader,
        //     uniforms: [
        //         {
        //             name: UniformNames.SrcTexture,
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         {
        //             name: 'uBlurWeights',
        //             type: UniformTypes.FloatArray,
        //             value: new Float32Array(blurWeights),
        //         },
        //         {
        //             name: 'uIsHorizontal',
        //             type: UniformTypes.Float,
        //             value: 0,
        //         },
        //         ...PostProcessPassBase.commonUniforms,
        //     ],
        // });
        // this.materials.push(this.verticalBlurMaterial);

        // this.downSampleMaterial = new Material({
        //     vertexShader: PostProcessPassBase.baseVertexShader,
        //     fragmentShader: streakDownSampleFragmentShader,
        //     uniforms: [
        //         {
        //             name: UniformNames.SrcTexture,
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         {
        //             name: UniformNames.TexelSize,
        //             type: UniformTypes.Vector2,
        //             value: Vector2.zero,
        //         },
        //         ...PostProcessPassBase.commonUniforms,
        //     ],
        // });
        // this.materials.push(this.downSampleMaterial);

        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: streakCompositeFragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_STREAK_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_COLOR,
                    type: UniformTypes.Color,
                    value: this.parameters.color,
                },
                {
                    name: UNIFORM_NAME_INTENSITY,
                    type: UniformTypes.Float,
                    value: this.parameters.intensity,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.compositePass.materials);
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        // this.extractBrightnessPass.setSize(width, height);

        // this.renderTargetBlurMip4_Horizontal.setSize(this.width / 4, this.height / 4);
        // this.renderTargetBlurMip4_Vertical.setSize(this.width / 4, this.height / 4);
        // this.renderTargetBlurMip8_Horizontal.setSize(this.width / 8, this.height / 8);
        // this.renderTargetBlurMip8_Vertical.setSize(this.width / 8, this.height / 8);
        // this.renderTargetBlurMip16_Horizontal.setSize(this.width / 16, this.height / 16);
        // this.renderTargetBlurMip16_Vertical.setSize(this.width / 16, this.height / 16);
        // this.renderTargetBlurMip32_Horizontal.setSize(this.width / 32, this.height / 32);
        // this.renderTargetBlurMip32_Vertical.setSize(this.width / 32, this.height / 32);
        // this.renderTargetBlurMip64_Horizontal.setSize(this.width / 64, this.height / 64);
        // this.renderTargetBlurMip64_Vertical.setSize(this.width / 64, this.height / 64);

        this.halfHeight = Math.floor(this.height / 2);
        this.prefilterPass.setSize(this.width, this.halfHeight);
        // this.renderTargetDownSampleMip2.setSize(this.width, this.halfHeight);

        //
        // down sample pass のリサイズはrender時にやる
        //

        this.compositePass.setSize(this.width, this.height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    update() {}

    render({
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        gBufferRenderTargets,
        targetCamera,
        time,
    }: PostProcessPassRenderArgs) {
        // 一回だけ呼びたい
        this.geometry.start();
        // ppの場合はいらない気がする
        // this.mesh.updateTransform();

        //
        // prefilter
        //

        this.prefilterPass.material.uniforms.setValue('uTexelSize', new Vector2(1 / this.width, 1 / this.height));
        this.prefilterPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        this.prefilterPass.material.uniforms.setValue('uVerticalScale', this.parameters.verticalScale);
        this.prefilterPass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });

        //
        // down sample
        //

        this.downSamplePasses.forEach(({ pass, prevPass, downScale }) => {
            const width = Math.floor(this.width / downScale);
            pass.setSize(width, this.halfHeight);
            pass.material.uniforms.setValue(UniformNames.TexelSize, new Vector2(1 / width, 1 / this.halfHeight));
            pass.material.uniforms.setValue(UNIFORM_NAME_PREV_TEXTURE, prevPass.renderTarget.$getTexture());
            pass.material.uniforms.setValue(UNIFORM_NAME_HORIZONTAL_SCALE, this.parameters.horizontalScale);
            pass.render({
                gpu,
                camera,
                renderer,
                prevRenderTarget: null,
                isLastPass: false,
                targetCamera,
                gBufferRenderTargets,
                time,
            });
        });

        //
        // up sample
        //

        this.upSamplePasses.forEach(({ pass, prevPass, downSamplePass }) => {
            pass.setSize(downSamplePass.width, downSamplePass.height);
            pass.material.uniforms.setValue(UNIFORM_NAME_PREV_TEXTURE, prevPass.renderTarget.$getTexture());
            pass.material.uniforms.setValue(UNIFORM_NAME_DOWN_SAMPLE_TEXTURE, downSamplePass.renderTarget.$getTexture());
            pass.material.uniforms.setValue(UNIFORM_NAME_STRETCH, this.parameters.stretch);
            pass.render({
                gpu,
                camera,
                renderer,
                prevRenderTarget: null,
                isLastPass: false,
                targetCamera,
                gBufferRenderTargets,
                time,
            });
        });

        //
        // composite
        //

        this.compositePass.material.uniforms.setValue(
            UNIFORM_NAME_STREAK_TEXTURE,
            // correct
            this.upSamplePasses[this.upSamplePasses.length - 1].pass.renderTarget.$getTexture()
            // for debug
            // this.prefilterPass.renderTarget.$getTexture()
            // this.upSamplePasses[2].pass.renderTarget.$getTexture()
        );
        this.compositePass.material.uniforms.setValue(UNIFORM_NAME_COLOR, this.parameters.color);
        this.compositePass.material.uniforms.setValue(UNIFORM_NAME_INTENSITY, this.parameters.intensity);
        this.compositePass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: null,
            prevRenderTarget,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    }
}
