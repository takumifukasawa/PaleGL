// import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
// import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
// import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
// import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
// import { Renderer } from '@/PaleGL/core/renderer.ts';
// import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
// import { GPU } from '@/PaleGL/core/GPU.ts';
// import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
// import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import {
//     PostProcessPassBase,
//     PostProcessPassParametersBase,
//     PostProcessPassRenderArgs,
// } from '@/PaleGL/postprocess/PostProcessPassBase';
// import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
//
// const BLUR_PIXEL_NUM = 7;
//
// export type GaussianBlurPassParameters = PostProcessPassParametersBase;
//
// export type GaussianBlurPassParametersArgs = Partial<GaussianBlurPassParameters>;
//
// export function generateGaussianBlurPassParameters(
//     params: GaussianBlurPassParametersArgs = {}
// ): GaussianBlurPassParameters {
//     return {
//         enabled: params.enabled ?? true,
//     };
// }
//
// export class GaussianBlurPass implements IPostProcessPass {
//     // export class GaussianBlurPass extends PostProcessPassBase {
//     // gpu: Gpu;
//     name: string = 'GaussianBlurPass';
//     type: PostProcessPassType = PostProcessPassType.GaussianBlur;
//
//     width: number = 1;
//     height: number = 1;
//     materials: Material[] = [];
//
//     // parameters: PostProcessParametersBase = { type: PostProcessType.GaussianBlur, enabled: true };
//     parameters: GaussianBlurPassParameters;
//
//     geometry: PlaneGeometry;
//     private horizontalBlurPass: FragmentPass;
//     private verticalBlurPass: FragmentPass;
//
//     #passes: PostProcessPassBase[] = [];
//
//     get renderTarget() {
//         return this.#passes[this.#passes.length - 1].renderTarget;
//     }
//
//     // constructor({ gpu, blurPixelNum = 7 }: { gpu: Gpu; blurPixelNum: number }) {
//     constructor(args: { gpu: GPU; parameters?: GaussianBlurPassParametersArgs }) {
//         const { gpu } = args;
//
//         this.parameters = generateGaussianBlurPassParameters(args.parameters);
//         // super();
//         this.geometry = createPlaneGeometry({ gpu });
//
//         const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, Math.floor(BLUR_PIXEL_NUM / 2));
//
//         this.horizontalBlurPass = new FragmentPass({
//             name: 'horizontal blur pass',
//             gpu,
//             fragmentShader: gaussianBlurFragmentShader,
//             // fragmentShader: gaussianBlurFragmentShader({
//             //     isHorizontal: true,
//             //     pixelNum: blurPixelNum,
//             //     srcTextureUniformName: UniformNames.SrcTexture
//             // }),
//             uniforms: [
//                 {
//                     name: 'uTargetWidth',
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//                 {
//                     name: 'uTargetHeight',
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//                 {
//                     name: 'uBlurWeights',
//                     type: UniformTypes.FloatArray,
//                     value: new Float32Array(blurWeights),
//                 },
//                 {
//                     name: 'uIsHorizontal',
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//             ],
//         });
//         this.#passes.push(this.horizontalBlurPass);
//         this.materials.push(...this.horizontalBlurPass.materials);
//
//         this.verticalBlurPass = new FragmentPass({
//             name: 'vertical blur pass',
//             gpu,
//             fragmentShader: gaussianBlurFragmentShader,
//             // fragmentShader: gaussianBlurFragmentShader({
//             //     isHorizontal: false,
//             //     pixelNum: blurPixelNum,
//             //     srcTextureUniformName: UniformNames.SrcTexture,
//             // }),
//             uniforms: [
//                 {
//                     name: 'uTargetWidth',
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//                 {
//                     name: 'uTargetHeight',
//                     type: UniformTypes.Float,
//                     value: 1,
//                 },
//                 {
//                     name: 'uBlurWeights',
//                     type: UniformTypes.FloatArray,
//                     value: new Float32Array(blurWeights),
//                 },
//                 {
//                     name: 'uIsHorizontal',
//                     type: UniformTypes.Float,
//                     value: 0,
//                 },
//             ],
//         });
//         this.#passes.push(this.verticalBlurPass);
//         this.materials.push(...this.verticalBlurPass.materials);
//     }
//
//     setSize(width: number, height: number) {
//         this.horizontalBlurPass.setSize(width, height);
//         setMaterialUniformValue(this.horizontalBlurPass.material, 'uTargetWidth', width);
//         setMaterialUniformValue(this.horizontalBlurPass.material, 'uTargetHeight', height);
//         this.verticalBlurPass.setSize(width, height);
//         setMaterialUniformValue(this.verticalBlurPass.material, 'uTargetWidth', width);
//         setMaterialUniformValue(this.verticalBlurPass.material, 'uTargetHeight', height);
//     }
//
//     // TODO: 空メソッド書かなくていいようにしたい
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}
//
//     update() {}
//
//     render({
//         gpu,
//         camera,
//         renderer,
//         prevRenderTarget,
//         isLastPass,
//         targetCamera,
//         gBufferRenderTargets,
//         time,
//     }: PostProcessPassRenderArgs) {
//         // this.geometry.start();
//
//         this.horizontalBlurPass.render({
//             gpu,
//             camera,
//             renderer,
//             prevRenderTarget,
//             isLastPass: false,
//             targetCamera,
//             gBufferRenderTargets,
//             time,
//         });
//
//         this.verticalBlurPass.render({
//             gpu,
//             camera,
//             renderer,
//             prevRenderTarget,
//             isLastPass,
//             targetCamera,
//             gBufferRenderTargets,
//             time,
//         });
//
//         // this.#passes.forEach((pass, i) => {
//         //     pass.setRenderTarget(renderer, cameras, isLastPass && i == this.#passes.length - 1);
//
//         //     // TODO: pass内で好きに設定してよさそう
//         //     renderer.clear(cameras.clearColor.x, cameras.clearColor.y, cameras.clearColor.z, cameras.clearColor.w);
//
//         //     // TODO: mesh経由する必要たぶんない
//         //     pass.mesh.updateTransform();
//         //     // pass.material.uniforms[UniformNames.SceneTexture].value = i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture;
//         //     pass.material.uniforms.setValue(
//         //         UniformNames.SrcTexture,
//         //         // i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture
//         //         (i === 0 && prevRenderTarget) ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture
//         //     );
//         //     if (!pass.material.isCompiledShader() {
//         //         pass.material.start({ gpu, attributeDescriptors: [] });
//         //     }
//
//         //     renderer.renderMesh(pass.geometry, pass.material);
//         // });
//     }
// }

