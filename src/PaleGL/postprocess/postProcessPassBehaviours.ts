import { updateActorTransform } from '@/PaleGL/actors/actorBehaviours.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { POST_PROCESS_PASS_TYPE_BLOOM, POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER, POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION, POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD, POST_PROCESS_PASS_TYPE_FOG, POST_PROCESS_PASS_TYPE_GAUSSIAN_BLUR, POST_PROCESS_PASS_TYPE_GLITCH, POST_PROCESS_PASS_TYPE_LIGHT_SHAFT, POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW, POST_PROCESS_PASS_TYPE_SSAO, POST_PROCESS_PASS_TYPE_SSR, POST_PROCESS_PASS_TYPE_STREAK, POST_PROCESS_PASS_TYPE_VIGNETTE, POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT, PostProcessPassType, UNIFORM_NAME_TARGET_WIDTH, UNIFORM_NAME_TARGET_HEIGHT, UNIFORM_NAME_TEXEL_SIZE, UNIFORM_NAME_ASPECT, UNIFORM_NAME_SRC_TEXTURE,
    POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS
} from '@/PaleGL/constants.ts';
import { Renderer, renderMesh, setRenderTargetToRendererAndClear, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import { RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { getBloomPassRenderTarget, renderBloomPass, setBloomPassSize } from '@/PaleGL/postprocess/bloomPass.ts';
import { renderChromaticAberrationPass } from '@/PaleGL/postprocess/chromaticAberrationPass.ts';
import {
    getDepthOfFieldPassRenderTarget,
    renderDepthOfFieldPass,
    setDepthOfFieldPassSize,
} from '@/PaleGL/postprocess/depthOfFieldPass.ts';
import { renderFogPass } from '@/PaleGL/postprocess/fogPass.ts';
import { renderGaussianBlurPass } from '@/PaleGL/postprocess/gaussianBlurPass.ts';
import { renderGlitchPass } from '@/PaleGL/postprocess/glitchPass.ts';
import {
    getLightShaftPassRenderTarget,
    renderLightShaftPass,
    setLightShaftPassSize,
} from '@/PaleGL/postprocess/lightShaftPass.ts';
import {
    PostProcessPassBase,
    PostProcessPassRenderArgs,
    PostProcessSinglePass,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    getScreenSpaceShadowRenderTargetTexture,
    renderScreenShadowPass,
    setScreenSpaceShadowPassSize,
} from '@/PaleGL/postprocess/screenSpaceShadowPass.ts';
import { renderSSAOPass } from '@/PaleGL/postprocess/ssaoPass.ts';
import { renderSSRPass } from '@/PaleGL/postprocess/ssrPass.ts';
import { getStreakPassRenderTarget, renderStreakPass, setStreakPassSize } from '@/PaleGL/postprocess/streakPass.ts';
import { renderVignettePass } from '@/PaleGL/postprocess/vignettePass.ts';
import { renderVolumetricLightPass, setVolumetricLightPassSize } from '@/PaleGL/postprocess/volumetricLightPass.ts';
// 条件付きインポート: 開発時のみ bufferVisualizerPass を読み込み
import { Texture } from '@/PaleGL/core/texture.ts';
import {
    getBufferVisualizerPassRenderTarget,
    renderBufferVisualizerPass,
    setBufferVisualizerPassSize,
    updateBufferVisualizerPass,
} from '@/PaleGL/postprocess/bufferVisualizerPass.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { renderColorCurtainPass } from '@/PaleGL/postprocess/colorCurtainPass.ts';

// set size ------------------------------------

export type PostProcessPass = PostProcessPassBase | PostProcessSinglePass;

export type SetPostProcessPassSizeBehaviour = (postProcessPass: PostProcessPass, width: number, height: number) => void;

// 特に指定がないときはsingle-passとみなす
export const setPostProcessSinglePassSizeBehaviour: SetPostProcessPassSizeBehaviour = (
    pass: PostProcessPassBase,
    width: number,
    height: number
) => {
    const postProcessPass = pass as PostProcessSinglePass;
    postProcessPass.width = width;
    postProcessPass.height = height;
    const renderTarget = getPostProcessPassRenderTarget(postProcessPass);
    setRenderTargetSize(renderTarget, width, height);
    // setRenderTargetSize(postProcessPass.renderTarget, width, height);
    // TODO: pass base で更新しちゃって大丈夫？
    setMaterialUniformValue(postProcessPass.material, UNIFORM_NAME_TARGET_WIDTH, postProcessPass.width);
    setMaterialUniformValue(postProcessPass.material, UNIFORM_NAME_TARGET_HEIGHT, postProcessPass.height);
    setMaterialUniformValue(
        postProcessPass.material,
        UNIFORM_NAME_TEXEL_SIZE,
        postProcessPass.width / postProcessPass.height
    );
    // TODO: いらない？
    setMaterialUniformValue(
        postProcessPass.material,
        UNIFORM_NAME_ASPECT,
        postProcessPass.width / postProcessPass.height
    );
};

// 動的にBufferVisualizerのビヘイビアを設定
const createSetPostProcessPassSizeBehaviour = (): Partial<
    Record<PostProcessPassType, SetPostProcessPassSizeBehaviour>
> => {
    const behaviours: Partial<Record<PostProcessPassType, SetPostProcessPassSizeBehaviour>> = {
        [POST_PROCESS_PASS_TYPE_BLOOM]: setBloomPassSize,
        [POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD]: setDepthOfFieldPassSize,
        [POST_PROCESS_PASS_TYPE_LIGHT_SHAFT]: setLightShaftPassSize,
        [POST_PROCESS_PASS_TYPE_STREAK]: setStreakPassSize,
        [POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW]: setScreenSpaceShadowPassSize,
        [POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT]: setVolumetricLightPassSize,
    };

    if (isDevelopment()) {
        behaviours[POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER] = setBufferVisualizerPassSize;
    }

    return behaviours;
};

export const setPostProcessPassSizeBehaviour = createSetPostProcessPassSizeBehaviour();

export const setPostProcessPassSize = (postProcessPass: PostProcessPassBase, width: number, height: number) => {
    if (setPostProcessPassSizeBehaviour[postProcessPass.type]) {
        setPostProcessPassSizeBehaviour[postProcessPass.type]?.(postProcessPass, width, height);
        return;
    }
    setPostProcessSinglePassSizeBehaviour(postProcessPass as PostProcessSinglePass, width, height);
}

export const setPostProcessPassRenderTarget = (
    postProcessPass: PostProcessPassBase,
    renderer: Renderer,
    camera: Camera,
    isLastPass: boolean
) => {
    if (isLastPass) {
        setRenderTargetToRendererAndClear(renderer, camera.renderTarget, true);
    } else {
        setRenderTargetToRendererAndClear(renderer, getPostProcessPassRenderTarget(postProcessPass), true);
    }
}

// update ------------------------------------

// 動的にBufferVisualizerのアップデートビヘイビアを設定
const createUpdatePostProcessPassBehaviour = (): Partial<
    Record<PostProcessPassType, (postProcessPass: PostProcessPassBase) => void>
> => {
    const behaviours: Partial<Record<PostProcessPassType, (postProcessPass: PostProcessPassBase) => void>> = {};

    // 開発時のみBufferVisualizerを追加
    if (isDevelopment()) {
        behaviours[POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER] = updateBufferVisualizerPass;
    }

    return behaviours;
};

const updatePostProcessPassBehaviour = createUpdatePostProcessPassBehaviour();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updatePostProcessPass = (postProcessPass: PostProcessPassBase) => {
    updatePostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass);
}

// before render ------------------------------------

type BeforeRenderPostProcessPassBehaviour = (postProcessPass: PostProcessPassBase) => void;

const beforeRenderPostProcessPassBehaviour: Partial<Record<PostProcessPassType, BeforeRenderPostProcessPassBehaviour>> =
    {};

export const beforeRenderPostProcessPass = (postProcessPass: PostProcessPassBase) => {
    beforeRenderPostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass);
}

