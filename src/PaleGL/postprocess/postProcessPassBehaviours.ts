

import {RenderTarget, setRenderTargetSize} from "@/PaleGL/core/renderTarget.ts";
import {isCompiledMaterialShader, setMaterialUniformValue, startMaterial} from "@/PaleGL/materials/material.ts";
import {PostProcessPassType, UniformNames} from "@/PaleGL/constants.ts";
import {
    checkNeedsBindUniformBufferObjectToMaterial,
    Renderer, renderMesh,
    setRendererRenderTarget
} from "@/PaleGL/core/renderer.ts";
import {Camera} from "@/PaleGL/actors/cameras/camera.ts";
import {PostProcessPassRenderArgs} from "@/PaleGL/postprocess/PostProcessPassBase.ts";
import {getGeometryAttributeDescriptors} from "@/PaleGL/geometries/geometryBehaviours.ts";
import {updateActorTransform} from "@/PaleGL/actors/actorBehaviours.ts";
import {PostProcessSinglePass, PostProcessPassBase} from "@/PaleGL/postprocess/postProcessPassBaseWIP.ts";
import {getBloomPassRenderTarget, renderBloomPass, setBloomPassSize} from "@/PaleGL/postprocess/BloomPass.ts";
import {
    renderChromaticAberrationPass,
} from "@/PaleGL/postprocess/ChromaticAberrationPass.ts";
import {
    getDepthOfFieldPassRenderTarget,
    renderDepthOfFieldPass,
    setDepthOfFieldPassSize
} from "@/PaleGL/postprocess/DepthOfFieldPass.ts";
import {renderGaussianBlurPass} from "@/PaleGL/postprocess/GaussianBlurPass.ts";
import {renderFogPass} from "@/PaleGL/postprocess/FogPass.ts";
import {renderGlitchPass} from "@/PaleGL/postprocess/GlitchPass.ts";
import {
    getLightShaftPassRenderTarget,
    renderLightShaftPass,
    setLightShaftPassSize
} from "@/PaleGL/postprocess/LightShaftPass.ts";
import {renderScreenShadowPass, setScreenSpaceShadowPassSize} from "@/PaleGL/postprocess/ScreenSpaceShadowPass.ts";
import {renderSSRPass} from "@/PaleGL/postprocess/SSRPass.ts";
import {renderVignettePass} from "@/PaleGL/postprocess/VignettePass.ts";
import {getStreakPassRenderTarget, renderStreakPass, setStreakPassSize} from "@/PaleGL/postprocess/StreakPass.ts";
import {renderSSAOPass} from "@/PaleGL/postprocess/SSAOPass.ts";
import {renderVolumetricLightPass, setVolumetricLightPassSize} from "@/PaleGL/postprocess/VolumetricLightPass.ts";
import {
    getBufferVisualizerPassRenderTarget,
    renderBufferVisualizerPass,
    setBufferVisualizerPassSize, updateBufferVisualizerPass
} from "@/PaleGL/postprocess/BufferVisualizerPass.ts";

// set size

export type SetPostProcessPassSizeBehaviour = (postProcessPass: PostProcessPassBase | PostProcessSinglePass, width: number, height: number) => void;

// 特に指定がないときはsingle-passとみなす
export const setPostProcessSinglePassSizeBehaviour: SetPostProcessPassSizeBehaviour = (pass: PostProcessPassBase, width: number, height: number) => {
    const postProcessPass = pass as PostProcessSinglePass;
    postProcessPass.width = width;
    postProcessPass.height = height;
    const renderTarget = getPostProcessPassRenderTarget(postProcessPass);
    setRenderTargetSize(renderTarget, width, height);
    // setRenderTargetSize(postProcessPass.renderTarget, width, height);
    // TODO: pass base で更新しちゃって大丈夫？
    setMaterialUniformValue(postProcessPass.material, UniformNames.TargetWidth, postProcessPass.width);
    setMaterialUniformValue(postProcessPass.material, UniformNames.TargetHeight, postProcessPass.height);
    setMaterialUniformValue(postProcessPass.material, UniformNames.TexelSize, postProcessPass.width / postProcessPass.height);
    // TODO: いらない？
    setMaterialUniformValue(postProcessPass.material, UniformNames.Aspect, postProcessPass.width / postProcessPass.height);
}

const setPostProcessPassSizeBehaviour: Partial<Record<PostProcessPassType, SetPostProcessPassSizeBehaviour>> = {
    [PostProcessPassType.Bloom]: setBloomPassSize,
    [PostProcessPassType.BufferVisualizer]: setBufferVisualizerPassSize,
    [PostProcessPassType.DepthOfField]: setDepthOfFieldPassSize,
    [PostProcessPassType.LightShaft]: setLightShaftPassSize,
    [PostProcessPassType.Streak]: setStreakPassSize,
    [PostProcessPassType.ScreenSpaceShadow]: setScreenSpaceShadowPassSize,
    [PostProcessPassType.VolumetricLight]: setVolumetricLightPassSize
}

export function setPostProcessPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    if(setPostProcessPassSizeBehaviour[postProcessPass.type]) {
        setPostProcessPassSizeBehaviour[postProcessPass.type]?.(postProcessPass, width, height);
        return;
    }
    setPostProcessSinglePassSizeBehaviour(postProcessPass as PostProcessSinglePass, width, height);
}

