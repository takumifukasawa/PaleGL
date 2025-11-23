import { POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER, UNIFORM_TYPE_TEXTURE, UNIFORM_TYPE_FLOAT, UNIFORM_TYPE_VECTOR2, UNIFORM_TYPE_MATRIX4, UNIFORM_NAME_CAMERA_NEAR, UNIFORM_NAME_CAMERA_FAR, UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX } from '@/PaleGL/constants';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { getDummyBlackTexture, setGPUViewport } from '@/PaleGL/core/gpu.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { addMaterialUniformValue, Material, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
import { createMat4Identity } from '@/PaleGL/math/matrix4.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import { createFragmentPass, FragmentPass } from '@/PaleGL/postprocess/fragmentPass.ts';
import {
    createPostProcessPassBase,
    getPostProcessCommonUniforms,
    PostProcessPassBase,
    PostProcessPassParametersBaseArgs,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/postProcessPassBase.ts';
import {
    getPostProcessPassRenderTarget,
    renderPostProcessPass,
    setPostProcessPassSize,
} from '@/PaleGL/postprocess/postProcessPassBehaviours.ts';
import bufferVisualizerCompositePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-composite-pass-fragment.glsl';
import bufferVisualizerRow0PassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-0-pass-fragment.glsl';
import bufferVisualizerRowBasePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-base-pass-fragment.glsl';

// ------------------------------------------------------------------------------
// constants
// ------------------------------------------------------------------------------

const COL_NUM = 7;
const ROW_NUM = 7;

// Composite pass row texture uniform names (pre-enumerated to avoid dynamic generation)
const ROW_TEXTURE_UNIFORM_NAMES = [
    'uRow0Texture',
    'uRow1Texture',
    'uRow2Texture',
    'uRow3Texture',
    'uRow4Texture',
    'uRow5Texture',
    'uRow6Texture',
] as const;

// Row pass column texture uniform names (pre-enumerated to avoid dynamic generation)
// Note: Shaders only define 6 columns (uTextureCol0-5), not 7
const COL_TEXTURE_UNIFORM_NAMES = [
    'uTextureCol0',
    'uTextureCol1',
    'uTextureCol2',
    'uTextureCol3',
    'uTextureCol4',
    'uTextureCol5',
] as const;

const COL_UV_OFFSET_UNIFORM_NAMES = [
    'uTextureCol0UvOffset',
    'uTextureCol1UvOffset',
    'uTextureCol2UvOffset',
    'uTextureCol3UvOffset',
    'uTextureCol4UvOffset',
    'uTextureCol5UvOffset',
] as const;

const DEPTH_TEXTURE_KEY = 'depthTexture';
const GBUFFER_A_TEXTURE_KEY = 'gBufferATexture';
const GBUFFER_B_TEXTURE_KEY = 'gBufferBTexture';
const GBUFFER_C_TEXTURE_KEY = 'gBufferCTexture';
const GBUFFER_D_TEXTURE_KEY = 'gBufferDTexture';
const DIRECTIONAL_LIGHT_SHADOW_MAP_KEY = 'directionalLightShadowMap';
const SPOT_LIGHT_SHADOW_MAP_KEY = 'spotLightShadowMap';
const SCREEN_SPACE_SHADOW_TEXTURE_KEY = 'screenSpaceShadowTexture';
const AMBIENT_OCCLUSION_TEXTURE_KEY = 'ambientOcclusionTexture';
const DEFERRED_SHADING_TEXTURE_KEY = 'deferredShadingTexture';
const SSR_TEXTURE_KEY = 'ssrTexture';
const LIGHT_SHAFT_TEXTURE_KEY = 'lightShaftTexture';
const VOLUMETRIC_LIGHT_TEXTURE_KEY = 'volumetricLightTexture';
const FOG_TEXTURE_KEY = 'fogTexture';
const DEPTH_OF_FIELD_TEXTURE_KEY = 'depthOfFieldTexture';
const BLOOM_BLUR_MIP4_TEXTURE_KEY = 'bloomBlurMip4Texture';
const BLOOM_BLUR_MIP8_TEXTURE_KEY = 'bloomBlurMip8Texture';
const BLOOM_BLUR_MIP16_TEXTURE_KEY = 'bloomBlurMip16Texture';
const BLOOM_BLUR_MIP32_TEXTURE_KEY = 'bloomBlurMip32Texture';
const BLOOM_BLUR_MIP64_TEXTURE_KEY = 'bloomBlurMip64Texture';
const BLOOM_TEXTURE_KEY = 'bloomTexture';
const STREAK_PREFILTER_TEXTURE_KEY = 'streakPrefilterTexture';
const STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY = 'streakDownSampleMip2Texture';
const STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY = 'streakDownSampleMip4Texture';
const STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY = 'streakDownSampleMip8Texture';
const STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY = 'streakDownSampleMip16Texture';
const STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY = 'streakDownSampleMip32Texture';
const STREAK_UP_SAMPLE_0_TEXTURE_KEY = 'streakUpSample0Texture';
const STREAK_UP_SAMPLE_1_TEXTURE_KEY = 'streakUpSample1Texture';
const STREAK_UP_SAMPLE_2_TEXTURE_KEY = 'streakUpSample2Texture';
const STREAK_UP_SAMPLE_3_TEXTURE_KEY = 'streakUpSample3Texture';
const STREAK_UP_SAMPLE_4_TEXTURE_KEY = 'streakUpSample4Texture';
const STREAK_TEXTURE_KEY = 'streakTexture';

// ------------------------------------------------------------------------------

type RowPass = {
    pass: FragmentPass;
    tiles: Map<
        string,
        {
            label?: string;
            type?: 'Texture' | 'Other';
            uniformNamePrefix?: string;
            // uniformName?: string;
            uniformNameTexture?: string;
            uniformNameUvOffset?: string;
        }
    >;
};

type BufferVisualizerPassParameters = {
    fullViewTextureEnabled: boolean;
};

export type BufferVisualizerPass = PostProcessPassBase &
    BufferVisualizerPassParameters & {
        dom: HTMLDivElement;
        rowPasses: RowPass[];
        compositePass: FragmentPass;
        toggleR: boolean;
    };

type BufferVisualizerPassArgs = PostProcessPassParametersBaseArgs & Partial<BufferVisualizerPassParameters>;

export const createBufferVisualizerPass = (args: BufferVisualizerPassArgs): BufferVisualizerPass => {
    const { gpu, enabled } = args;

    const fullViewTextureEnabled = args.fullViewTextureEnabled || false;

    const rowPasses: RowPass[] = [];
    const materials: Material[] = [];

    const toggleR = true;

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });

    // row 0
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRow0PassFragmentShader,
            uniforms: [
                [UNIFORM_NAME_CAMERA_NEAR, UNIFORM_TYPE_FLOAT, 0.1],
                [UNIFORM_NAME_CAMERA_FAR, UNIFORM_TYPE_FLOAT, 1],
                [UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX, UNIFORM_TYPE_MATRIX4, createMat4Identity()],
                // {
                //     name: 'uDepthTexture',
                //     type: UNIFORM_TYPE_TEXTURE,
                //     value: gpu.dummyTextureBlack,
                // },
            ],
        }),
        tiles: new Map([
            [
                DEPTH_TEXTURE_KEY,
                {
                    label: 'depth',
                    type: 'Texture',
                },
            ],
            [
                'worldPosition',
                {
                    type: 'Other',
                    uniformPrefix: 'uWorldPosition',
                },
            ],
            [
                GBUFFER_A_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_B_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_C_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                GBUFFER_D_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 1
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                DIRECTIONAL_LIGHT_SHADOW_MAP_KEY,
                {
                    type: 'Texture',
                },
            ],

            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}0`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}1`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}2`,
                {
                    type: 'Texture',
                },
            ],
            [
                `${SPOT_LIGHT_SHADOW_MAP_KEY}3`,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 2
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                SCREEN_SPACE_SHADOW_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                AMBIENT_OCCLUSION_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                DEFERRED_SHADING_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                SSR_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'combine ssr',
                },
            ],
        ]),
    });
    // row 3
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                LIGHT_SHAFT_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                VOLUMETRIC_LIGHT_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                FOG_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'combine fog',
                },
            ],
            [
                DEPTH_OF_FIELD_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'dof',
                },
            ],
        ]),
    });
    // row 4
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                BLOOM_BLUR_MIP4_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip4',
                },
            ],
            [
                BLOOM_BLUR_MIP8_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip8',
                },
            ],
            [
                BLOOM_BLUR_MIP16_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip16',
                },
            ],
            [
                BLOOM_BLUR_MIP32_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip32',
                },
            ],
            [
                BLOOM_BLUR_MIP64_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom blur mip64',
                },
            ],
            [
                BLOOM_TEXTURE_KEY,
                {
                    type: 'Texture',
                    label: 'bloom',
                },
            ],
        ]),
    });
    // row 5
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                STREAK_PREFILTER_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });
    // row 6
    rowPasses.push({
        pass: createFragmentPass({
            gpu,
            fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            srcTextureEnabled: false,
        }),
        tiles: new Map([
            [
                STREAK_UP_SAMPLE_0_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_1_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_2_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_3_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_UP_SAMPLE_4_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
            [
                STREAK_TEXTURE_KEY,
                {
                    type: 'Texture',
                },
            ],
        ]),
    });

    const compositePass = createFragmentPass({
        gpu,
        // CUSTOM_BEGIN comment out
        // name: 'BufferVisualizerPass',
        // CUSTOM_END
        fragmentShader: bufferVisualizerCompositePassFragmentShader,
        srcTextureEnabled: false,
        uniforms: [
            ['uFullViewTexture', UNIFORM_TYPE_TEXTURE, getDummyBlackTexture(gpu)],
            ['uFullViewTextureEnabled', UNIFORM_TYPE_FLOAT, 0],
            ...ROW_TEXTURE_UNIFORM_NAMES.map((name) => [name, UNIFORM_TYPE_TEXTURE, getDummyBlackTexture(gpu)]),
            ...getPostProcessCommonUniforms(),
        ] as UniformsData,
    });

    // initialize materials
    rowPasses.forEach(({ pass }) => materials.push(pass.material));
    materials.push(compositePass.material);

    // this.rowPasses.forEach(({ pass, tiles }, rowIndex) => {
    rowPasses.forEach(({ pass, tiles }, i) => {
        let colIndex = 0;
        // pass.material.uniforms.addValue('uTiling', UNIFORM_TYPE_VECTOR2, new Vector2(COL_NUM, ROW_NUM));
        addMaterialUniformValue(pass.material, 'uTiling', UNIFORM_TYPE_VECTOR2, createVector2(COL_NUM, 1));
        for (const [key, tile] of tiles) {
            const uniformNameTexture = tile.uniformNamePrefix || COL_TEXTURE_UNIFORM_NAMES[colIndex];
            const uniformNameUvOffset = COL_UV_OFFSET_UNIFORM_NAMES[colIndex];
            const colOffset = -colIndex;

            if (!tile.uniformNamePrefix) {
                tiles.get(key)!.uniformNamePrefix = COL_TEXTURE_UNIFORM_NAMES[colIndex];
            }

            if (tile.type === 'Texture') {
                tiles.get(key)!.uniformNameTexture = uniformNameTexture;
            }
            tiles.get(key)!.uniformNameUvOffset = uniformNameUvOffset;

            if (i === 0) {
                addMaterialUniformValue(
                    pass.material,
                    uniformNameUvOffset,
                    UNIFORM_TYPE_VECTOR2,
                    createVector2(colOffset, 0)
                );
                if (tile.type === 'Texture') {
                    addMaterialUniformValue(
                        pass.material,
                        uniformNameTexture,
                        UNIFORM_TYPE_TEXTURE,
                        getDummyBlackTexture(gpu)
                    );
                }
            } else {
                addMaterialUniformValue(
                    pass.material,
                    uniformNameUvOffset,
                    UNIFORM_TYPE_VECTOR2,
                    createVector2(colOffset, 0)
                );
                // console.log('hogehoge', pass, key, uniformNameTexture, UNIFORM_TYPE_TEXTURE, gpu.dummyTextureBlack);
                addMaterialUniformValue(
                    pass.material,
                    uniformNameTexture,
                    UNIFORM_TYPE_TEXTURE,
                    getDummyBlackTexture(gpu)
                );
            }

            colIndex++;
        }
    });

    addMaterialUniformValue(compositePass.material, 'uTiling', UNIFORM_TYPE_VECTOR2, createVector2(1, ROW_NUM));

    const styleHeader = document.createElement('style');
    styleHeader.textContent = `