import { PostProcessPassType, UniformTypes } from '@/PaleGL/constants';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { GPU } from '@/PaleGL/core/GPU.ts';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { PostProcessPassParametersBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { PostProcessPassBase, PostProcessSinglePass } from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createPostProcessPassBase } from '@/PaleGL/postprocess/postProcessPassBaseWIP.ts';
import { renderPostProcessPass, setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const BLUR_PIXEL_NUM = 7;

export type GaussianBlurPassParameters = PostProcessPassParametersBase;

export type GaussianBlurPassParametersArgs = Partial<GaussianBlurPassParameters>;

export function generateGaussianBlurPassParameters(
    params: GaussianBlurPassParametersArgs = {}
): GaussianBlurPassParameters {
    return {
        enabled: params.enabled ?? true,
    };
}

export type GaussianBlurPass = PostProcessPassBase & {
    passes: PostProcessSinglePass[];
    horizontalBlurPass: FragmentPass;
    verticalBlurPass: FragmentPass;
};

export function createGaussianBlurPass(args: { gpu: GPU; parameters?: GaussianBlurPassParametersArgs }): GaussianBlurPass {
    const { gpu } = args;

    const materials: Material[] = [];
    const parameters: GaussianBlurPassParameters = generateGaussianBlurPassParameters(args.parameters);

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
            name: 'GaussianBlurPass',
            type: PostProcessPassType.GaussianBlur,
            parameters,
            geometry,
            materials,
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