// render ------------------------------------

export type RenderPostProcessPassBehaviour = (
    postProcessPass: PostProcessPassBase,
    args: PostProcessPassRenderArgs
) => void;

export const renderPostProcessSinglePassBehaviour: RenderPostProcessPassBehaviour = (
    postProcessPass: PostProcessPassBase,
    { gpu, targetCamera, renderer, prevRenderTarget, isLastPass }: PostProcessPassRenderArgs
) => {
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
        tryStartMaterial(gpu, renderer, postProcessPass.geometry, material);
    });

    // 渡してない場合はなにもしない. src texture がいらないとみなす
    // TODO: 無理やり渡しちゃっても良い気もしなくもない
    if (prevRenderTarget) {
        setMaterialUniformValue(pass.material, UNIFORM_NAME_SRC_TEXTURE, prevRenderTarget.texture);
    }

    beforeRenderPostProcessPass(postProcessPass);

    renderMesh(renderer, postProcessPass.geometry, pass.material);
};

// 動的にBufferVisualizerのレンダービヘイビアを設定
const createRenderPostProcessPassBehaviour = (): Partial<
    Record<PostProcessPassType, (postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs) => void>
> => {
    const behaviours: Partial<
        Record<PostProcessPassType, (postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs) => void>
    > = {
        [POST_PROCESS_PASS_TYPE_BLOOM]: renderBloomPass,
        [POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION]: renderChromaticAberrationPass,
        [POST_PROCESS_PASS_TYPE_FOG]: renderFogPass,
        [POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD]: renderDepthOfFieldPass,
        [POST_PROCESS_PASS_TYPE_GAUSSIAN_BLUR]: renderGaussianBlurPass,
        [POST_PROCESS_PASS_TYPE_GLITCH]: renderGlitchPass,
        [POST_PROCESS_PASS_TYPE_LIGHT_SHAFT]: renderLightShaftPass,
        [POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW]: renderScreenShadowPass,
        [POST_PROCESS_PASS_TYPE_SSAO]: renderSSAOPass,
        [POST_PROCESS_PASS_TYPE_SSR]: renderSSRPass,
        [POST_PROCESS_PASS_TYPE_STREAK]: renderStreakPass,
        [POST_PROCESS_PASS_TYPE_VIGNETTE]: renderVignettePass,
        [POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT]: renderVolumetricLightPass,
        [POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS]: renderColorCurtainPass
    };

    // 開発時のみBufferVisualizerを追加
    if (isDevelopment()) {
        behaviours[POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER] = renderBufferVisualizerPass;
    }

    return behaviours;
};

