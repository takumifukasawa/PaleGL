import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';

import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import lightShaftCompositeFragmentShader from '@/PaleGL/shaders/light-shaft-composite-fragment.glsl';
import lightShaftDownSampleFragmentShader from '@/PaleGL/shaders/light-shaft-down-sample-fragment.glsl';
import lightShaftRadialBlurFragmentShader from '@/PaleGL/shaders/light-shaft-radial-blur-fragment.glsl';
import {
    createPostProcessPassBase,
    getPostProcessCommonUniforms,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { DirectionalLight } from '@/PaleGL/actors/lights/directionalLight.ts';
import { createVector2, createVector2Zero } from '@/PaleGL/math/vector2.ts';
import { transformScreenPoint } from '@/PaleGL/actors/cameras/cameraBehaviours.ts';
import { renderPostProcessPass, setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import { cloneVector3, scaleVector3ByScalar, v3x, v3y } from '@/PaleGL/math/vector3.ts';

const radialBlurOriginUniformName = 'uRadialBlurOrigin';
const radialBlurPassScaleBaseUniformName = 'uRadialBlurPassScaleBase';
const radialBlurPassIndexUniformName = 'uRadialBlurPassIndex';
const radialBlurRayStepStrengthUniformName = 'uRadialBlurRayStepStrength';

type LightShaftPassParameters = {
    ratio: number;
    blendRate: number;
    passScaleBase: number;
    rayStepStrength: number;
};

export type LightShaftPass = PostProcessPassBase & LightShaftPassParameters & {
    directionalLight: DirectionalLight | null;
    lightShaftDownSamplePass: FragmentPass;
    blur1Pass: FragmentPass;
    blur2Pass: FragmentPass;
    blur3Pass: FragmentPass;
    compositePass: FragmentPass;
};

type LightShaftPassParametersArgs = PostProcessPassParametersBaseArgs & Partial<LightShaftPassParameters>;

export function createLightShaftPass(args: LightShaftPassParametersArgs): LightShaftPass {
    const { gpu, enabled, ratio = 0.5 } = args;

    const blendRate = args.blendRate ?? 0.65;
    const passScaleBase = args.passScaleBase ?? 0.2;
    const rayStepStrength = args.rayStepStrength ?? 0.012;
    
    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    const materials: Material[] = [];

    const lightShaftDownSamplePass = createFragmentPass({
        gpu,
        fragmentShader: lightShaftDownSampleFragmentShader,
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        // renderTargetType: RenderTargetTypes.R16F,
        uniforms: [
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            ...getPostProcessCommonUniforms(),
        ],
        // uniforms: {}
    });
    // this.lightShaftDownSamplePass = new RadialBlurPass({
    //     gpu,
    // });

    materials.push(...lightShaftDownSamplePass.materials);

    //
    // blur passes
    //

    // blur 1
    const blur1Pass = createFragmentPass({
        gpu,
        fragmentShader: lightShaftRadialBlurFragmentShader,
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        uniforms: [
            {
                name: radialBlurPassIndexUniformName,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: radialBlurOriginUniformName,
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            {
                name: radialBlurPassScaleBaseUniformName,
                type: UniformTypes.Float,
                value: passScaleBase,
            },
            {
                name: radialBlurRayStepStrengthUniformName,
                type: UniformTypes.Float,
                value: rayStepStrength,
            },
        ],
    });

    materials.push(...blur1Pass.materials);

    // blur 2
    const blur2Pass = createFragmentPass({
        gpu,
        fragmentShader: lightShaftRadialBlurFragmentShader,
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        uniforms: [
            {
                name: radialBlurPassIndexUniformName,
                type: UniformTypes.Float,
                value: 1,
            },
            {
                name: radialBlurOriginUniformName,
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            {
                name: radialBlurPassScaleBaseUniformName,
                type: UniformTypes.Float,
                value: passScaleBase,
            },
            {
                name: radialBlurRayStepStrengthUniformName,
                type: UniformTypes.Float,
                value: rayStepStrength,
            },
        ],
    });

    materials.push(...blur2Pass.materials);

    // blur 3
    const blur3Pass = createFragmentPass({
        gpu,
        fragmentShader: lightShaftRadialBlurFragmentShader,
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        uniforms: [
            {
                name: radialBlurPassIndexUniformName,
                type: UniformTypes.Float,
                value: 2,
            },
            {
                name: radialBlurOriginUniformName,
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            {
                name: radialBlurPassScaleBaseUniformName,
                type: UniformTypes.Float,
                value: passScaleBase,
            },
            {
                name: radialBlurRayStepStrengthUniformName,
                type: UniformTypes.Float,
                value: rayStepStrength,
            },
        ],
    });

    materials.push(...blur3Pass.materials);

    //
    // composite pass
    //

    // TODO: レンダリングに差し込む場合はr11g11b10fがよいはず
    const compositePass = createFragmentPass({
        gpu,
        fragmentShader: lightShaftCompositeFragmentShader,
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        uniforms: [
            {
                name: 'uLightShaftTexture',
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.BlendRate,
                type: UniformTypes.Float,
                value: blendRate,
            },
        ],
    });

    materials.push(...compositePass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name: 'LightShaftPass',
            type: PostProcessPassType.LightShaft,
            geometry,
            materials,
            enabled
        }),
        directionalLight: null,
        lightShaftDownSamplePass,
        blur1Pass,
        blur2Pass,
        blur3Pass,
        compositePass,
        // parameters
        ratio,
        blendRate,
        passScaleBase,
        rayStepStrength,
    };
}

export function getLightShaftPassRenderTarget(postProcessPass: PostProcessPassBase) {
    return (postProcessPass as LightShaftPass).compositePass.renderTarget;
}

export function setLightShaftPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const lightShaftPass = postProcessPass as LightShaftPass;

    const w = width * lightShaftPass.ratio;
    const h = height * lightShaftPass.ratio;

    setPostProcessPassSize(lightShaftPass.lightShaftDownSamplePass, w, h);
    setPostProcessPassSize(lightShaftPass.blur1Pass, w, h);
    setPostProcessPassSize(lightShaftPass.blur2Pass, w, h);
    setPostProcessPassSize(lightShaftPass.blur3Pass, w, h);
    setPostProcessPassSize(lightShaftPass.compositePass, w, h);

    lightShaftPass.width = w;
    lightShaftPass.height = h;
}

export function renderLightShaftPass(
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
) {
    const lightShaftPass = postProcessPass as LightShaftPass;

    // TODO: shadowmapを使った方法からの置き換え

    renderPostProcessPass(lightShaftPass.lightShaftDownSamplePass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    //
    // blur pass
    //

    // -1 ~ 1 (in screen)
    // directional light の位置をそのまま使う場合
    // const lightPositionInClip = targetCamera.transformScreenPoint(this.#directionalLight!.transform.position);
    // 適当に遠いところに飛ばす場合 TODO: directionを考慮。位置だけだとダメ
    const lightPositionInClip = transformScreenPoint(
        targetCamera,
        scaleVector3ByScalar(cloneVector3(lightShaftPass.directionalLight!.transform.position), 10000)
    );
    // 0 ~ 1
    const lightPositionInUv = createVector2(v3x(lightPositionInClip) * 0.5 + 0.5, v3y(lightPositionInClip) * 0.5 + 0.5);
    // this.#directionalLight!.transform.getPositionInScreen(targetCamera);

    setMaterialUniformValue(lightShaftPass.blur1Pass.material, radialBlurOriginUniformName, lightPositionInUv);
    setMaterialUniformValue(
        lightShaftPass.blur1Pass.material,
        radialBlurPassScaleBaseUniformName,
        lightShaftPass.passScaleBase
    );
    setMaterialUniformValue(
        lightShaftPass.blur1Pass.material,
        radialBlurRayStepStrengthUniformName,
        lightShaftPass.rayStepStrength
    );

    setMaterialUniformValue(lightShaftPass.blur2Pass.material, radialBlurOriginUniformName, lightPositionInUv);
    setMaterialUniformValue(
        lightShaftPass.blur2Pass.material,
        radialBlurPassScaleBaseUniformName,
        lightShaftPass.passScaleBase
    );
    setMaterialUniformValue(
        lightShaftPass.blur2Pass.material,
        radialBlurRayStepStrengthUniformName,
        lightShaftPass.rayStepStrength
    );

    setMaterialUniformValue(lightShaftPass.blur3Pass.material, radialBlurOriginUniformName, lightPositionInUv);
    setMaterialUniformValue(
        lightShaftPass.blur3Pass.material,
        radialBlurPassScaleBaseUniformName,
        lightShaftPass.passScaleBase
    );
    setMaterialUniformValue(
        lightShaftPass.blur3Pass.material,
        radialBlurRayStepStrengthUniformName,
        lightShaftPass.rayStepStrength
    );

    renderPostProcessPass(lightShaftPass.blur1Pass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget: lightShaftPass.lightShaftDownSamplePass.renderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });
    renderPostProcessPass(lightShaftPass.blur2Pass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget: lightShaftPass.blur1Pass.renderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });
    renderPostProcessPass(lightShaftPass.blur3Pass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget: lightShaftPass.blur2Pass.renderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    //
    // light shaft composite pass
    //

    setMaterialUniformValue(
        lightShaftPass.compositePass.material,
        'uLightShaftTexture',
        lightShaftPass.blur3Pass.renderTarget.texture
    );
    setMaterialUniformValue(lightShaftPass.compositePass.material, UniformNames.BlendRate, lightShaftPass.blendRate);

    renderPostProcessPass(lightShaftPass.compositePass, {
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
    });
}

export function setLightShaftPassDirectionalLight(lightShaftPass: LightShaftPass, light: DirectionalLight) {
    // light.transform.position
    lightShaftPass.directionalLight = light;
}
