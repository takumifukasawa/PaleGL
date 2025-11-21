import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { setCameraSize } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { createFullQuadOrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import {
    PostProcessPassType,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_GBUFFER_A_TEXTURE,
    UNIFORM_NAME_GBUFFER_B_TEXTURE,
    UNIFORM_NAME_GBUFFER_C_TEXTURE,
    UNIFORM_NAME_GBUFFER_D_TEXTURE,
    UNIFORM_NAME_INVERSE_PROJECTION_MATRIX,
    UNIFORM_NAME_INVERSE_VIEW_MATRIX,
    UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX,
    UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX,
    UNIFORM_NAME_VIEW_PROJECTION_MATRIX,
    UNIFORM_NAME_PREV_VIEW_PROJECTION_MATRIX,
} from '@/PaleGL/constants.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
import { getDummyBlackTexture, Gpu } from '@/PaleGL/core/gpu.ts';
import {
    applyLightShadowMapUniformValues,
    LightActors,
    Renderer,
    updateRendererCameraUniforms,
} from '@/PaleGL/core/renderer.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { Texture } from '@/PaleGL/core/texture.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { cloneMat4, invertMat4, transposeMat4 } from '@/PaleGL/math/matrix4.ts';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    getPostProcessPassRenderTarget,
    renderPostProcessPass,
    setPostProcessPassSize,
    updatePostProcessPass,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { addPassInfoStats, Stats } from '@/PaleGL/utilities/stats.ts';
// import { Light } from '@/PaleGL/actors/light.ts';
// import {Matrix4} from "@/PaleGL/math/matrix4.ts";
// import {PostProcess} from "@/PaleGL/constants.ts";
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
    onAfterRenderPass?: (pass: PostProcessPassBase) => void;
    stats?: Stats;
    groupLabel?: string;
};

export type PostProcess = {
    passes: PostProcessPassBase[];
    postProcessCamera: Camera;
    selfEnabled: boolean;
};

// TODO: actorを継承してもいいかもしれない
export const createPostProcess = (postProcessCamera?: Camera): PostProcess => {
    const passes: PostProcessPassBase[] = [];
    postProcessCamera = postProcessCamera ? postProcessCamera : createFullQuadOrthographicCamera();
    const selfEnabled = true;

    return {
        passes,
        postProcessCamera,
        // postProcessCamera: createFullQuadOrthographicCamera(),
        selfEnabled,
    };
};

export const isPostProcessEnabled = (postProcess: PostProcess) => {
    if (!postProcess.selfEnabled) {
        return false;
    }

    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].enabled) {
            return true;
        }
    }

    return false;
};

export const setPostProcessEnabled = (postProcess: PostProcess, value: boolean) => {
    postProcess.selfEnabled = value;
};

export const hasPostProcessPassEnabled = (postProcess: PostProcess) => {
    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].enabled) {
            return true;
        }
    }
    return false;
};

export const getPostProcessPassByType = <T extends PostProcessPassBase>(
    postProcess: PostProcess,
    passType: PostProcessPassType
) => {
    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].type === passType) {
            return postProcess.passes[i] as T;
        }
    }
    return null;
};

export const getPostProcessPassByName = (postProcess: PostProcess, name: string) => {
    for (let i = 0; i < postProcess.passes.length; i++) {
        if (postProcess.passes[i].name === name) {
            return postProcess.passes[i] as PostProcessPassBase;
        }
    }
    return null;
};

export const getPostProcessLastRenderTarget = (postProcess: PostProcess) => {
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
};

export const setPostProcessSize = (postProcess: PostProcess, width: number, height: number) => {
    setCameraSize(postProcess.postProcessCamera, width, height);
    // this.renderTarget.setSize(width, height);
    postProcess.passes.forEach((pass) => setPostProcessPassSize(pass, width, height));
};

export const addPostProcessPass = (postProcess: PostProcess, pass: PostProcessPassBase) => {
    postProcess.passes.push(pass);
};

export const updatePostProcess = (postProcess: PostProcess) => {
    postProcess.passes.forEach((pass) => {
        updatePostProcessPass(pass);
    });
};

// TODO: ここでuniform更新するの分かりづらい気がするがどう？一つにまとめた方がよい？
export const updatePassMaterial = ({
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
}) => {
    pass.materials.forEach((passMaterial) => {
        // TODO: 必要なのだけ割り当てたいが・・・
        if (lightActors) {
            applyLightShadowMapUniformValues(passMaterial, lightActors, fallbackTextureBlack);
        }

        //
        // basic
        //

        setMaterialUniformValue(passMaterial, UNIFORM_NAME_VIEW_PROJECTION_MATRIX, targetCamera.viewProjectionMatrix);
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX,
            targetCamera.inverseViewProjectionMatrix
        );
        setMaterialUniformValue(passMaterial, UNIFORM_NAME_INVERSE_VIEW_MATRIX, targetCamera.inverseViewMatrix);
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_INVERSE_PROJECTION_MATRIX,
            targetCamera.inverseProjectionMatrix
        );
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX,
            transposeMat4(invertMat4(cloneMat4(targetCamera.viewMatrix)))
        );
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_PREV_VIEW_PROJECTION_MATRIX,
            targetCamera.prevViewProjectionMatrix
        );

        // passMaterial.uniforms.setValue(UNIFORM_NAME_TIME, time);

        // g-buffers
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_GBUFFER_A_TEXTURE,
            renderer.gBufferRenderTargets.gBufferATexture
        );
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_GBUFFER_B_TEXTURE,
            renderer.gBufferRenderTargets.gBufferBTexture
        );
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_GBUFFER_C_TEXTURE,
            renderer.gBufferRenderTargets.gBufferCTexture
        );
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_GBUFFER_D_TEXTURE,
            renderer.gBufferRenderTargets.gBufferDTexture
        );
        // passMaterial.uniforms.setValue(UNIFORM_NAME_DEPTH_TEXTURE, renderer.gBufferRenderTargets.depthTexture);
        setMaterialUniformValue(
            passMaterial,
            UNIFORM_NAME_DEPTH_TEXTURE,
            renderer.depthPrePassRenderTarget.depthTexture
        );
    });
};

export const renderPass = ({
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
}) => {
    updatePassMaterial({
        pass,
        renderer,
        targetCamera,
        // time,
        lightActors,
        fallbackTextureBlack: getDummyBlackTexture(gpu),
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
};

export const renderPostProcess = (
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
        onAfterRenderPass,
        stats,
        groupLabel,
    }: PostProcessRenderArgs
) => {
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

        if (stats && groupLabel) {
            addPassInfoStats(stats, groupLabel, pass.name ?? '', pass.geometry);
        }

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

        if (onAfterRenderPass) {
            onAfterRenderPass(pass);
        }
    });
};