export function setPostProcessPassRenderTarget(postProcessPass: PostProcessPassBase, renderer: Renderer, camera: Camera, isLastPass: boolean) {
    if (isLastPass) {
        setRendererRenderTarget(renderer, camera.renderTarget, true);
    } else {
        setRendererRenderTarget(renderer, getPostProcessPassRenderTarget(postProcessPass), true);
    }
}

// update

const updatePostProcessPassBehaviour: Partial<Record<PostProcessPassType, (postProcessPass: PostProcessPassBase) => void>> = {
    [PostProcessPassType.BufferVisualizer]: updateBufferVisualizerPass,
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function updatePostProcessPass(postProcessPass: PostProcessPassBase) {
    updatePostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass);
}


// before render

type BeforeRenderPostProcessPassBehaviour = (postProcessPass: PostProcessPassBase) => void;

const beforeRenderPostProcessPassBehaviour: Partial<Record<PostProcessPassType, BeforeRenderPostProcessPassBehaviour>> = {
}

export function beforeRenderPostProcessPass(postProcessPass: PostProcessPassBase) {
    beforeRenderPostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass);
}

// render

export type RenderPostProcessPassBehaviour = (postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs) => void;

export const renderPostProcessSinglePassBehaviour: RenderPostProcessPassBehaviour = (postProcessPass: PostProcessPassBase, { gpu, targetCamera, renderer, prevRenderTarget, isLastPass }: PostProcessPassRenderArgs) => {
    const pass = postProcessPass as PostProcessSinglePass;
    
    // TODO: 整理したい. render時にsetRenderTargetしちゃって問題ない？？
    setPostProcessPassRenderTarget(postProcessPass, renderer, targetCamera, isLastPass);

    // ppの場合はいらない気がする
    updateActorTransform(pass.mesh);
    // this.mesh.$updateTransform();

    // if (!this.material.isCompiledShader) {
    //     this.material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
    //     renderer.checkNeedsBindUniformBufferObjectToMaterial(this.material);
    // }
    postProcessPass.materials.forEach((material) => {
        if (!isCompiledMaterialShader(material)) {
            startMaterial(material, {
                gpu,
                attributeDescriptors: getGeometryAttributeDescriptors(postProcessPass.geometry)
            });
            checkNeedsBindUniformBufferObjectToMaterial(renderer, material);
        }
    });

    // 渡してない場合はなにもしない. src texture がいらないとみなす
    // TODO: 無理やり渡しちゃっても良い気もしなくもない
    if (prevRenderTarget) {
        setMaterialUniformValue(pass.material, UniformNames.SrcTexture, prevRenderTarget.texture);
    }

    beforeRenderPostProcessPass(postProcessPass);

    renderMesh(renderer, postProcessPass.geometry, pass.material);
} 

const renderPostProcessPassBehaviour: Partial<Record<PostProcessPassType, (postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs) => void>> = {
    [PostProcessPassType.Bloom]: renderBloomPass,
    [PostProcessPassType.BufferVisualizer]: renderBufferVisualizerPass,
    [PostProcessPassType.ChromaticAberration]: renderChromaticAberrationPass,
    [PostProcessPassType.Fog]: renderFogPass,
    [PostProcessPassType.DepthOfField]: renderDepthOfFieldPass,
    [PostProcessPassType.GaussianBlur]: renderGaussianBlurPass,
    [PostProcessPassType.Glitch]: renderGlitchPass,
    [PostProcessPassType.LightShaft]: renderLightShaftPass,
    [PostProcessPassType.ScreenSpaceShadow]: renderScreenShadowPass,
    [PostProcessPassType.SSAO]: renderSSAOPass,
    [PostProcessPassType.SSR]: renderSSRPass,
    [PostProcessPassType.Streak]: renderStreakPass,
    [PostProcessPassType.Vignette]: renderVignettePass,
    [PostProcessPassType.VolumetricLight]: renderVolumetricLightPass,
}

export function renderPostProcessPass(postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs): void {
    if(renderPostProcessPassBehaviour[postProcessPass.type]) {
        renderPostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass, args);
        return;
    }
    renderPostProcessSinglePassBehaviour(postProcessPass, args);
}

// get render target

type GetPostProcessPassRenderTargetBehaviour = (postProcessPass: PostProcessPassBase) => RenderTarget;

const getPostProcessPassRenderTargetBehaviour: Partial<Record<PostProcessPassType, GetPostProcessPassRenderTargetBehaviour>> = {
    [PostProcessPassType.Bloom]: getBloomPassRenderTarget,
    [PostProcessPassType.BufferVisualizer]: getBufferVisualizerPassRenderTarget,
    [PostProcessPassType.DepthOfField]: getDepthOfFieldPassRenderTarget,
    [PostProcessPassType.LightShaft]: getLightShaftPassRenderTarget,
    [PostProcessPassType.Streak]: getStreakPassRenderTarget,
}

export function getPostProcessPassRenderTarget(postProcessPass: PostProcessPassBase) : RenderTarget {
    if (getPostProcessPassRenderTargetBehaviour[postProcessPass.type]) {
        const f = getPostProcessPassRenderTargetBehaviour[postProcessPass.type]!;
        return f(postProcessPass);
    }
    return (postProcessPass as PostProcessSinglePass).renderTarget;
}
