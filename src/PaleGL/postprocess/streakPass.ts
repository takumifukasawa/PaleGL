import { NeedsShorten } from '@/Marionetter/types';
import {
    POST_PROCESS_PASS_TYPE_STREAK,
    RENDER_TARGET_TYPE_R11F_G11F_B10F,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,
    UNIFORM_TYPE_COLOR,
    UNIFORM_NAME_SRC_TEXTURE,
    UNIFORM_NAME_TEXEL_SIZE,
} from '@/PaleGL/constants';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { Color, createColorWhite } from '@/PaleGL/math/color.ts';
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
import streakCompositeFragmentShader from '@/PaleGL/shaders/streak-composite-fragment.glsl';
import streakDownSampleFragmentShader from '@/PaleGL/shaders/streak-down-sample-fragment.glsl';
import streakPrefilterFragmentShader from '@/PaleGL/shaders/streak-prefilter-fragment.glsl';
import streakUpSampleFragmentShader from '@/PaleGL/shaders/streak-up-sample-fragment.glsl';
import { maton } from '@/PaleGL/utilities/maton.ts';

const UNIFORM_NAME_PREV_TEXTURE = 'uPrevTexture';
const UNIFORM_NAME_DOWN_SAMPLE_TEXTURE = 'uDownSampleTexture';
const UNIFORM_NAME_STRETCH = 'uStretch';
const UNIFORM_NAME_HORIZONTAL_SCALE = 'uHorizontalScale';
const UNIFORM_NAME_STREAK_TEXTURE = 'uStreakTexture';
const UNIFORM_NAME_COLOR = 'uColor';
const UNIFORM_NAME_INTENSITY = 'uIntensity';

// const BLUR_PIXEL_NUM = 7;

// ref:
// https://github.com/keijiro/KinoStreak/

// ---

// ---- Type（提示の型を export 化）----
export type StreakPassParameters = {
    enabled: boolean;
    threshold: number;
    stretch: number;
    color: Color;
    intensity: number;
    verticalScale: number;
    horizontalScale: number;
};

// PROPERTY定数: NeedsShortenで出し分け（JSON読み込み用）
export const STREAK_PASS_PARAMETERS_PROPERTY_ENABLED = NeedsShorten ? 'sk_on' : 'enabled';
export const STREAK_PASS_PARAMETERS_PROPERTY_THRESHOLD = NeedsShorten ? 'sk_th' : 'threshold';
export const STREAK_PASS_PARAMETERS_PROPERTY_STRETCH = NeedsShorten ? 'sk_st' : 'stretch';
export const STREAK_PASS_PARAMETERS_PROPERTY_COLOR = NeedsShorten ? 'sk_c' : 'color';
export const STREAK_PASS_PARAMETERS_PROPERTY_INTENSITY = NeedsShorten ? 'sk_i' : 'intensity';
export const STREAK_PASS_PARAMETERS_PROPERTY_VERTICAL_SCALE = NeedsShorten ? 'sk_vs' : 'verticalScale';
export const STREAK_PASS_PARAMETERS_PROPERTY_HORIZONTAL_SCALE = NeedsShorten ? 'sk_hs' : 'horizontalScale';

// KEY定数: 常に元の名前（プロパティアクセス用）
export const STREAK_PASS_PARAMETERS_KEY_ENABLED = 'enabled' as const;
export const STREAK_PASS_PARAMETERS_KEY_THRESHOLD = 'threshold' as const;
export const STREAK_PASS_PARAMETERS_KEY_STRETCH = 'stretch' as const;
export const STREAK_PASS_PARAMETERS_KEY_COLOR = 'color' as const;
export const STREAK_PASS_PARAMETERS_KEY_INTENSITY = 'intensity' as const;
export const STREAK_PASS_PARAMETERS_KEY_VERTICAL_SCALE = 'verticalScale' as const;
export const STREAK_PASS_PARAMETERS_KEY_HORIZONTAL_SCALE = 'horizontalScale' as const;

// ---

export type StreakPass = PostProcessPassBase &
    StreakPassParameters & {
        halfHeight: number;
        prefilterPass: FragmentPass;
        downSamplePasses: DownSamplePass[];
        upSamplePasses: UpSamplePass[];
        compositePass: FragmentPass;
    };

type StreakPassArgs = PostProcessPassParametersBaseArgs & Partial<StreakPassParameters>;

type DownSamplePass = { pass: FragmentPass; prevPass: FragmentPass; downScale: number };
type UpSamplePass = { pass: FragmentPass; prevPass: FragmentPass; downSamplePass: FragmentPass };

