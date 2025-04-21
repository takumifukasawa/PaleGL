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
import {PostProcessPassType, UniformNames} from '@/PaleGL/constants.ts';
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
        if (postProcess.passes[i].enabled) {
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
        if (postProcess.passes[i].enabled) {
            return true;
        }
    }
    return false;
}

export function getPostProcessPassByType<T extends PostProcessPassBase>(postProcess: PostProcess, passType: PostProcessPassType) {
    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].type === passType) {
            return postProcess.passes[i] as T;
        }
    }
    return null;
}

export function getPostProcessLastRenderTarget(postProcess: PostProcess) {
    let lastPass: PostProcessPassBase | null = null;
    for (let i = postProcess.passes.length - 1; i >= 0; i--) {
        if (postProcess.passes[i].enabled) {
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
    const enabledPasses = postProcess.passes.filter((pass) => pass.enabled);

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
