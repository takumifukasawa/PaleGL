import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
// import { gaussianBlurFragmentShader } from '@/PaleGL/shaders/gaussianBlurShader';
import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
// import {CopyPass} from "./CopyPass";
import {
    createMaterial,
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue,
    startMaterial,
} from '@/PaleGL/materials/material';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { Renderer, renderMesh, setRendererRenderTarget } from '@/PaleGL/core/renderer.ts';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import extractBrightnessFragmentShader from '@/PaleGL/shaders/extract-brightness-fragment.glsl';
import bloomCompositeFragmentShader from '@/PaleGL/shaders/bloom-composite-fragment.glsl';
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';
import {
    createPostProcessPassBase,
    getPostProcessBaseVertexShader,
    getPostProcessCommonUniforms,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    renderPostProcessPass,
    RenderPostProcessPassBehaviour,
    setPostProcessPassSize,
    SetPostProcessPassSizeBehaviour,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

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

type BloomPassParameters = {
    threshold: number;
    tone: number;
    bloomAmount: number;
};

export type BloomPass = PostProcessPassBase &
    BloomPassParameters & {
        extractBrightnessPass: FragmentPass;
        renderTargetBlurMip4_Horizontal: RenderTarget;
        renderTargetBlurMip4_Vertical: RenderTarget;
        renderTargetBlurMip8_Horizontal: RenderTarget;
        renderTargetBlurMip8_Vertical: RenderTarget;
        renderTargetBlurMip16_Horizontal: RenderTarget;
        renderTargetBlurMip16_Vertical: RenderTarget;
        renderTargetBlurMip32_Horizontal: RenderTarget;
        renderTargetBlurMip32_Vertical: RenderTarget;
        renderTargetBlurMip64_Horizontal: RenderTarget;
        renderTargetBlurMip64_Vertical: RenderTarget;
        compositePass: FragmentPass;
        horizontalBlurMaterial: Material;
        verticalBlurMaterial: Material;
    };

type BloomPassArgs = PostProcessPassParametersBaseArgs & Partial<BloomPassParameters>;

// ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
// TODO: mipmap使う方法に変えてみる
// export function createBloomPass(args: { gpu: Gpu; parameters?: BloomPassParametersArgs }): BloomPass {
export function createBloomPass(args: BloomPassArgs): BloomPass {
    const { gpu, enabled } = args;

    const name = 'BloomPass';
    const type = PostProcessPassType.Bloom;

    const threshold = args.threshold ?? 1.534;
    const tone = args.tone ?? 0.46;
    const bloomAmount = args.bloomAmount ?? 0.26;

    const materials: Material[] = [];

    // const parameters = generateDefaultBloomPassParameters(args.parameters);

    // NOTE: _geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    const renderTargetBlurMip4_Horizontal = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip4_Vertical = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip8_Horizontal = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip8_Vertical = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip16_Horizontal = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip16_Vertical = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip32_Horizontal = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip32_Vertical = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip64_Horizontal = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });
    const renderTargetBlurMip64_Vertical = createRenderTarget({
        gpu,
        type: RenderTargetTypes.R11F_G11F_B10F,
    });

    const extractBrightnessPass = createFragmentPass({
        gpu,
        fragmentShader: extractBrightnessFragmentShader,
        uniforms: [
            {
                name: UNIFORM_NAME_THRESHOLD,
                type: UniformTypes.Float,
                value: threshold,
            },
        ],
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
    });
    materials.push(...extractBrightnessPass.materials);

    const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, 0.92);

    const horizontalBlurMaterial = createMaterial({
        vertexShader: getPostProcessBaseVertexShader(),
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
            ...getPostProcessCommonUniforms(),
        ],
    });
    materials.push(horizontalBlurMaterial);

    const verticalBlurMaterial = createMaterial({
        vertexShader: getPostProcessBaseVertexShader(),
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
            ...getPostProcessCommonUniforms(),
        ],
    });
    materials.push(verticalBlurMaterial);

    const compositePass = createFragmentPass({
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
                value: tone,
            },
            {
                name: UNIFORM_NAME_BLOOM_AMOUNT,
                type: UniformTypes.Float,
                value: bloomAmount,
            },
            {
                name: UNIFORM_NAME_EXTRACT_TEXTURE,
                type: UniformTypes.Texture,
                value: null,
            },
            ...getPostProcessCommonUniforms(),
        ],
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
    });
    materials.push(...compositePass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name,
            type,
            // parameters,
            geometry,
            materials,
            enabled,
        }),
        extractBrightnessPass,
        renderTargetBlurMip4_Horizontal,
        renderTargetBlurMip4_Vertical,
        renderTargetBlurMip8_Horizontal,
        renderTargetBlurMip8_Vertical,
        renderTargetBlurMip16_Horizontal,
        renderTargetBlurMip16_Vertical,
        renderTargetBlurMip32_Horizontal,
        renderTargetBlurMip32_Vertical,
        renderTargetBlurMip64_Horizontal,
        renderTargetBlurMip64_Vertical,
        compositePass,
        horizontalBlurMaterial,
        verticalBlurMaterial,
        // parameters
        tone,
        threshold,
        bloomAmount,
    };
}

