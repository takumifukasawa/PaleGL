import { NeedsShorten } from '@/Marionetter/types';
import { createShortenKit, makeLongKeyMap, ShortNamesFor } from '@/Marionetter/types/makePropMap.ts';
import {
    POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD,
    RENDER_TARGET_TYPE_R16F,
    RENDER_TARGET_TYPE_RGBA16F,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,
    UNIFORM_NAME_SRC_TEXTURE,
    UNIFORM_NAME_DEPTH_TEXTURE,
    UNIFORM_NAME_TEXEL_SIZE,
} from '@/PaleGL/constants';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material';
import { createVector2, createVector2Zero } from '@/PaleGL/math/vector2.ts';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
import {
    createPostProcessPassBase,
    getPostProcessCommonUniforms,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessPass, setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import dofBokehBlurFragmentShader from '@/PaleGL/shaders/dof-bokeh-blur-fragment.glsl';
import dofBokehFragmentShader from '@/PaleGL/shaders/dof-bokeh-fragment.glsl';
import dofCircleOfConfusionFragmentShader from '@/PaleGL/shaders/dof-circle-of-confusion-fragment.glsl';
import dofCompositeFragmentShader from '@/PaleGL/shaders/dof-composite-fragment.glsl';
import dofPreFilterFragmentShader from '@/PaleGL/shaders/dof-pre-filter-fragment.glsl';

const UNIFORM_NAME_COC_TEXTURE = 'uCocTexture';
const UNIFORM_NAME_DOF_TEXTURE = 'uDofTexture';

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//

// ---

// ---- Type（既存）----
export type DepthOfFieldPassParameters = {
    enabled: boolean;
    focusDistance: number;
    focusRange: number;
    bokehRadius: number;
};

// ---- Short names（C#定数に完全一致）----
export const DepthOfField_ShortNames = {
    enabled: 'dof_on',
    focusDistance: 'dof_fd',
    focusRange: 'dof_fr',
    bokehRadius: 'dof_br',
} as const satisfies ShortNamesFor<DepthOfFieldPassParameters>;

// ---- 派生（テンプレ同様）----
const DepthOfField = createShortenKit<DepthOfFieldPassParameters>()(DepthOfField_ShortNames);

// NeedsShorten に応じた「元キー -> 実キー」マップ（short/long 切替）
export const DepthOfFieldPassParametersPropertyMap = DepthOfField.map(NeedsShorten);

// 常に long キー（論理キー）
export const DepthOfFieldPassParametersKey = makeLongKeyMap(DepthOfField_ShortNames);

// 任意：キーのユニオン／拡張型
export type DepthOfFieldPassParametersKey = keyof typeof DepthOfFieldPassParametersKey;
export type DepthOfFieldPassParametersProperty = typeof DepthOfField.type;

// ---

export type DepthOfFieldPassArgs = PostProcessPassParametersBaseArgs & Partial<DepthOfFieldPassParameters>;

export type DepthOfFieldPass = PostProcessPassBase &
    DepthOfFieldPassParameters & {
        circleOfConfusionPass: FragmentPass;
        preFilterPass: FragmentPass;
        dofBokehPass: FragmentPass;
        bokehBlurPass: FragmentPass;
        compositePass: FragmentPass;
    };

export function createDepthOfFieldPass(args: DepthOfFieldPassArgs) {
    const { gpu, enabled } = args;

    const focusDistance = args.focusDistance ?? 14;
    const focusRange = args.focusRange ?? 10;
    const bokehRadius = args.bokehRadius ?? 4;

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    const materials: Material[] = [];

    // circle of confusion pass

    // TODO: RHalf format
    const circleOfConfusionPass = createFragmentPass({
        name: 'circleOfConfusionPass',
        gpu,
        fragmentShader: dofCircleOfConfusionFragmentShader,
        uniforms: [
            {
                name: UNIFORM_NAME_SRC_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: UNIFORM_NAME_DEPTH_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: 'uFocusDistance',
                type: UNIFORM_TYPE_FLOAT,
                value: focusDistance,
            },
            {
                name: 'uFocusRange',
                type: UNIFORM_TYPE_FLOAT,
                value: focusRange,
            },
            {
                name: 'uBokehRadius',
                type: UNIFORM_TYPE_FLOAT,
                value: bokehRadius,
            },
            // {
            //     name: 'uCocParams',
            //     type: UNIFORM_TYPE_VECTOR4,
            //     value: Vector4.zero,
            // },
            ...getPostProcessCommonUniforms(),
        ],
        uniformBlockNames: [
            // UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
            UNIFORM_BLOCK_NAME_CAMERA,
        ],
        // NOTE: r11f_g11f_b10fだとunsignedなのでr16fにする
        // renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
        // renderTargetType: RENDER_TARGET_TYPE_RGBA16F
        renderTargetType: RENDER_TARGET_TYPE_R16F,
        // renderTargetType: RenderTargetTypes.RGBA
    });
    materials.push(...circleOfConfusionPass.materials);

    //
    // prefilter
    //

    // TODO: RHalf format
    const preFilterPass = createFragmentPass({
        gpu,
        fragmentShader: dofPreFilterFragmentShader,
        uniforms: [
            // [UNIFORM_NAME_SRC_TEXTURE]: {
            //     type: UNIFORM_TYPE_TEXTURE,
            //     value: null,
            // },
            // [UNIFORM_NAME_DEPTH_TEXTURE]: {
            //     type: UNIFORM_TYPE_TEXTURE,
            //     value: null,
            // },
            // uFocusDistance: {
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: this.focusDistance,
            // },
            // uFocusRange: {
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: this.focusRange,
            // }
            {
                name: UNIFORM_NAME_COC_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: UNIFORM_NAME_TEXEL_SIZE,
                type: UNIFORM_TYPE_VECTOR2,
                value: createVector2Zero(),
            },
            ...getPostProcessCommonUniforms(),
        ],
        // renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
        renderTargetType: RENDER_TARGET_TYPE_RGBA16F,
        // renderTargetType: RenderTargetTypes.RGBA
    });
    materials.push(...preFilterPass.materials);

    //
    // dof bokeh pass
    //

    const dofBokehPass = createFragmentPass({
        gpu,
        fragmentShader: dofBokehFragmentShader,
        // renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
        renderTargetType: RENDER_TARGET_TYPE_RGBA16F,
        uniforms: [
            // uSrcTextureWidth: {
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 1,
            // },
            // uSrcTextureHeight: {
            //     type: UNIFORM_TYPE_FLOAT,
            //     value: 1,
            // },
            {
                name: 'uTexelSize',
                type: UNIFORM_TYPE_VECTOR2,
                value: createVector2Zero(),
            },
            {
                name: 'uBokehRadius',
                type: UNIFORM_TYPE_FLOAT,
                value: bokehRadius,
            },
        ],
    });
    materials.push(...dofBokehPass.materials);

    //
    // bokeh blur pass
    //

    const bokehBlurPass = createFragmentPass({
        gpu,
        fragmentShader: dofBokehBlurFragmentShader,
        // renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
        renderTargetType: RENDER_TARGET_TYPE_RGBA16F,
        uniforms: [
            {
                name: 'uTexelSize',
                type: UNIFORM_TYPE_VECTOR2,
                value: createVector2Zero(),
            },
            {
                name: 'uBokehRadius',
                type: UNIFORM_TYPE_FLOAT,
                value: bokehRadius,
            },
        ],
    });
    materials.push(...bokehBlurPass.materials);

    //
    // composite pass
    //

    const compositePass = createFragmentPass({
        gpu,
        fragmentShader: dofCompositeFragmentShader,
        renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
        uniforms: [
            {
                name: UNIFORM_NAME_COC_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: UNIFORM_NAME_DOF_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
        ],
    });

    materials.push(...compositePass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name: 'DepthOfFieldPass',
            type: POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD,
            geometry,
            materials,
            enabled,
        }),
        circleOfConfusionPass,
        preFilterPass,
        dofBokehPass,
        bokehBlurPass,
        compositePass,
        // parameters
        focusDistance,
        focusRange,
        bokehRadius,
    };
}