.buffer-visualizer-pass {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: grid;
    grid-template-rows: repeat(${ROW_NUM}, 1fr);
}
.buffer-visualizer-pass.hidden {
    display: none;
}
.buffer-visualizer-pass-tile {
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    font-size: 9px;
    line-height: 1em;
    font-weight: bold;
    text-shadow: 1px 1px #333;
    padding: 4px;
}

.buffer-visualizer-pass-row {
    // display: flex;
    display: grid;
    grid-template-columns: repeat(${COL_NUM}, 1fr);
}
        `;
    document.head.appendChild(styleHeader);

    const dom = document.createElement('div');
    dom.classList.add('buffer-visualizer-pass');
    const frag = document.createDocumentFragment();

    // for debug
    // console.log(this.rowPasses);

    rowPasses.forEach(({ tiles }, rowIndex) => {
        let colIndex = 0;
        const rowContent = document.createElement('div');
        rowContent.classList.add('buffer-visualizer-pass-row');
        for (const [key, tile] of tiles) {
            const newLabel = `[${colIndex}, ${rowIndex}] ${tile.label || key}`;
            const elem = document.createElement('div');
            elem.classList.add('buffer-visualizer-pass-tile');
            const p = document.createElement('p');
            p.textContent = newLabel;
            elem.appendChild(p);
            rowContent.appendChild(elem);
            colIndex++;
        }
        frag.appendChild(rowContent);
    });
    dom.appendChild(frag);
    document.body.appendChild(dom);

    const bufferVisualizerPass: BufferVisualizerPass = {
        ...createPostProcessPassBase({
            gpu,
            // CUSTOM_BEGIN comment out
            // name: 'BufferVisualizerPass',
            // CUSTOM_END
            type: POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER,
            geometry,
            materials,
            enabled: enabled || false,
        }),
        dom,
        rowPasses,
        compositePass,
        toggleR,
        // parameters
        fullViewTextureEnabled,
    };

    hideBufferVisualizerPassDom(bufferVisualizerPass);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'b') {
            bufferVisualizerPass.enabled = !bufferVisualizerPass.enabled;
            bufferVisualizerPass.toggleR = !bufferVisualizerPass.toggleR;
            if (bufferVisualizerPass.enabled) {
                showBufferVisualizerPassDom(bufferVisualizerPass);
            } else {
                hideBufferVisualizerPassDom(bufferVisualizerPass);
            }
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'f') {
            bufferVisualizerPass.fullViewTextureEnabled = !bufferVisualizerPass.fullViewTextureEnabled;
        }
    });

    return bufferVisualizerPass;
}

export function setBufferVisualizerPassSize(postProcessPass: PostProcessPassBase, width: number, height: number) {
    const bufferVisualizerPass = postProcessPass as BufferVisualizerPass;
    bufferVisualizerPass.rowPasses.forEach(({ pass }) => {
        setPostProcessPassSize(pass, width, height / ROW_NUM);
    });
    setPostProcessPassSize(bufferVisualizerPass.compositePass, width, height);

    bufferVisualizerPass.width = width;
    bufferVisualizerPass.height = height;
}

export const showBufferVisualizerPassDom = (bufferVisualizerPass: BufferVisualizerPass) => {
    bufferVisualizerPass.dom.classList.remove('hidden');
}

export const hideBufferVisualizerPassDom = (bufferVisualizerPass: BufferVisualizerPass) => {
    bufferVisualizerPass.dom.classList.add('hidden');
}

export function updateBufferVisualizerPass(postProcessPass: PostProcessPassBase) {
    const bufferVisualizerPass = postProcessPass as BufferVisualizerPass;
    if (bufferVisualizerPass.enabled) {
        showBufferVisualizerPassDom(bufferVisualizerPass);
    } else {
        hideBufferVisualizerPassDom(bufferVisualizerPass);
    }
}

export function renderBufferVisualizerPass(postProcessPass: PostProcessPassBase, args: PostProcessPassRenderArgs) {
    const bufferVisualizerPass = postProcessPass as BufferVisualizerPass;
    const { gpu, renderer, lightActors } = args;

    const tmpRealWidth = renderer.realWidth;
    const tmpRealHeight = renderer.realHeight;

    // this.geometry.start();

    bufferVisualizerPass.rowPasses.forEach(({ pass, tiles }) => {
        if (lightActors?.directionalLight) {
            if (tiles.has(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)) {
                setMaterialUniformValue(
                    pass.material,
                    tiles.get(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)!.uniformNameTexture!,
                    // 'uDirectionalLightShadowMap',
                    lightActors.directionalLight.castShadow
                        ? lightActors.directionalLight.shadowMap!.depthTexture
                        : getDummyBlackTexture(gpu)
                );
            }
        }
        if (lightActors?.spotLights) {
            lightActors.spotLights.forEach((spotLight, i) => {
                const key = `${SPOT_LIGHT_SHADOW_MAP_KEY}${i}`;
                if (tiles.has(key)) {
                    if (spotLight.shadowMap) {
                        setMaterialUniformValue(
                            pass.material,
                            tiles.get(key)!.uniformNameTexture!,
                            spotLight.shadowMap.depthTexture
                        );
                    }
                }
            });
        }

        if (tiles.has(DEPTH_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEPTH_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.depthPrePassRenderTarget.depthTexture
            );
        }

        if (tiles.has(GBUFFER_A_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_A_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferATexture
            );
        }

        if (tiles.has(GBUFFER_B_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_B_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferBTexture
            );
        }

        if (tiles.has(GBUFFER_C_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_C_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferCTexture
            );
        }

        if (tiles.has(GBUFFER_D_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(GBUFFER_D_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.gBufferRenderTargets.gBufferDTexture
            );
        }

        if (tiles.has(SCREEN_SPACE_SHADOW_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(SCREEN_SPACE_SHADOW_TEXTURE_KEY)!.uniformNameTexture!,
                // CUSTOM_BEGIN replace
                // renderer.screenSpaceShadowPass.renderTarget.texture
                renderer.gpu.dummyBlackTextures[0]
                // CUSTOM_END
            );
        }

        if (tiles.has(AMBIENT_OCCLUSION_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(AMBIENT_OCCLUSION_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.ambientOcclusionPass.renderTarget.texture
            );
        }

        if (tiles.has(DEFERRED_SHADING_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEFERRED_SHADING_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.deferredShadingPass.renderTarget.texture
            );
        }

        if (tiles.has(SSR_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(SSR_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.ssrPass.renderTarget.texture
            );
        }

        if (tiles.has(LIGHT_SHAFT_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(LIGHT_SHAFT_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.lightShaftPass).texture
            );
        }

        if (tiles.has(VOLUMETRIC_LIGHT_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(VOLUMETRIC_LIGHT_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.volumetricLightPass.renderTarget.texture
            );
        }

        if (tiles.has(DEPTH_OF_FIELD_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(DEPTH_OF_FIELD_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.depthOfFieldPass).texture
            );
        }

        if (tiles.has(FOG_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(FOG_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.fogPass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_PREFILTER_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_PREFILTER_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.prefilterPass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_2_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[0].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[1].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_8_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[2].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_16_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[3].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_DOWN_SAMPLE_MIP_32_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.downSamplePasses[4].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_0_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_0_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[0].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_1_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_1_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[1].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_2_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_2_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[2].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_3_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_3_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[3].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_UP_SAMPLE_4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_UP_SAMPLE_4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.streakPass.upSamplePasses[4].pass.renderTarget.texture
            );
        }

        if (tiles.has(STREAK_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(STREAK_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.streakPass).texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP4_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP4_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip4_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP8_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP8_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip8_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP16_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP16_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip16_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP32_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP32_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip32_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_BLUR_MIP64_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                tiles.get(BLOOM_BLUR_MIP64_TEXTURE_KEY)!.uniformNameTexture!,
                renderer.bloomPass.renderTargetBlurMip64_Vertical.texture
            );
        }

        if (tiles.has(BLOOM_TEXTURE_KEY)) {
            setMaterialUniformValue(
                pass.material,
                // 'uBloomTexture',
                tiles.get(BLOOM_TEXTURE_KEY)!.uniformNameTexture!,
                getPostProcessPassRenderTarget(renderer.bloomPass).texture
            );
        }
    });

    setMaterialUniformValue(
        bufferVisualizerPass.rowPasses[0].pass.material,
        'uInverseViewProjectionMatrix',
        args.targetCamera.inverseViewProjectionMatrix
    );

    setGPUViewport(gpu, 0, 0, bufferVisualizerPass.width, bufferVisualizerPass.height / ROW_NUM);

    bufferVisualizerPass.rowPasses.forEach(({ pass, tiles }, i) => {
        if (tiles.size > 0) {
            renderPostProcessPass(pass, { ...args, isLastPass: false });
            setMaterialUniformValue(
                bufferVisualizerPass.compositePass.material,
                ROW_TEXTURE_UNIFORM_NAMES[i],
                pass.renderTarget.texture
            );
        }
    });

    // 全画面で出したいテクスチャを任意に指定
    setMaterialUniformValue(
        bufferVisualizerPass.compositePass.material,
        'uFullViewTexture',
        // renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
        // renderer.afterDeferredShadingRenderTarget.texture
        // renderer.gBufferRenderTargets.gBufferDTexture
        renderer.gBufferRenderTargets.gBufferATexture
        // renderer.gBufferRenderTargets.gBufferATexture
        // renderer.gBufferRenderTargets.gBufferATexture
        // renderer.gBufferRenderTargets.gBufferATexture
        // bufferVisualizerPass.toggleR
        //     // ? renderer.depthOfFieldPass.preFilterPass.renderTarget.texture
        //     ? renderer.depthOfFieldPass.preFilterPass.renderTarget.texture
        //     : renderer.depthOfFieldPass.circleOfConfusionPass.renderTarget.texture
    );

    setMaterialUniformValue(
        bufferVisualizerPass.compositePass.material,
        'uFullViewTextureEnabled',
        bufferVisualizerPass.fullViewTextureEnabled ? 1 : 0
    );
    // for debug
    // this.compositePass.material.uniforms.setValue('uFullViewTextureEnabled', 1);

    setGPUViewport(gpu, 0, 0, tmpRealWidth, tmpRealHeight);

    renderPostProcessPass(bufferVisualizerPass.compositePass, { ...args });

    // for debug
    // console.log(this.rowPasses)
}

export function getBufferVisualizerPassRenderTarget(postProcessPass: PostProcessPassBase) {
    return (postProcessPass as BufferVisualizerPass).compositePass.renderTarget;
}