export function getBloomPassRenderTarget(pass: PostProcessPassBase) {
    return (pass as BloomPass).compositePass.renderTarget;
}

export const setBloomPassSize: SetPostProcessPassSizeBehaviour = (postProcessPass, width, height) => {
    const bloomPass = postProcessPass as BloomPass;

    bloomPass.width = width;
    bloomPass.height = height;

    setPostProcessPassSize(bloomPass.extractBrightnessPass, width, height);

    setRenderTargetSize(bloomPass.renderTargetBlurMip4_Horizontal, width / 4, height / 4);
    setRenderTargetSize(bloomPass.renderTargetBlurMip4_Vertical, width / 4, height / 4);
    setRenderTargetSize(bloomPass.renderTargetBlurMip8_Horizontal, width / 8, height / 8);
    setRenderTargetSize(bloomPass.renderTargetBlurMip8_Vertical, width / 8, height / 8);
    setRenderTargetSize(bloomPass.renderTargetBlurMip16_Horizontal, width / 16, height / 16);
    setRenderTargetSize(bloomPass.renderTargetBlurMip16_Vertical, width / 16, height / 16);
    setRenderTargetSize(bloomPass.renderTargetBlurMip32_Horizontal, width / 32, height / 32);
    setRenderTargetSize(bloomPass.renderTargetBlurMip32_Vertical, width / 32, height / 32);
    setRenderTargetSize(bloomPass.renderTargetBlurMip64_Horizontal, width / 64, height / 64);
    setRenderTargetSize(bloomPass.renderTargetBlurMip64_Vertical, width / 64, height / 64);

    setPostProcessPassSize(bloomPass.compositePass, width, height);
};

function renderBlur(
    bloomPass: BloomPass,
    renderer: Renderer,
    horizontalRenderTarget: RenderTarget,
    verticalRenderTarget: RenderTarget,
    beforeRenderTarget: RenderTarget,
    downSize: number
) {
    const w = bloomPass.width / downSize;
    const h = bloomPass.height / downSize;

    setRendererRenderTarget(renderer, horizontalRenderTarget, true);
    setMaterialUniformValue(bloomPass.horizontalBlurMaterial, UniformNames.SrcTexture, beforeRenderTarget.texture);
    setMaterialUniformValue(bloomPass.horizontalBlurMaterial, UniformNames.TargetWidth, w);
    setMaterialUniformValue(bloomPass.horizontalBlurMaterial, UniformNames.TargetHeight, w);
    renderMesh(renderer, bloomPass.geometry, bloomPass.horizontalBlurMaterial);

    setRendererRenderTarget(renderer, verticalRenderTarget, true);
    // renderer.clearColor(0, 0, 0, 1);
    setMaterialUniformValue(bloomPass.verticalBlurMaterial, UniformNames.SrcTexture, horizontalRenderTarget.texture);
    setMaterialUniformValue(bloomPass.verticalBlurMaterial, UniformNames.TargetWidth, w);
    setMaterialUniformValue(bloomPass.verticalBlurMaterial, UniformNames.TargetHeight, h);
    renderMesh(renderer, bloomPass.geometry, bloomPass.verticalBlurMaterial);
}

