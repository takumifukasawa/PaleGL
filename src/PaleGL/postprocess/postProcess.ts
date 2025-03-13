// // import {Vector3} from '@/PaleGL/math/Vector3';
// import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
// import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
// import { Gpu } from '@/PaleGL/core/gpu.ts';
// import {
//     applyLightShadowMapUniformValues,
//     LightActors,
//     Renderer,
//     updateRendererCameraUniforms
// } from '@/PaleGL/core/renderer.ts';
// import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
// import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
// import { UniformNames } from '@/PaleGL/constants.ts';
// import { PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBaseDEPRECATED.ts';
// import { Texture } from '@/PaleGL/core/texture.ts';
// import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
// import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
// import {setCameraSize} from "@/PaleGL/actors/cameras/cameraBehaviours.ts";
// // import { Light } from '@/PaleGL/actors/light.ts';
// // import {Matrix4} from "@/PaleGL/math/matrix4.ts";
// // import {PostProcessUniformNames} from "@/PaleGL/constants.ts";
// // import {Matrix4} from "@/PaleGL/math/matrix4.ts";
//
// type PostProcessRenderArgs = {
//     gpu: Gpu;
//     renderer: Renderer;
//     prevRenderTarget: RenderTarget | null;
//     gBufferRenderTargets?: GBufferRenderTargets | null;
//     targetCamera: Camera;
//     time: number;
//     isCameraLastPass: boolean;
//     lightActors?: LightActors;
// };
//
// // TODO: actorを継承してもいいかもしれない
// export class PostProcess {
//     passes: IPostProcessPass[] = [];
//     // renderTarget;
//     _postProcessCamera: Camera;
//
//     _selfEnabled = true;
//
//     get enabled() {
//         if (!this._selfEnabled) {
//             return false;
//         }
//
//         for (let i = 0; i < this.passes.length; i++) {
//             if (this.passes[i].parameters.enabled) {
//                 return true;
//             }
//         }
//
//         return false;
//     }
//
//     getPostProcessCamera() {
//         return this._postProcessCamera;
//     }
//
//     set enabled(value) {
//         this._selfEnabled = value;
//     }
//
//     get hasEnabledPass() {
//         for (let i = 0; i < this.passes.length; i++) {
//             if (this.passes[i].parameters.enabled) {
//                 return true;
//             }
//         }
//         return false;
//     }
//
//     get lastRenderTarget() {
//         let lastPass: IPostProcessPass | null = null;
//         for (let i = this.passes.length - 1; i >= 0; i--) {
//             if (this.passes[i].parameters.enabled) {
//                 lastPass = this.passes[i];
//                 break;
//             }
//         }
//         if (lastPass == null) {
//             return null;
//         }
//         return lastPass.renderTarget;
//     }
//
//     // constructor({gpu}: {gpu: Gpu}) {
//     constructor(postProcessCamera?: Camera) {
//         // // TODO: renderTargetがいらない時もあるので出し分けたい
//         // this.renderTarget = new RenderTarget({
//         //     gpu,
//         //     name: "PostProcess RenderTarget",
//         //     type: RenderTargetTypes.RGBA,
//         //     writeDepthTexture: true, // TODO: 必要ないかもしれないので出し分けたい
//         //     width: 1, height: 1,
//         // });
//
//         if (postProcessCamera) {
//             this._postProcessCamera = postProcessCamera;
//         } else {
//             this._postProcessCamera = createFullQuadOrthographicCamera();
//         }
//     }
//
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         setCameraSize(this._postProcessCamera, width, height);
//         // this.renderTarget.setSize(width, height);
//         this.passes.forEach((pass) => pass.setSize(width, height));
//     }
//
//     /**
//      *
//      * @param pass
//      */
//     addPass(pass: IPostProcessPass) {
//         this.passes.push(pass);
//     }
//
//     /**
//      *
//      */
//     update() {
//         this.passes.forEach((pass) => {
//             pass.update();
//         });
//     }
//
//     /**
//      *
//      * @param pass
//      * @param renderer
//      * @param targetCamera
//      * @param time
//      * @param lightActors
//      */
//     // TODO: ここでuniform更新するの分かりづらい気がするがどう？一つにまとめた方がよい？
//     private static updatePassMaterial({
//         pass,
//         renderer,
//         targetCamera,
//         // time,
//         lightActors,
//         fallbackTextureBlack,
//     }: {
//         pass: IPostProcessPass;
//         renderer: Renderer;
//         targetCamera: Camera;
//         // time: number;
//         lightActors?: LightActors;
//         fallbackTextureBlack: Texture;
//     }) {
//         pass.materials.forEach((passMaterial) => {
//             // TODO: 必要なのだけ割り当てたいが・・・
//             if (lightActors) {
//                 applyLightShadowMapUniformValues(passMaterial, lightActors, fallbackTextureBlack);
//             }
//
//             //
//             // basic
//             //
//
//             setMaterialUniformValue(passMaterial, UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.InverseViewProjectionMatrix,
//                 targetCamera.inverseViewProjectionMatrix
//             );
//             setMaterialUniformValue(passMaterial, UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.InverseProjectionMatrix,
//                 targetCamera.inverseProjectionMatrix
//             );
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.TransposeInverseViewMatrix,
//                 targetCamera.viewMatrix.clone().invert().transpose()
//             );
//
//             // passMaterial.uniforms.setValue(UniformNames.Time, time);
//
//             // g-buffers
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.GBufferATexture,
//                 renderer.gBufferRenderTargets.gBufferATexture
//             );
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.GBufferBTexture,
//                 renderer.gBufferRenderTargets.gBufferBTexture
//             );
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.GBufferCTexture,
//                 renderer.gBufferRenderTargets.gBufferCTexture
//             );
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.GBufferDTexture,
//                 renderer.gBufferRenderTargets.gBufferDTexture
//             );
//             // passMaterial.uniforms.setValue(UniformNames.DepthTexture, renderer.gBufferRenderTargets.depthTexture);
//             setMaterialUniformValue(
//                 passMaterial,
//                 UniformNames.DepthTexture,
//                 renderer.depthPrePassRenderTarget.depthTexture
//             );
//         });
//     }
//
//     /**
//      *
//      * @param pass
//      * @param gpu
//      * @param renderer
//      * @param camera
//      * @param prevRenderTarget
//      * @param targetCamera
//      * @param gBufferRenderTargets
//      * @param time
//      * @param isLastPass
//      * @param lightActors
//      */
//     static renderPass({
//         pass,
//         gpu,
//         renderer,
//         camera,
//         prevRenderTarget,
//         targetCamera,
//         gBufferRenderTargets,
//         time,
//         isLastPass,
//         lightActors,
//     }: PostProcessPassRenderArgs & { pass: IPostProcessPass; camera: Camera; isLastPass: boolean }) {
//         PostProcess.updatePassMaterial({
//             pass,
//             renderer,
//             targetCamera,
//             // time,
//             lightActors,
//             fallbackTextureBlack: gpu.dummyTextureBlack,
//         });
//
//         //
//         // cameras
//         //
//
//         updateRendererCameraUniforms(renderer, targetCamera);
//
//         pass.render({
//             gpu,
//             renderer,
//             camera,
//             prevRenderTarget,
//             isLastPass,
//             targetCamera,
//             gBufferRenderTargets,
//             time,
//             lightActors,
//         });
//     }
//
//     /**
//      *
//      * @param gpu
//      * @param renderer
//      * @param prevRenderTarget
//      * @param gBufferRenderTargets
//      * @param targetCamera
//      * @param time
//      * @param isCameraLastPass
//      * @param lightActors
//      */
//     render({
//         gpu,
//         renderer,
//         prevRenderTarget, // TODO: このパラメーターなくしたい
//         gBufferRenderTargets,
//         targetCamera,
//         time,
//         isCameraLastPass,
//         lightActors,
//     }: PostProcessRenderArgs) {
//         // if (!sceneRenderTarget) {
//         //     console.error('[PostProcess.render] scene render target is empty.');
//         // }
//
//         updateActorTransform(this._postProcessCamera);
//         // TODO: render target を外から渡したほうが分かりやすいかも
//         // let prevRenderTarget = sceneRenderTarget || this.renderTarget;
//         // let prevRenderTarget = sceneRenderTarget;
//         if (!prevRenderTarget) {
//             console.error('[PostProcess.render] scene render target is empty.');
//         }
//
//         // const inverseViewProjectionMatrix = Matrix4.multiplyMatrices(
//         //     targetCamera.projectionMatrix,
//         //     targetCamera.viewMatrix
//         // ).invert();
//         // const inverseProjectionMatrix = targetCamera.projectionMatrix.clone().invert();
//
//         // set uniform and render pass
//         const enabledPasses = this.passes.filter((pass) => pass.parameters.enabled);
//
//         enabledPasses.forEach((pass, i) => {
//             const isLastPass = isCameraLastPass && i === enabledPasses.length - 1;
//
//             // this.updatePassMaterial({pass, renderer, targetCamera, time});
//             // pass.render({
//             //     gpu,
//             //     renderer,
//             //     cameras: this._postProcessCamera,
//             //     prevRenderTarget,
//             //     isLastPass,
//             //     targetCamera,
//             //     gBufferRenderTargets,
//             //     time,
//             // });
//
//             PostProcess.renderPass({
//                 pass,
//                 gpu,
//                 renderer,
//                 camera: this._postProcessCamera,
//                 prevRenderTarget,
//                 isLastPass,
//                 targetCamera,
//                 gBufferRenderTargets,
//                 time,
//                 lightActors,
//             });
//
//             prevRenderTarget = pass.renderTarget;
//         });
//     }
// }

