import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
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
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import {maton} from "@/PaleGL/utilities/maton.ts";

// const BLUR_PIXEL_NUM = 7;

// ref:
// https://github.com/keijiro/KinoStreak/

export class StreakPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'StreakPass';
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

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
    private prefilterPass: FragmentPass;
    private downSamplePasses: { pass: FragmentPass; downScale: number }[] = [];
    private upSamplePasses: { pass: FragmentPass, downSamplePass: FragmentPass }[] = [];
    private compositePass: FragmentPass;
    // private downSampleMaterial: Material;

    private geometry: PlaneGeometry;
    // horizontalBlurMaterial: Material;
    // verticalBlurMaterial: Material;

    threshold: number = 0;
    tone: number = 1;
    bloomAmount: number = 0.8;

    halfHeight: number = 0;

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    constructor({
        gpu,
        threshold = 0,
        tone = 1,
        bloomAmount = 1,
    }: {
        gpu: GPU;
        threshold?: number;
        tone?: number;
        bloomAmount?: number;
    }) {
        // super();

        // this.gpu = gpu;

        this.threshold = threshold;
        this.tone = tone;
        this.bloomAmount = bloomAmount;

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
                    value: this.threshold,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.prefilterPass.materials);

        this.downSamplePasses = [2, 4, 8, 16, 32].map((downScale) => {
            const pass = new FragmentPass({
                name: `DownSampleMip${downScale}Pass`,
                gpu,
                fragmentShader: streakDownSampleFragmentShader,
                uniforms: [
                    {
                        name: 'uPrefilterTexture',
                        type: UniformTypes.Texture,
                        value: null,
                    },
                    {
                        name: UniformNames.TexelSize,
                        type: UniformTypes.Vector2,
                        value: Vector2.zero,
                    },
                    ...PostProcessPassBase.commonUniforms,
                ],
            });
            this.materials.push(...pass.materials);
            return {
                pass,
                downScale,
            };
        });
        this.downSamplePasses.forEach(({ pass }) => {
            this.materials.push(...pass.materials);
        });
        
        this.upSamplePasses = maton.range(5).map((_, index) => {
            const pass = new FragmentPass({
                name: `UpSampleMip${index}Pass`,
                gpu,
                fragmentShader: streakUpSampleFragmentShader,
                uniforms: [
                    {
                        name: 'uDownSampleTexture',
                        type: UniformTypes.Texture,
                        value: null,
                    },
                    ...PostProcessPassBase.commonUniforms,
                ],
            });
            this.materials.push(...pass.materials);
            return {
                pass,
                downSamplePass: this.downSamplePasses[index].pass
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
                    name: 'uPrefilterTexture',
                    type: UniformTypes.Texture,
                    value: null,
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

        this.prefilterPass.material.uniforms.setValue('uThreshold', this.threshold);
        this.prefilterPass.material.uniforms.setValue('uTexelSize', new Vector2(1 / this.width, 1 / this.height));
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

        // const renderDownSample = (pass: FragmentPass, downScale: number) => {
        //     // const tmpRenderTarget = renderer.renderTarget;
        //     // const tmpClearColorDirtyFlag = renderer.clearColorDirtyFlag;
        //     // renderer.setRenderTarget(this.renderTargetDownSampleMip2, true);
        //     // this.downSampleMaterial.uniforms.setValue(UniformNames.SrcTexture, this.prefilterPass.renderTarget.texture);
        //     // this.downSampleMaterial.uniforms.setValue(UniformNames.TexelSize, new Vector2(1 / (this.width / 2), 1 / this.halfHeight));
        //     // renderer.renderMesh(this.geometry, this.downSampleMaterial);
        //     // renderer.setRenderTarget(tmpRenderTarget, tmpClearColorDirtyFlag);
        // };

        this.downSamplePasses.forEach(({ pass, downScale }) => {
            const width = Math.floor(this.width / downScale);
            pass.setSize(width, this.halfHeight);
            pass.material.uniforms.setValue('uPrefilterTexture', this.prefilterPass.renderTarget.texture);
            pass.material.uniforms.setValue(
                UniformNames.TexelSize,
                new Vector2(1 / width, 1 / this.halfHeight)
            );
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

        this.upSamplePasses.forEach(({ pass, downSamplePass }) => {
            pass.setSize(downSamplePass.width, downSamplePass.height);
            pass.material.uniforms.setValue('uDownSampleTexture', downSamplePass.renderTarget.texture);
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

        // this.compositePass.material.uniforms.setValue('uPrefilterTexture', this.prefilterPass.renderTarget.texture);
        this.compositePass.material.uniforms.setValue(
            'uPrefilterTexture',
            // this.downSamplePasses[0].pass.renderTarget.texture
            this.upSamplePasses[0].pass.renderTarget.texture
        );
        this.compositePass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: null,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
        return;

        // if (!this.horizontalBlurMaterial.isCompiledShader) {
        //     this.horizontalBlurMaterial.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        // }
        // if (!this.verticalBlurMaterial.isCompiledShader) {
        //     this.verticalBlurMaterial.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        // }

        // this.extractBrightnessPass.material.uniforms.setValue('uThreshold', this.threshold);
        // this.extractBrightnessPass.render({
        //     gpu,
        //     camera,
        //     renderer,
        //     prevRenderTarget,
        //     isLastPass: false,
        //     targetCamera,
        //     time,
        // });

        // const renderBlur = (
        //     horizontalRenderTarget: RenderTarget,
        //     verticalRenderTarget: RenderTarget,
        //     downSize: number
        // ) => {
        //     const w = this.width / downSize;
        //     const h = this.height / downSize;

        //     renderer.setRenderTarget(horizontalRenderTarget, true);
        //     // renderer.clearColor(0, 0, 0, 1);
        //     this.horizontalBlurMaterial.uniforms.setValue(
        //         UniformNames.SrcTexture,
        //         this.extractBrightnessPass.renderTarget.texture
        //     );
        //     this.horizontalBlurMaterial.uniforms.setValue('uTargetWidth', w);
        //     this.horizontalBlurMaterial.uniforms.setValue('uTargetHeight', w);
        //     renderer.renderMesh(this.geometry, this.horizontalBlurMaterial);

        //     renderer.setRenderTarget(verticalRenderTarget, true);
        //     // renderer.clearColor(0, 0, 0, 1);
        //     this.verticalBlurMaterial.uniforms.setValue(UniformNames.SrcTexture, horizontalRenderTarget.texture);
        //     this.verticalBlurMaterial.uniforms.setValue('uTargetWidth', w);
        //     this.verticalBlurMaterial.uniforms.setValue('uTargetHeight', h);
        //     renderer.renderMesh(this.geometry, this.verticalBlurMaterial);
        // };

        // // 1 / 4
        // renderBlur(this.renderTargetBlurMip4_Horizontal, this.renderTargetBlurMip4_Vertical, 4);
        // // 1 / 8
        // renderBlur(this.renderTargetBlurMip8_Horizontal, this.renderTargetBlurMip8_Vertical, 8);
        // // 1 / 16
        // renderBlur(this.renderTargetBlurMip16_Horizontal, this.renderTargetBlurMip16_Vertical, 16);
        // // 1 / 32
        // renderBlur(this.renderTargetBlurMip32_Horizontal, this.renderTargetBlurMip32_Vertical, 32);
        // // 1 / 64
        // renderBlur(this.renderTargetBlurMip64_Horizontal, this.renderTargetBlurMip64_Vertical, 64);

        // if (prevRenderTarget) {
        //     this.compositePass.material.uniforms.setValue(UniformNames.SrcTexture, prevRenderTarget.texture);
        // } else {
        //     console.error('invalid prev render target');
        // }
        // // this.compositePass.material.uniforms.setValue('uBrightnessTexture', this.extractBrightnessPass.renderTarget.texture);
        // this.compositePass.material.uniforms.setValue('uBlur4Texture', this.renderTargetBlurMip4_Vertical.texture);
        // this.compositePass.material.uniforms.setValue('uBlur8Texture', this.renderTargetBlurMip8_Vertical.texture);
        // this.compositePass.material.uniforms.setValue('uBlur16Texture', this.renderTargetBlurMip16_Vertical.texture);
        // this.compositePass.material.uniforms.setValue('uBlur32Texture', this.renderTargetBlurMip32_Vertical.texture);
        // this.compositePass.material.uniforms.setValue('uBlur64Texture', this.renderTargetBlurMip64_Vertical.texture);
        // this.compositePass.material.uniforms.setValue(
        //     'uExtractTexture',
        //     this.extractBrightnessPass.renderTarget.texture
        // );
        // this.compositePass.material.uniforms.setValue('uTone', this.tone);
        // this.compositePass.material.uniforms.setValue('uBloomAmount', this.bloomAmount);

        // this.compositePass.render({
        //     gpu,
        //     camera,
        //     renderer,
        //     prevRenderTarget: null,
        //     isLastPass,
        //     targetCamera,
        //     gBufferRenderTargets,
        //     time,
        // });
    }
}
