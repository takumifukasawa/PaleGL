import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry';
import dofCircleOfConfusionFragmentShader from '@/PaleGL/shaders/dof-circle-of-confusion-fragment.glsl';
import dofPreFilterFragmentShader from '@/PaleGL/shaders/dof-pre-filter-fragment.glsl';
import dofBokehFragmentShader from '@/PaleGL/shaders/dof-bokeh-fragment.glsl';
import dofBokehBlurFragmentShader from '@/PaleGL/shaders/dof-bokeh-blur-fragment.glsl';
import dofCompositeFragmentShader from '@/PaleGL/shaders/dof-composite-fragment.glsl';
import { createVector2, createVector2Zero } from '@/PaleGL/math/vector2.ts';
import {
    createPostProcessPassBase,
    getPostProcessCommonUniforms,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { renderPostProcessPass, setPostProcessPassSize } from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';

const UNIFORM_NAME_COC_TEXTURE = 'uCocTexture';
const UNIFORM_NAME_DOF_TEXTURE = 'uDofTexture';

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//

export type DepthOfFieldPassParameters = {
    focusDistance: number;
    focusRange: number;
    bokehRadius: number;
};

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
                name: UniformNames.SrcTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: 'uFocusDistance',
                type: UniformTypes.Float,
                value: focusDistance,
            },
            {
                name: 'uFocusRange',
                type: UniformTypes.Float,
                value: focusRange,
            },
            {
                name: 'uBokehRadius',
                type: UniformTypes.Float,
                value: bokehRadius,
            },
            // {
            //     name: 'uCocParams',
            //     type: UniformTypes.Vector4,
            //     value: Vector4.zero,
            // },
            ...getPostProcessCommonUniforms(),
        ],
        uniformBlockNames: [
            // UniformBlockNames.Transformations,
            UniformBlockNames.Camera,
        ],
        // NOTE: r11f_g11f_b10fだとunsignedなのでr16fにする
        // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        // renderTargetType: RenderTargetTypes.RGBA16F
        renderTargetType: RenderTargetTypes.R16F,
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
            // [UniformNames.SrcTexture]: {
            //     type: UniformTypes.Texture,
            //     value: null,
            // },
            // [UniformNames.DepthTexture]: {
            //     type: UniformTypes.Texture,
            //     value: null,
            // },
            // uFocusDistance: {
            //     type: UniformTypes.Float,
            //     value: this.focusDistance,
            // },
            // uFocusRange: {
            //     type: UniformTypes.Float,
            //     value: this.focusRange,
            // }
            {
                name: UNIFORM_NAME_COC_TEXTURE,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UniformNames.TexelSize,
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            ...getPostProcessCommonUniforms(),
        ],
        // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        renderTargetType: RenderTargetTypes.RGBA16F,
        // renderTargetType: RenderTargetTypes.RGBA
    });
    materials.push(...preFilterPass.materials);

    //
    // dof bokeh pass
    //

    const dofBokehPass = createFragmentPass({
        gpu,
        fragmentShader: dofBokehFragmentShader,
        // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        renderTargetType: RenderTargetTypes.RGBA16F,
        uniforms: [
            // uSrcTextureWidth: {
            //     type: UniformTypes.Float,
            //     value: 1,
            // },
            // uSrcTextureHeight: {
            //     type: UniformTypes.Float,
            //     value: 1,
            // },
            {
                name: 'uTexelSize',
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            {
                name: 'uBokehRadius',
                type: UniformTypes.Float,
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
        // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        renderTargetType: RenderTargetTypes.RGBA16F,
        uniforms: [
            {
                name: 'uTexelSize',
                type: UniformTypes.Vector2,
                value: createVector2Zero(),
            },
            {
                name: 'uBokehRadius',
                type: UniformTypes.Float,
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
        renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        uniforms: [
            {
                name: UNIFORM_NAME_COC_TEXTURE,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: UNIFORM_NAME_DOF_TEXTURE,
                type: UniformTypes.Texture,
                value: null,
            },
        ],
    });

    materials.push(...compositePass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name: 'DepthOfFieldPass',
            type: PostProcessPassType.DepthOfField,
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
//     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.CameraNear, cameras.near);
//     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.CameraFar, cameras.far);
//     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.DepthTexture, depthTexture);
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
        UniformNames.TexelSize,
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