// import {Vector3} from '@/PaleGL/math/Vector3';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    applyLightShadowMapUniformValues,
    LightActors,
    Renderer,
    updateRendererCameraUniforms,
} from '@/PaleGL/core/renderer.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { setCameraSize } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    getPostProcessPassRenderTarget,
    renderPostProcessPass,
    setPostProcessPassSize,
    updatePostProcessPass,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { cloneMat4, invertMat4, transposeMat4 } from '@/PaleGL/math/matrix4.ts';
// import { Light } from '@/PaleGL/actors/light.ts';
// import {Matrix4} from "@/PaleGL/math/matrix4.ts";
// import {PostProcessUniformNames} from "@/PaleGL/constants.ts";
// import {Matrix4} from "@/PaleGL/math/matrix4.ts";

type PostProcessRenderArgs = {
    gpu: Gpu;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    targetCamera: Camera;
    time: number;
    isCameraLastPass: boolean;
    lightActors?: LightActors;
};

export type PostProcess = {
    passes: PostProcessPassBase[];
    postProcessCamera: Camera;
    selfEnabled: boolean;
};

// TODO: actorを継承してもいいかもしれない
export function createPostProcess(postProcessCamera?: Camera): PostProcess {
    const passes: PostProcessPassBase[] = [];
    postProcessCamera = postProcessCamera ? postProcessCamera : createFullQuadOrthographicCamera();
    const selfEnabled = true;

    return {
        passes,
        postProcessCamera,
        // postProcessCamera: createFullQuadOrthographicCamera(),
        selfEnabled,
    };
}