export const renderBloomPass: RenderPostProcessPassBehaviour = (
    postProcessPass: PostProcessPassBase,
    {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        gBufferRenderTargets,
        targetCamera,
        time,
    }: PostProcessPassRenderArgs
) => {
    const bloomPass = postProcessPass as BloomPass;

    // // 一回だけ呼びたい
    // this._geometry.start();
    // // ppの場合はいらない気がする
    // // this.mesh.updateTransform();

    if (!isCompiledMaterialShader(bloomPass.horizontalBlurMaterial)) {
        startMaterial(bloomPass.horizontalBlurMaterial, {
            gpu,
            attributeDescriptors: getGeometryAttributeDescriptors(bloomPass.geometry),
        });
    }
    if (!isCompiledMaterialShader(bloomPass.verticalBlurMaterial)) {
        startMaterial(bloomPass.verticalBlurMaterial, {
            gpu,
            attributeDescriptors: getGeometryAttributeDescriptors(bloomPass.geometry),
        });
    }

    setMaterialUniformValue(bloomPass.extractBrightnessPass.material, UNIFORM_NAME_THRESHOLD, bloomPass.threshold);
    setMaterialUniformValue(bloomPass.compositePass.material, UNIFORM_NAME_TONE, bloomPass.tone);
    setMaterialUniformValue(bloomPass.compositePass.material, UNIFORM_NAME_BLOOM_AMOUNT, bloomPass.bloomAmount);
    // this._extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);

    renderPostProcessPass(bloomPass.extractBrightnessPass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass: false,
        targetCamera,
        time,
    });

    // 1 / 4
    renderBlur(
        bloomPass,
        renderer,
        bloomPass.renderTargetBlurMip4_Horizontal,
        bloomPass.renderTargetBlurMip4_Vertical,
        bloomPass.extractBrightnessPass.renderTarget,
        4
    );
    // 1 / 8
    renderBlur(
        bloomPass,
        renderer,
        bloomPass.renderTargetBlurMip8_Horizontal,
        bloomPass.renderTargetBlurMip8_Vertical,
        bloomPass.renderTargetBlurMip4_Vertical,
        8
    );
    // 1 / 16
    renderBlur(
        bloomPass,
        renderer,
        bloomPass.renderTargetBlurMip16_Horizontal,
        bloomPass.renderTargetBlurMip16_Vertical,
        bloomPass.renderTargetBlurMip8_Vertical,
        16
    );
    // 1 / 32
    renderBlur(
        bloomPass,
        renderer,
        bloomPass.renderTargetBlurMip32_Horizontal,
        bloomPass.renderTargetBlurMip32_Vertical,
        bloomPass.renderTargetBlurMip16_Vertical,
        32
    );
    // 1 / 64
    renderBlur(
        bloomPass,
        renderer,
        bloomPass.renderTargetBlurMip64_Horizontal,
        bloomPass.renderTargetBlurMip64_Vertical,
        bloomPass.renderTargetBlurMip32_Vertical,
        64
    );

    if (prevRenderTarget) {
        setMaterialUniformValue(bloomPass.compositePass.material, UniformNames.SrcTexture, prevRenderTarget.texture);
    } else {
        console.error('invalid prev render target');
    }
    // this._compositePass.material.uniforms.setValue('uBrightnessTexture', this._extractBrightnessPass.renderTarget.$getTexture());
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_BLUR_4_TEXTURE,
        bloomPass.renderTargetBlurMip4_Vertical.texture
    );
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_BLUR_8_TEXTURE,
        bloomPass.renderTargetBlurMip8_Vertical.texture
    );
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_BLUR_16_TEXTURE,
        bloomPass.renderTargetBlurMip16_Vertical.texture
    );
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_BLUR_32_TEXTURE,
        bloomPass.renderTargetBlurMip32_Vertical.texture
    );
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_BLUR_64_TEXTURE,
        bloomPass.renderTargetBlurMip64_Vertical.texture
    );
    setMaterialUniformValue(
        bloomPass.compositePass.material,
        UNIFORM_NAME_EXTRACT_TEXTURE,
        bloomPass.extractBrightnessPass.renderTarget.texture
    );

    // this._compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
    // this._compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);

    renderPostProcessPass(bloomPass.compositePass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget: null,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
    });
};

// export function updateBloomPassParameters(bloomPass: BloomPass, parameters: BloomPassParameters) {
//     bloomPass.enabled = parameters.enabled ?? bloomPass.enabled;
//     bloomPass.tone = parameters.tone ?? bloomPass.tone;
//     bloomPass.threshold = parameters.threshold ?? bloomPass.threshold;
//     bloomPass.bloomAmount = parameters.bloomAmount ?? bloomPass.bloomAmount;
// }
