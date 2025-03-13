import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import {
    PostProcessPassRenderArgs,
    PostProcessPassBase,
    PostProcessSinglePass,
    PostProcessPassParametersBaseArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createPostProcessPassBase } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessPass, setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const BLUR_PIXEL_NUM = 7;

export type GaussianBlurPass = PostProcessPassBase & {
    passes: PostProcessSinglePass[];
    horizontalBlurPass: FragmentPass;
    verticalBlurPass: FragmentPass;
};

export type GaussianBlurPassParametersArgs = PostProcessPassParametersBaseArgs;

export function createGaussianBlurPass(args: GaussianBlurPassParametersArgs): GaussianBlurPass {
    const { gpu, enabled } = args;

    const materials: Material[] = [];

    const geometry: PlaneGeometry = createPlaneGeometry({ gpu });

    const passes: PostProcessSinglePass[] = [];

    const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, Math.floor(BLUR_PIXEL_NUM / 2));

    const horizontalBlurPass = createFragmentPass({
        name: 'horizontal blur pass',
        gpu,
        fragmentShader: gaussianBlurFragmentShader,
        // fragmentShader: gaussianBlurFragmentShader({
        //     isHorizontal: true,
        //     pixelNum: blurPixelNum,
        //     srcTextureUniformName: UniformNames.SrcTexture
        // }),
        uniforms: [
            {
                name: 'uTargetWidth',
                type: UniformTypes.Float,
                value: 1,
            },
            {
                name: 'uTargetHeight',
                type: UniformTypes.Float,
                value: 1,
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
        ],
    });
    passes.push(horizontalBlurPass);
    materials.push(...horizontalBlurPass.materials);

    const verticalBlurPass = createFragmentPass({
        name: 'vertical blur pass',
        gpu,
        fragmentShader: gaussianBlurFragmentShader,
        // fragmentShader: gaussianBlurFragmentShader({
        //     isHorizontal: false,
        //     pixelNum: blurPixelNum,
        //     srcTextureUniformName: UniformNames.SrcTexture,
        // }),
        uniforms: [
            {
                name: 'uTargetWidth',
                type: UniformTypes.Float,
                value: 1,
            },
            {
                name: 'uTargetHeight',
                type: UniformTypes.Float,
                value: 1,
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
        ],
    });
    passes.push(verticalBlurPass);
    materials.push(...verticalBlurPass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name: 'GaussianBlurPass',
            type: PostProcessPassType.GaussianBlur,
            geometry,
            materials,
            enabled,
        }),
        passes,
        horizontalBlurPass,
        verticalBlurPass,
    };
}

export function getGaussianBlurPassRenderTarget(gaussianBlurPass: GaussianBlurPass) {
    return gaussianBlurPass.passes[gaussianBlurPass.passes.length - 1].renderTarget;
}

export function setGaussianBlurPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const gaussianBlurPass = postProcessPass as GaussianBlurPass;
    setPostProcessPassSize(gaussianBlurPass.horizontalBlurPass, width, height);
    setMaterialUniformValue(gaussianBlurPass.horizontalBlurPass.material, 'uTargetWidth', width);
    setMaterialUniformValue(gaussianBlurPass.horizontalBlurPass.material, 'uTargetHeight', height);
    setPostProcessPassSize(gaussianBlurPass.verticalBlurPass, width, height);
    setMaterialUniformValue(gaussianBlurPass.verticalBlurPass.material, 'uTargetWidth', width);
    setMaterialUniformValue(gaussianBlurPass.verticalBlurPass.material, 'uTargetHeight', height);
}

export function renderGaussianBlurPass(
    postProcessPass: PostProcessPassBase,
    {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
    }: PostProcessPassRenderArgs
) {
    const gaussianBlurPass = postProcessPass as GaussianBlurPass;

    renderPostProcessPass(gaussianBlurPass.horizontalBlurPass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    renderPostProcessPass(gaussianBlurPass.verticalBlurPass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    // this.#passes.forEach((pass, i) => {
    //     pass.setRenderTarget(renderer, cameras, isLastPass && i == this.#passes.length - 1);

    //     // TODO: pass内で好きに設定してよさそう
    //     renderer.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);

    //     // TODO: mesh経由する必要たぶんない
    //     pass.mesh.updateTransform();
    //     // pass.material.uniforms[UniformNames.SceneTexture].value = i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture;
    //     pass.material.uniforms.setValue(
    //         UniformNames.SrcTexture,
    //         // i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture
    //         (i === 0 && prevRenderTarget) ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture
    //     );
    //     if (!pass.material.isCompiledShader() {
    //         pass.material.start({ gpu, attributeDescriptors: [] });
    //     }

    //     renderer.renderMesh(pass.geometry, pass.material);
    // });
}