const renderPostProcessPassBehaviour = createRenderPostProcessPassBehaviour();

export const renderPostProcessPass = (postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs): void => {
    if (renderPostProcessPassBehaviour[postProcessPass.type]) {
        renderPostProcessPassBehaviour[postProcessPass.type]?.(postProcessPass, args);
        return;
    }
    renderPostProcessSinglePassBehaviour(postProcessPass, args);
}

// get render target ------------------------------------

type GetPostProcessPassRenderTargetBehaviour = (postProcessPass: PostProcessPassBase) => RenderTarget;

// 動的にBufferVisualizerのレンダーターゲットビヘイビアを設定
const createGetPostProcessPassRenderTargetBehaviour = (): Partial<
    Record<PostProcessPassType, GetPostProcessPassRenderTargetBehaviour>
> => {
    const behaviours: Partial<Record<PostProcessPassType, GetPostProcessPassRenderTargetBehaviour>> = {
        [POST_PROCESS_PASS_TYPE_BLOOM]: getBloomPassRenderTarget,
        [POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD]: getDepthOfFieldPassRenderTarget,
        [POST_PROCESS_PASS_TYPE_LIGHT_SHAFT]: getLightShaftPassRenderTarget,
        [POST_PROCESS_PASS_TYPE_STREAK]: getStreakPassRenderTarget,
    };

    // 開発時のみBufferVisualizerを追加
    if (isDevelopment()) {
        behaviours[POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER] = getBufferVisualizerPassRenderTarget;
    }

    return behaviours;
};

const getPostProcessPassRenderTargetBehaviour = createGetPostProcessPassRenderTargetBehaviour();

export const getPostProcessPassRenderTarget = (postProcessPass: PostProcessPassBase): RenderTarget => {
    if (getPostProcessPassRenderTargetBehaviour[postProcessPass.type]) {
        const f = getPostProcessPassRenderTargetBehaviour[postProcessPass.type]!;
        return f(postProcessPass);
    }
    return (postProcessPass as PostProcessSinglePass).renderTarget;
}

// get render target texture ------------------------------------

type GetPostProcessPassRenderTargetTextureBehaviour = (postProcessPass: PostProcessPassBase) => Texture | null;

const getPostProcessPassRenderTargetTextureBehaviour: Partial<
    Record<PostProcessPassType, GetPostProcessPassRenderTargetTextureBehaviour>
> = {
    [POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW]: getScreenSpaceShadowRenderTargetTexture,
};

export const getPostProcessPassRenderTargetTexture = (postProcessPass: PostProcessPassBase): Texture | null => {
    if (getPostProcessPassRenderTargetTextureBehaviour[postProcessPass.type]) {
        const f = getPostProcessPassRenderTargetTextureBehaviour[postProcessPass.type]!;
        return f(postProcessPass);
    }
    return getPostProcessPassRenderTarget(postProcessPass).texture;
}