export function isPostProcessEnabled(postProcess: PostProcess) {
    if (!postProcess.selfEnabled) {
        return false;
    }

    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].parameters.enabled  || postProcess.passes[i].enabled) {
            return true;
        }
    }

    return false;
}

export function setPostProcessEnabled(postProcess: PostProcess, value: boolean) {
    postProcess.selfEnabled = value;
}

export function hasPostProcessPassEnabled(postProcess: PostProcess) {
    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].parameters.enabled || postProcess.passes[i].parameters) {
            return true;
        }
    }
    return false;
}

export function getPostProcessLastRenderTarget(postProcess: PostProcess) {
    let lastPass: PostProcessPassBase | null = null;
    for (let i = postProcess.passes.length - 1; i >= 0; i--) {
        if (postProcess.passes[i].parameters.enabled || postProcess.passes[i].enabled) {
            lastPass = postProcess.passes[i];
            break;
        }
    }
    if (lastPass == null) {
        return null;
    }
    return getPostProcessPassRenderTarget(lastPass);
}

export function setPostProcessSize(postProcess: PostProcess, width: number, height: number) {
    setCameraSize(postProcess.postProcessCamera, width, height);
    // this.renderTarget.setSize(width, height);
    postProcess.passes.forEach((pass) => setPostProcessPassSize(pass, width, height));
}

export function addPostProcessPass(postProcess: PostProcess, pass: PostProcessPassBase) {
    postProcess.passes.push(pass);
}

export function updatePostProcess(postProcess: PostProcess) {
    postProcess.passes.forEach((pass) => {
        updatePostProcessPass(pass);
    });
}