export function getDepthOfFieldPassRenderTarget(pass: PostProcessPassBase) {
    // return this.circleOfConfusionPass.renderTarget;
    // return this.preFilterPass.renderTarget;
    // return this.dofBokehPass.renderTarget;
    // return this.bokehBlurPass.renderTarget;
    return (pass as DepthOfFieldPass).compositePass.renderTarget;
}

// /**
//  *
//  */
// setup() {
//     // this.circleOfConfusionPass.material.uniforms.setValue(UNIFORM_NAME_CAMERA_NEAR, cameras.near);
//     // this.circleOfConfusionPass.material.uniforms.setValue(UNIFORM_NAME_CAMERA_FAR, cameras.far);
//     // this.circleOfConfusionPass.material.uniforms.setValue(UNIFORM_NAME_DEPTH_TEXTURE, depthTexture);
// }

export function setDepthOfFieldPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const depthOfFieldPass = postProcessPass as DepthOfFieldPass;

    const w = Math.floor(width);
    const h = Math.floor(height);

    depthOfFieldPass.width = w;
    depthOfFieldPass.height = h;

    const downResolution = 2;
    const rw = Math.floor(w / downResolution);
    const rh = Math.floor(h / downResolution);

    setPostProcessPassSize(depthOfFieldPass.circleOfConfusionPass, rw, rh);
    setPostProcessPassSize(depthOfFieldPass.preFilterPass, rw, rh);
    setPostProcessPassSize(depthOfFieldPass.dofBokehPass, rw, rh);
    setPostProcessPassSize(depthOfFieldPass.bokehBlurPass, rw, rh);
    setPostProcessPassSize(depthOfFieldPass.compositePass, width, height);
}