export function createStreakPass(args: StreakPassArgs): StreakPass {
    const { gpu, enabled } = args;

    const threshold = args.threshold || 0.9;
    const stretch = args.stretch || 0.5;
    const color = args.color || createColorWhite();
    const intensity = args.intensity || 0.6;
    const verticalScale = args.verticalScale || 1.5;
    const horizontalScale = args.horizontalScale || 1.25;
    // parameters
    // threshold: number = 0.9;
    // stretch: number = 0.5;
    // color: Color = Color.white;
    // intensity: number = 0.6;
    // verticalScale: number = 1.5;
    // horizontalScale: number = 1.25;

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    const materials: Material[] = [];

    const halfHeight: number = 0;

    const prefilterPass = createFragmentPass({
        gpu,
        fragmentShader: streakPrefilterFragmentShader,
        uniforms: [
            {
                name: UNIFORM_NAME_SRC_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: UNIFORM_NAME_TEXEL_SIZE,
                type: UNIFORM_TYPE_VECTOR2,
                value: createVector2Zero(),
            },
            {
                name: 'uThreshold',
                type: UNIFORM_TYPE_FLOAT,
                value: threshold,
            },
            {
                name: 'uVerticalScale',
                type: UNIFORM_TYPE_FLOAT,
                value: verticalScale,
            },
            ...getPostProcessCommonUniforms(),
        ],
        renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
    });
    materials.push(...prefilterPass.materials);

    const downSamplePassInfos = [2, 4, 8, 16, 32].map((downScale) => {
        const pass = createFragmentPass({
            name: `DownSampleMip${downScale}Pass`,
            gpu,
            fragmentShader: streakDownSampleFragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_TEXEL_SIZE,
                    type: UNIFORM_TYPE_VECTOR2,
                    value: createVector2Zero(),
                },
                {
                    name: UNIFORM_NAME_PREV_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_HORIZONTAL_SCALE,
                    type: UNIFORM_TYPE_FLOAT,
                    value: horizontalScale,
                },
                ...getPostProcessCommonUniforms(),
            ],
        });
        materials.push(...pass.materials);
        return { pass, downScale };
    });
    const downSamplePasses: DownSamplePass[] = downSamplePassInfos.map(({ pass, downScale }, i) => {
        return {
            pass,
            prevPass: i === 0 ? prefilterPass : downSamplePassInfos[i - 1].pass,
            downScale,
        };
    });

    const upSamplePassInfos = maton.range(5).map((_, index) => {
        const pass = createFragmentPass({
            name: `UpSampleMip${index}Pass`,
            gpu,
            fragmentShader: streakUpSampleFragmentShader,
            uniforms: [
                {
                    name: UNIFORM_NAME_DOWN_SAMPLE_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_PREV_TEXTURE,
                    type: UNIFORM_TYPE_TEXTURE,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_STRETCH,
                    type: UNIFORM_TYPE_FLOAT,
                    value: stretch,
                },
                ...getPostProcessCommonUniforms(),
            ],
        });
        materials.push(...pass.materials);
        return { pass };
    });

    const upSamplePasses: UpSamplePass[] = upSamplePassInfos.map(({ pass }, index) => {
        return {
            pass,
            prevPass:
                index === 0 ? downSamplePasses[downSamplePasses.length - 1].pass : upSamplePassInfos[index - 1].pass,
            // downSamplePass: this.downSamplePasses[index].pass,
            downSamplePass: downSamplePasses[downSamplePasses.length - 1 - index].pass,
        };
    });

    const compositePass = createFragmentPass({
        gpu,
        fragmentShader: streakCompositeFragmentShader,
        uniforms: [
            {
                name: UNIFORM_NAME_STREAK_TEXTURE,
                type: UNIFORM_TYPE_TEXTURE,
                value: null,
            },
            {
                name: UNIFORM_NAME_COLOR,
                type: UNIFORM_TYPE_COLOR,
                value: color,
            },
            {
                name: UNIFORM_NAME_INTENSITY,
                type: UNIFORM_TYPE_FLOAT,
                value: intensity,
            },
            ...getPostProcessCommonUniforms(),
        ],
        renderTargetType: RENDER_TARGET_TYPE_R11F_G11F_B10F,
    });
    materials.push(...compositePass.materials);

    return {
        ...createPostProcessPassBase({
            gpu,
            name: 'StreakPass',
            type: POST_PROCESS_PASS_TYPE_STREAK,
            geometry,
            materials,
            enabled,
        }),
        halfHeight,
        prefilterPass,
        downSamplePasses,
        upSamplePasses,
        compositePass,
        // parameters
        threshold,
        stretch,
        color,
        intensity,
        verticalScale,
        horizontalScale,
    };
}

export function getStreakPassRenderTarget(PostProcessPass: PostProcessPassBase) {
    return (PostProcessPass as StreakPass).compositePass.renderTarget;
}

