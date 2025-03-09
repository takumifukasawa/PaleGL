import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
// import { gaussianBlurFragmentShader } from '@/PaleGL/shaders/gaussianBlurShader';
import {
    createRenderTarget,
    RenderTarget,
    setRenderTargetSize,
} from '@/PaleGL/core/renderTarget.ts';
// import {CopyPass} from "./CopyPass";
import {
    createMaterial,
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue,
    startMaterial
} from '@/PaleGL/materials/material';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { Renderer } from '@/PaleGL/core/Renderer';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import extractBrightnessFragmentShader from '@/PaleGL/shaders/extract-brightness-fragment.glsl';
import bloomCompositeFragmentShader from '@/PaleGL/shaders/bloom-composite-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
    // IPostProcessPassParameters
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';

const BLUR_PIXEL_NUM = 7;

const UNIFORM_NAME_BLUR_WEIGHTS = 'uBlurWeights';
const UNIFORM_NAME_IS_HORIZONTAL = 'uIsHorizontal';
const UNIFORM_NAME_BLUR_4_TEXTURE = 'uBlur4Texture';
const UNIFORM_NAME_BLUR_8_TEXTURE = 'uBlur8Texture';
const UNIFORM_NAME_BLUR_16_TEXTURE = 'uBlur16Texture';
const UNIFORM_NAME_BLUR_32_TEXTURE = 'uBlur32Texture';
const UNIFORM_NAME_BLUR_64_TEXTURE = 'uBlur64Texture';
const UNIFORM_NAME_TONE = 'uTone';
const UNIFORM_NAME_BLOOM_AMOUNT = 'uBloomAmount';
const UNIFORM_NAME_THRESHOLD = 'uThreshold';
const UNIFORM_NAME_EXTRACT_TEXTURE = 'uExtractTexture';

type BloomPassParametersBase = {
    threshold: number;
    tone: number;
    bloomAmount: number;
};

type BloomPassParametersProperties = PostProcessPassParametersBase & BloomPassParametersBase;

export type BloomPassParameters =
    // BloomPassParametersProperties &
    BloomPassParametersProperties;
// Required<IPostProcessPassParameters<BloomPassParameters>>; // override

type BloomPassParametersArgs = Partial<BloomPassParameters>;

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

export function generateDefaultBloomPassParameters({
    enabled,
    threshold,
    tone,
    bloomAmount,
}: BloomPassParametersArgs = {}): BloomPassParameters {
    const param = {
        enabled: enabled ?? true,
        threshold: threshold ?? 1.534,
        tone: tone ?? 0.46,
        bloomAmount: bloomAmount ?? 0.26,
    } as BloomPassParameters;
    return param;
}

// ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
// TODO: mipmap使う方法に変えてみる
export class BloomPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'BloomPass';
    type: PostProcessPassType = PostProcessPassType.Bloom;

    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    _extractBrightnessPass: FragmentPass;

    parameters: BloomPassParameters;

    // enabled: boolean = true;
    // threshold: number = 1.534;
    // tone: number = 0.46;
    // bloomAmount: number = 0.26;

    // tmp
    // private renderTargetExtractBrightness: RenderTarget;
    _renderTargetBlurMip4_Horizontal: RenderTarget;
    _renderTargetBlurMip4_Vertical: RenderTarget;
    _renderTargetBlurMip8_Horizontal: RenderTarget;
    _renderTargetBlurMip8_Vertical: RenderTarget;
    _renderTargetBlurMip16_Horizontal: RenderTarget;
    _renderTargetBlurMip16_Vertical: RenderTarget;
    _renderTargetBlurMip32_Horizontal: RenderTarget;
    _renderTargetBlurMip32_Vertical: RenderTarget;
    _renderTargetBlurMip64_Horizontal: RenderTarget;
    _renderTargetBlurMip64_Vertical: RenderTarget;

    get renderTargetBlurMip4() {
        return this._renderTargetBlurMip4_Vertical;
    }

    get renderTargetBlurMip8() {
        return this._renderTargetBlurMip8_Vertical;
    }

    get renderTargetBlurMip16() {
        return this._renderTargetBlurMip16_Vertical;
    }

    get renderTargetBlurMip32() {
        return this._renderTargetBlurMip32_Vertical;
    }

    get renderTargetBlurMip64() {
        return this._renderTargetBlurMip64_Vertical;
    }

    // tmp
    // private horizontalBlurPass: FragmentPass;
    // private verticalBlurPass: FragmentPass;

    // #lastPass;
    _compositePass: FragmentPass;
    _geometry: PlaneGeometry;
    _horizontalBlurMaterial: Material;
    _verticalBlurMaterial: Material;

    get renderTarget() {
        return this._compositePass.renderTarget;
    }

    constructor({ gpu, parameters }: { gpu: GPU; parameters?: BloomPassParametersArgs }) {
        this.parameters = generateDefaultBloomPassParameters(parameters);

        // NOTE: _geometryは親から渡して使いまわしてもよい
        this._geometry = createPlaneGeometry({ gpu });

        // tmp
        this._renderTargetBlurMip4_Horizontal = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip4_Vertical = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip8_Horizontal = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip8_Vertical = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip16_Horizontal = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip16_Vertical = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip32_Horizontal = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip32_Vertical = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip64_Horizontal = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });
        this._renderTargetBlurMip64_Vertical = createRenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
        });

        this._extractBrightnessPass = new FragmentPass({
            gpu,
            fragmentShader: extractBrightnessFragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_THRESHOLD,
                    type: UniformTypes.Float,
                    value: this.parameters.threshold,
                },
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this._extractBrightnessPass.materials);

        const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, 0.92);

        this._horizontalBlurMaterial = createMaterial({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_WEIGHTS,
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: UNIFORM_NAME_IS_HORIZONTAL,
                    type: UniformTypes.Float,
                    value: 1,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this._horizontalBlurMaterial);

        this._verticalBlurMaterial = createMaterial({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_WEIGHTS,
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: UNIFORM_NAME_IS_HORIZONTAL,
                    type: UniformTypes.Float,
                    value: 0,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this._verticalBlurMaterial);

        this._compositePass = new FragmentPass({
            gpu,
            fragmentShader: bloomCompositeFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_4_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_8_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_16_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_32_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_64_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_TONE,
                    type: UniformTypes.Float,
                    value: this.parameters.tone,
                },
                {
                    name: UNIFORM_NAME_BLOOM_AMOUNT,
                    type: UniformTypes.Float,
                    value: this.parameters.bloomAmount,
                },
                {
                    name: UNIFORM_NAME_EXTRACT_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this._compositePass.materials);
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this._extractBrightnessPass.setSize(width, height);

        setRenderTargetSize(this._renderTargetBlurMip4_Horizontal, width / 4, height / 4);
        setRenderTargetSize(this._renderTargetBlurMip4_Vertical, width / 4, height / 4);
        setRenderTargetSize(this._renderTargetBlurMip8_Horizontal, width / 8, height / 8);
        setRenderTargetSize(this._renderTargetBlurMip8_Vertical, width / 8, height / 8);
        setRenderTargetSize(this._renderTargetBlurMip16_Horizontal, width / 16, height / 16);
        setRenderTargetSize(this._renderTargetBlurMip16_Vertical, width / 16, height / 16);
        setRenderTargetSize(this._renderTargetBlurMip32_Horizontal, width / 32, height / 32);
        setRenderTargetSize(this._renderTargetBlurMip32_Vertical, width / 32, height / 32);
        setRenderTargetSize(this._renderTargetBlurMip64_Horizontal, width / 64, height / 64);
        setRenderTargetSize(this._renderTargetBlurMip64_Vertical, width / 64, height / 64);
        
        console.log(this._renderTargetBlurMip4_Horizontal);

        this._compositePass.setSize(width, height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    update() {}

    $renderBlur(
        renderer: Renderer,
        horizontalRenderTarget: RenderTarget,
        verticalRenderTarget: RenderTarget,
        beforeRenderTarget: RenderTarget,
        downSize: number
    ) {
        const w = this.width / downSize;
        const h = this.height / downSize;

        renderer.setRenderTarget(horizontalRenderTarget, true);
        setMaterialUniformValue(
            this._horizontalBlurMaterial,
            UniformNames.SrcTexture,
            beforeRenderTarget.texture
        );
        setMaterialUniformValue(this._horizontalBlurMaterial, UniformNames.TargetWidth, w);
        setMaterialUniformValue(this._horizontalBlurMaterial, UniformNames.TargetHeight, w);
        renderer.renderMesh(this._geometry, this._horizontalBlurMaterial);

        renderer.setRenderTarget(verticalRenderTarget, true);
        // renderer.clearColor(0, 0, 0, 1);
        setMaterialUniformValue(
            this._verticalBlurMaterial,
            UniformNames.SrcTexture,
            horizontalRenderTarget.texture
        );
        setMaterialUniformValue(this._verticalBlurMaterial, UniformNames.TargetWidth, w);
        setMaterialUniformValue(this._verticalBlurMaterial, UniformNames.TargetHeight, h);
        renderer.renderMesh(this._geometry, this._verticalBlurMaterial);
    }

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
        // // 一回だけ呼びたい
        // this._geometry.start();
        // // ppの場合はいらない気がする
        // // this.mesh.updateTransform();

        if (!isCompiledMaterialShader(this._horizontalBlurMaterial)) {
            startMaterial(this._horizontalBlurMaterial, { gpu, attributeDescriptors: getGeometryAttributeDescriptors(this._geometry) });
        }
        if (!isCompiledMaterialShader(this._verticalBlurMaterial)) {
            startMaterial(this._verticalBlurMaterial, { gpu, attributeDescriptors: getGeometryAttributeDescriptors(this._geometry) });
        }

        this.assignParameters();

        // this._extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        this._extractBrightnessPass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget,
            isLastPass: false,
            targetCamera,
            time,
        });

        // 1 / 4
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip4_Horizontal,
            this._renderTargetBlurMip4_Vertical,
            this._extractBrightnessPass.renderTarget,
            4
        );
        // 1 / 8
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip8_Horizontal,
            this._renderTargetBlurMip8_Vertical,
            this._renderTargetBlurMip4_Vertical,
            8
        );
        // 1 / 16
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip16_Horizontal,
            this._renderTargetBlurMip16_Vertical,
            this._renderTargetBlurMip8_Vertical,
            16
        );
        // 1 / 32
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip32_Horizontal,
            this._renderTargetBlurMip32_Vertical,
            this._renderTargetBlurMip16_Vertical,
            32
        );
        // 1 / 64
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip64_Horizontal,
            this._renderTargetBlurMip64_Vertical,
            this._renderTargetBlurMip32_Vertical,
            64
        );

        if (prevRenderTarget) {
            setMaterialUniformValue(
                this._compositePass.material,
                UniformNames.SrcTexture,
                prevRenderTarget.texture
            );
        } else {
            console.error('invalid prev render target');
        }
        // this._compositePass.material.uniforms.setValue('uBrightnessTexture', this._extractBrightnessPass.renderTarget.$getTexture());
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_BLUR_4_TEXTURE,
            this._renderTargetBlurMip4_Vertical.texture
        );
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_BLUR_8_TEXTURE,
            this._renderTargetBlurMip8_Vertical.texture
        );
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_BLUR_16_TEXTURE,
            this._renderTargetBlurMip16_Vertical.texture
        );
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_BLUR_32_TEXTURE,
            this._renderTargetBlurMip32_Vertical.texture
        );
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_BLUR_64_TEXTURE,
            this._renderTargetBlurMip64_Vertical.texture
        );
        setMaterialUniformValue(
            this._compositePass.material,
            UNIFORM_NAME_EXTRACT_TEXTURE,
            this._extractBrightnessPass.renderTarget.texture
        );

        // this._compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
        // this._compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);

        this._compositePass.render({
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

    updateParameters(parameters: BloomPassParameters) {
        this.parameters = overrideBloomPassParameters(this.parameters, parameters);
        this.assignParameters();
    }

    assignParameters() {
        setMaterialUniformValue(
            this._extractBrightnessPass.material,
            UNIFORM_NAME_THRESHOLD,
            this.parameters.threshold
        );
        setMaterialUniformValue(this._compositePass.material, UNIFORM_NAME_TONE, this.parameters.tone);
        setMaterialUniformValue(this._compositePass.material, UNIFORM_NAME_BLOOM_AMOUNT, this.parameters.bloomAmount);
    }
}