export function renderDepthOfFieldPass(
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
    const depthOfFieldPass = postProcessPass as DepthOfFieldPass;

    // // 一回だけ呼びたい
    // this.geometry.start();
    // // ppの場合はいらない気がする
    // // this.mesh.updateTransform();

    //
    // 0: render coc pass
    //

    setMaterialUniformValue(
        depthOfFieldPass.circleOfConfusionPass.material,
        'uFocusDistance',
        depthOfFieldPass.focusDistance
    );
    setMaterialUniformValue(
        depthOfFieldPass.circleOfConfusionPass.material,
        'uFocusRange',
        depthOfFieldPass.focusRange
    );
    setMaterialUniformValue(
        depthOfFieldPass.circleOfConfusionPass.material,
        'uBokehRadius',
        depthOfFieldPass.bokehRadius
    );

    renderPostProcessPass(depthOfFieldPass.circleOfConfusionPass, {
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
    // 1: render prefilter pass
    //

    setMaterialUniformValue(
        depthOfFieldPass.preFilterPass.material,
        UNIFORM_NAME_COC_TEXTURE,
        depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
    );

    setMaterialUniformValue(
        depthOfFieldPass.preFilterPass.material,
        UNIFORM_NAME_TEXEL_SIZE,
        createVector2(1 / depthOfFieldPass.preFilterPass.width, 1 / depthOfFieldPass.preFilterPass.height)
    );

    renderPostProcessPass(depthOfFieldPass.preFilterPass, {
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
    // 2: render dof bokeh pass
    //

    // this.dofBokehPass.material.uniforms.setValue('uCocTexture', this.circleOfConfusionPass.renderTarget.$getTexture());
    setMaterialUniformValue(
        depthOfFieldPass.dofBokehPass.material,
        'uTexelSize',
        createVector2(1 / depthOfFieldPass.preFilterPass.width, 1 / depthOfFieldPass.preFilterPass.height)
    );
    setMaterialUniformValue(depthOfFieldPass.dofBokehPass.material, 'uBokehRadius', depthOfFieldPass.bokehRadius);

    renderPostProcessPass(depthOfFieldPass.dofBokehPass, {
        gpu,
        camera,
        renderer,
        // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
        prevRenderTarget: depthOfFieldPass.preFilterPass.renderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    //
    // 3: render bokeh blur pass
    //

    setMaterialUniformValue(
        depthOfFieldPass.bokehBlurPass.material,
        'uTexelSize',
        // new Vector2(1 / this.bokehBlurPass.width, 1 / this.bokehBlurPass.height)
        createVector2(1 / depthOfFieldPass.dofBokehPass.width, 1 / depthOfFieldPass.dofBokehPass.height)
    );
    setMaterialUniformValue(depthOfFieldPass.bokehBlurPass.material, 'uBokehRadius', depthOfFieldPass.bokehRadius);

    renderPostProcessPass(depthOfFieldPass.bokehBlurPass, {
        gpu,
        camera,
        renderer,
        // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
        prevRenderTarget: depthOfFieldPass.dofBokehPass.renderTarget,
        isLastPass: false,
        targetCamera,
        gBufferRenderTargets,
        time,
    });

    //
    // 4: render composite pass
    //

    // this.compositePass.material.uniforms.setValue('uCocTexture', this.preFilterPass.renderTarget.$getTexture());
    setMaterialUniformValue(
        depthOfFieldPass.compositePass.material,
        UNIFORM_NAME_COC_TEXTURE,
        depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
    );
    setMaterialUniformValue(
        depthOfFieldPass.compositePass.material,
        UNIFORM_NAME_DOF_TEXTURE,
        depthOfFieldPass.bokehBlurPass.renderTarget.texture
    );

    renderPostProcessPass(depthOfFieldPass.compositePass, {
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