// TODO: ここでuniform更新するの分かりづらい気がするがどう？一つにまとめた方がよい？
export function updatePassMaterial({
    pass,
    renderer,
    targetCamera,
    // time,
    lightActors,
    fallbackTextureBlack,
}: {
    pass: PostProcessPassBase;
    renderer: Renderer;
    targetCamera: Camera;
    // time: number;
    lightActors?: LightActors;
    fallbackTextureBlack: Texture;
}) {
    pass.materials.forEach((passMaterial) => {
        // TODO: 必要なのだけ割り当てたいが・・・
        if (lightActors) {
            applyLightShadowMapUniformValues(passMaterial, lightActors, fallbackTextureBlack);
        }

        //
        // basic
        //

        setMaterialUniformValue(passMaterial, UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
        setMaterialUniformValue(
            passMaterial,
            UniformNames.InverseViewProjectionMatrix,
            targetCamera.inverseViewProjectionMatrix
        );
        setMaterialUniformValue(passMaterial, UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
        setMaterialUniformValue(
            passMaterial,
            UniformNames.InverseProjectionMatrix,
            targetCamera.inverseProjectionMatrix
        );
        setMaterialUniformValue(
            passMaterial,
            UniformNames.TransposeInverseViewMatrix,
            transposeMat4(invertMat4(cloneMat4(targetCamera.viewMatrix)))
        );

        // passMaterial.uniforms.setValue(UniformNames.Time, time);

        // g-buffers
        setMaterialUniformValue(
            passMaterial,
            UniformNames.GBufferATexture,
            renderer.gBufferRenderTargets.gBufferATexture
        );
        setMaterialUniformValue(
            passMaterial,
            UniformNames.GBufferBTexture,
            renderer.gBufferRenderTargets.gBufferBTexture
        );
        setMaterialUniformValue(
            passMaterial,
            UniformNames.GBufferCTexture,
            renderer.gBufferRenderTargets.gBufferCTexture
        );
        setMaterialUniformValue(
            passMaterial,
            UniformNames.GBufferDTexture,
            renderer.gBufferRenderTargets.gBufferDTexture
        );
        // passMaterial.uniforms.setValue(UniformNames.DepthTexture, renderer.gBufferRenderTargets.depthTexture);
        setMaterialUniformValue(
            passMaterial,
            UniformNames.DepthTexture,
            renderer.depthPrePassRenderTarget.depthTexture
        );
    });
}

export function renderPass({
    pass,
    gpu,
    renderer,
    camera,
    prevRenderTarget,
    targetCamera,
    gBufferRenderTargets,
    time,
    isLastPass,
    lightActors,
}: PostProcessPassRenderArgs & {
    pass: PostProcessPassBase;
    camera: Camera;
    isLastPass: boolean;
}) {
    updatePassMaterial({
        pass,
        renderer,
        targetCamera,
        // time,
        lightActors,
        fallbackTextureBlack: gpu.dummyTextureBlack,
    });

    //
    // cameras
    //

    updateRendererCameraUniforms(renderer, targetCamera);

    renderPostProcessPass(pass, {
        gpu,
        renderer,
        camera,
        prevRenderTarget,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
        lightActors,
    });
}

export function renderPostProcess(
    postProcess: PostProcess,
    {
        gpu,
        renderer,
        prevRenderTarget, // TODO: このパラメーターなくしたい
        gBufferRenderTargets,
        targetCamera,
        time,
        isCameraLastPass,
        lightActors,
    }: PostProcessRenderArgs
) {
    // if (!sceneRenderTarget) {
    //     console.error('[PostProcess.render] scene render target is empty.');
    // }

    updateActorTransform(postProcess.postProcessCamera);
    // TODO: render target を外から渡したほうが分かりやすいかも
    // let prevRenderTarget = sceneRenderTarget || this.renderTarget;
    // let prevRenderTarget = sceneRenderTarget;
    if (!prevRenderTarget) {
        console.error('[PostProcess.render] scene render target is empty.');
    }

    // const inverseViewProjectionMatrix = Matrix4.multiplyMatrices(
    //     targetCamera.projectionMatrix,
    //     targetCamera.viewMatrix
    // ).invert();
    // const inverseProjectionMatrix = targetCamera.projectionMatrix.clone().invert();

    // set uniform and render pass
    const enabledPasses = postProcess.passes.filter((pass) => pass.parameters.enabled || pass.enabled);

    enabledPasses.forEach((pass, i) => {
        const isLastPass = isCameraLastPass && i === enabledPasses.length - 1;

        // this.updatePassMaterial({pass, renderer, targetCamera, time});
        // pass.render({
        //     gpu,
        //     renderer,
        //     cameras: this._postProcessCamera,
        //     prevRenderTarget,
        //     isLastPass,
        //     targetCamera,
        //     gBufferRenderTargets,
        //     time,
        // });

        renderPass({
            pass,
            gpu,
            renderer,
            camera: postProcess.postProcessCamera,
            prevRenderTarget,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
            lightActors,
        });

        prevRenderTarget = getPostProcessPassRenderTarget(pass);
    });
}
