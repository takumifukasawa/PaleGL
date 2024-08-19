import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
// import { gaussianBlurFragmentShader } from '@/PaleGL/shaders/gaussianBlurShader';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
// import {CopyPass} from "./CopyPass";
import { Material } from '@/PaleGL/materials/Material';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import extractBrightnessFragmentShader from '@/PaleGL/shaders/extract-brightness-fragment.glsl';
import bloomCompositeFragmentShader from '@/PaleGL/shaders/bloom-composite-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';

const BLUR_PIXEL_NUM = 7;

type BloomPassParametersBase = {
    threshold: number;
    tone: number;
    bloomAmount: number;
};

export type BloomPassParameters = PostProcessPassParametersBase & BloomPassParametersBase;

type BloomPassParametersArgs = Partial<BloomPassParameters>;

export function generateDefaultBloomPassParameters({
    enabled,
    threshold,
    tone,
    bloomAmount,
}: BloomPassParametersArgs = {}): BloomPassParameters {
    return {
        enabled: enabled ?? true,
        threshold: threshold ?? 1.534,
        tone: tone ?? 0.46,
        bloomAmount: bloomAmount ?? 0.26,
    };
}

export function overrideBloomPassParameters(
    base: BloomPassParameters,
    override: BloomPassParametersArgs
): BloomPassParameters {
    return {
        ...base,
        enabled: override.enabled ?? base.enabled,
        threshold: override.threshold ?? base.threshold,
        tone: override.tone ?? base.tone,
        bloomAmount: override.bloomAmount ?? base.bloomAmount,
    };
}

// ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
// TODO: mipmap使う方法に変えてみる
// export class BloomPass extends AbstractPostProcessPass {
export class BloomPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'BloomPass';
    type: PostProcessPassType = PostProcessPassType.Bloom;
    
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    private extractBrightnessPass;

    parameters: BloomPassParameters;

    // enabled: boolean = true;
    // threshold: number = 1.534;
    // tone: number = 0.46;
    // bloomAmount: number = 0.26;

    // tmp
    // private renderTargetExtractBrightness: RenderTarget;
    private renderTargetBlurMip4_Horizontal: RenderTarget;
    private renderTargetBlurMip4_Vertical: RenderTarget;
    private renderTargetBlurMip8_Horizontal: RenderTarget;
    private renderTargetBlurMip8_Vertical: RenderTarget;
    private renderTargetBlurMip16_Horizontal: RenderTarget;
    private renderTargetBlurMip16_Vertical: RenderTarget;
    private renderTargetBlurMip32_Horizontal: RenderTarget;
    private renderTargetBlurMip32_Vertical: RenderTarget;
    private renderTargetBlurMip64_Horizontal: RenderTarget;
    private renderTargetBlurMip64_Vertical: RenderTarget;

    get renderTargetBlurMip4() {
        return this.renderTargetBlurMip4_Vertical;
    }

    get renderTargetBlurMip8() {
        return this.renderTargetBlurMip8_Vertical;
    }

    get renderTargetBlurMip16() {
        return this.renderTargetBlurMip16_Vertical;
    }

    get renderTargetBlurMip32() {
        return this.renderTargetBlurMip32_Vertical;
    }

    get renderTargetBlurMip64() {
        return this.renderTargetBlurMip64_Vertical;
    }

    // tmp
    // private horizontalBlurPass: FragmentPass;
    // private verticalBlurPass: FragmentPass;

    // #lastPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
    horizontalBlurMaterial: Material;
    verticalBlurMaterial: Material;

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    constructor({
        gpu,
        parameters, // threshold = 0,
    } // tone = 1,
    // bloomAmount = 1,
    : {
        gpu: GPU;
        parameters?: BloomPassParametersArgs;
        // threshold?: number;
        // tone?: number;
        // bloomAmount?: number;
    }) {
        // this.threshold = threshold;
        // this.tone = tone;
        // this.bloomAmount = bloomAmount;

        this.parameters = generateDefaultBloomPassParameters(parameters);

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });

        // tmp
        // this.renderTargetExtractBrightness = new RenderTarget({gpu});
        this.renderTargetBlurMip4_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip4_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip8_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip8_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip16_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip16_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip32_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip32_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip64_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this.renderTargetBlurMip64_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });

        // const copyPass = new CopyPass({ gpu });
        // this.#passes.push(copyPass);

        this.extractBrightnessPass = new FragmentPass({
            gpu,
            fragmentShader: extractBrightnessFragmentShader,
            uniforms: [
                {
                    name: 'uThreshold',
                    type: UniformTypes.Float,
                    value: this.parameters.threshold,
                },
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.extractBrightnessPass.materials);

        // const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, Math.floor(BLUR_PIXEL_NUM / 2));
        const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, 0.92);
        console.log('blurWeights', blurWeights);

        this.horizontalBlurMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlurWeights',
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: 'uIsHorizontal',
                    type: UniformTypes.Float,
                    value: 1,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this.horizontalBlurMaterial);

        this.verticalBlurMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlurWeights',
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: 'uIsHorizontal',
                    type: UniformTypes.Float,
                    value: 0,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this.verticalBlurMaterial);

        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: bloomCompositeFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                // uBrightnessTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
                {
                    name: 'uBlur4Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur8Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur16Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur32Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uTone',
                    type: UniformTypes.Float,
                    value: this.parameters.tone,
                },
                {
                    name: 'uBloomAmount',
                    type: UniformTypes.Float,
                    value: this.parameters.bloomAmount,
                },
                {
                    name: 'uExtractTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.compositePass.materials);
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.extractBrightnessPass.setSize(width, height);

        this.renderTargetBlurMip4_Horizontal.setSize(this.width / 4, this.height / 4);
        this.renderTargetBlurMip4_Vertical.setSize(this.width / 4, this.height / 4);
        this.renderTargetBlurMip8_Horizontal.setSize(this.width / 8, this.height / 8);
        this.renderTargetBlurMip8_Vertical.setSize(this.width / 8, this.height / 8);
        this.renderTargetBlurMip16_Horizontal.setSize(this.width / 16, this.height / 16);
        this.renderTargetBlurMip16_Vertical.setSize(this.width / 16, this.height / 16);
        this.renderTargetBlurMip32_Horizontal.setSize(this.width / 32, this.height / 32);
        this.renderTargetBlurMip32_Vertical.setSize(this.width / 32, this.height / 32);
        this.renderTargetBlurMip64_Horizontal.setSize(this.width / 64, this.height / 64);
        this.renderTargetBlurMip64_Vertical.setSize(this.width / 64, this.height / 64);

        this.compositePass.setSize(width, height);
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

        if (!this.horizontalBlurMaterial.isCompiledShader) {
            this.horizontalBlurMaterial.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        }
        if (!this.verticalBlurMaterial.isCompiledShader) {
            this.verticalBlurMaterial.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        }

        this.assignParameters();

        // this.extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        this.extractBrightnessPass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget,
            isLastPass: false,
            targetCamera,
            time,
        });

        const renderBlur = (
            horizontalRenderTarget: RenderTarget,
            verticalRenderTarget: RenderTarget,
            beforeRenderTarget: RenderTarget,
            downSize: number
        ) => {
            const w = this.width / downSize;
            const h = this.height / downSize;

            renderer.setRenderTarget(horizontalRenderTarget, true);
            // renderer.clearColor(0, 0, 0, 1);
            this.horizontalBlurMaterial.uniforms.setValue(
                UniformNames.SrcTexture,
                // this.extractBrightnessPass.renderTarget.texture
                beforeRenderTarget.texture
            );
            this.horizontalBlurMaterial.uniforms.setValue('uTargetWidth', w);
            this.horizontalBlurMaterial.uniforms.setValue('uTargetHeight', w);
            renderer.renderMesh(this.geometry, this.horizontalBlurMaterial);

            renderer.setRenderTarget(verticalRenderTarget, true);
            // renderer.clearColor(0, 0, 0, 1);
            this.verticalBlurMaterial.uniforms.setValue(UniformNames.SrcTexture, horizontalRenderTarget.texture);
            this.verticalBlurMaterial.uniforms.setValue('uTargetWidth', w);
            this.verticalBlurMaterial.uniforms.setValue('uTargetHeight', h);
            renderer.renderMesh(this.geometry, this.verticalBlurMaterial);
        };

        // 1 / 4
        renderBlur(
            this.renderTargetBlurMip4_Horizontal,
            this.renderTargetBlurMip4_Vertical,
            this.extractBrightnessPass.renderTarget,
            4
        );
        // 1 / 8
        renderBlur(
            this.renderTargetBlurMip8_Horizontal,
            this.renderTargetBlurMip8_Vertical,
            this.renderTargetBlurMip4_Vertical,
            8
        );
        // 1 / 16
        renderBlur(
            this.renderTargetBlurMip16_Horizontal,
            this.renderTargetBlurMip16_Vertical,
            this.renderTargetBlurMip8_Vertical,
            16
        );
        // 1 / 32
        renderBlur(
            this.renderTargetBlurMip32_Horizontal,
            this.renderTargetBlurMip32_Vertical,
            this.renderTargetBlurMip16_Vertical,
            32
        );
        // 1 / 64
        renderBlur(
            this.renderTargetBlurMip64_Horizontal,
            this.renderTargetBlurMip64_Vertical,
            this.renderTargetBlurMip32_Vertical,
            64
        );

        if (prevRenderTarget) {
            this.compositePass.material.uniforms.setValue(UniformNames.SrcTexture, prevRenderTarget.texture);
        } else {
            console.error('invalid prev render target');
        }
        // this.compositePass.material.uniforms.setValue('uBrightnessTexture', this.extractBrightnessPass.renderTarget.texture);
        this.compositePass.material.uniforms.setValue('uBlur4Texture', this.renderTargetBlurMip4_Vertical.texture);
        this.compositePass.material.uniforms.setValue('uBlur8Texture', this.renderTargetBlurMip8_Vertical.texture);
        this.compositePass.material.uniforms.setValue('uBlur16Texture', this.renderTargetBlurMip16_Vertical.texture);
        this.compositePass.material.uniforms.setValue('uBlur32Texture', this.renderTargetBlurMip32_Vertical.texture);
        this.compositePass.material.uniforms.setValue('uBlur64Texture', this.renderTargetBlurMip64_Vertical.texture);
        this.compositePass.material.uniforms.setValue(
            'uExtractTexture',
            this.extractBrightnessPass.renderTarget.texture
        );
        
        // this.compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
        // this.compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);

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
    }

    updateParameters(parameters: BloomPassParameters | null) {
        if (!parameters) {
            return;
        }
        this.parameters = overrideBloomPassParameters(this.parameters, parameters);
        this.assignParameters();
    }
    
    assignParameters() {
        this.extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        
        this.compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
        this.compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);
    }
}