export function setStreakPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const streakPass = postProcessPass as StreakPass;

    streakPass.width = width;
    streakPass.height = height;

    // this.extractBrightnessPass.setSize(width, height);

    // this.renderTargetBlurMip4_Horizontal.setSize(this.width / 4, this.height / 4);
    // this.renderTargetBlurMip4_Vertical.setSize(this.width / 4, this.height / 4);
    // this.renderTargetBlurMip8_Horizontal.setSize(this.width / 8, this.height / 8);
    // this.renderTargetBlurMip8_Vertical.setSize(this.width / 8, this.height / 8);
    // this.renderTargetBlurMip16_Horizontal.setSize(this.width / 16, this.height / 16);
    // this.renderTargetBlurMip16_Vertical.setSize(this.width / 16, this.height / 16);
    // this.renderTargetBlurMip32_Horizontal.setSize(this.width / 32, this.height / 32);
    // this.renderTargetBlurMip32_Vertical.setSize(this.width / 32, this.height / 32);
    // this.renderTargetBlurMip64_Horizontal.setSize(this.width / 64, this.height / 64);
    // this.renderTargetBlurMip64_Vertical.setSize(this.width / 64, this.height / 64);

    streakPass.halfHeight = Math.floor(streakPass.height / 2);
    setPostProcessPassSize(streakPass.prefilterPass, streakPass.width, streakPass.halfHeight);
    // this.renderTargetDownSampleMip2.setSize(this.width, this.halfHeight);

    //
    // down sample pass のリサイズはrender時にやる
    //

    setPostProcessPassSize(streakPass.compositePass, streakPass.width, streakPass.height);
}

export function renderStreakPass(
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
    const streakPass = postProcessPass as StreakPass;

    // // 一回だけ呼びたい
    // this.geometry.start();
    // // ppの場合はいらない気がする
    // // this.mesh.updateTransform();

    //
    // prefilter
    //

    setMaterialUniformValue(
        streakPass.prefilterPass.material,
        'uTexelSize',
        createVector2(1 / streakPass.width, 1 / streakPass.height)
    );
    setMaterialUniformValue(streakPass.prefilterPass.material, 'uThreshold', streakPass.threshold);
    setMaterialUniformValue(streakPass.prefilterPass.material, 'uVerticalScale', streakPass.verticalScale);

    renderPostProcessPass(streakPass.prefilterPass, {
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
    // down sample
    //

    streakPass.downSamplePasses.forEach(({ pass, prevPass, downScale }) => {
        const width = Math.floor(streakPass.width / downScale);
        setPostProcessPassSize(pass, width, streakPass.halfHeight);
        setMaterialUniformValue(
            pass.material,
            UNIFORM_NAME_TEXEL_SIZE,
            createVector2(1 / width, 1 / streakPass.halfHeight)
        );
        setMaterialUniformValue(pass.material, UNIFORM_NAME_PREV_TEXTURE, prevPass.renderTarget.texture);
        setMaterialUniformValue(pass.material, UNIFORM_NAME_HORIZONTAL_SCALE, streakPass.horizontalScale);
        renderPostProcessPass(pass, {
            gpu,
            camera,
            renderer,
            prevRenderTarget: null,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    });

    //
    // up sample
    //

    streakPass.upSamplePasses.forEach(({ pass, prevPass, downSamplePass }) => {
        setPostProcessPassSize(pass, downSamplePass.width, downSamplePass.height);
        setMaterialUniformValue(pass.material, UNIFORM_NAME_PREV_TEXTURE, prevPass.renderTarget.texture);
        setMaterialUniformValue(pass.material, UNIFORM_NAME_DOWN_SAMPLE_TEXTURE, downSamplePass.renderTarget.texture);
        setMaterialUniformValue(pass.material, UNIFORM_NAME_STRETCH, streakPass.stretch);
        renderPostProcessPass(pass, {
            gpu,
            camera,
            renderer,
            prevRenderTarget: null,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    });

    //
    // composite
    //

    setMaterialUniformValue(
        streakPass.compositePass.material,
        UNIFORM_NAME_STREAK_TEXTURE,
        // correct
        streakPass.upSamplePasses[streakPass.upSamplePasses.length - 1].pass.renderTarget.texture
        // for debug
        // this.prefilterPass.renderTarget.$getTexture()
    );
    setMaterialUniformValue(streakPass.compositePass.material, UNIFORM_NAME_COLOR, streakPass.color);
    setMaterialUniformValue(streakPass.compositePass.material, UNIFORM_NAME_INTENSITY, streakPass.intensity);

    renderPostProcessPass(streakPass.compositePass, {
        gpu,
        camera,
        renderer,
        // prevRenderTarget: null,
        prevRenderTarget,
        isLastPass,
        targetCamera,
        gBufferRenderTargets,
        time,
    });
}
