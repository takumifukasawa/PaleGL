import { UniformTypes } from '@/PaleGL/constants';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { GPU } from '@/PaleGL/core/GPU';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass.ts';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import bufferVisualizerRow0PassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-0-pass-fragment.glsl';
import bufferVisualizerRowBasePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-row-base-pass-fragment.glsl';
import bufferVisualizerCompositePassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-composite-pass-fragment.glsl';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';

const COL_NUM = 6;
const ROW_NUM = 6;

const DEPTH_TEXTURE_KEY = 'depthTexture';
const GBUFFER_A_TEXTURE_KEY = 'gBufferATexture';
const GBUFFER_B_TEXTURE_KEY = 'gBufferBTexture';
const GBUFFER_C_TEXTURE_KEY = 'gBufferCTexture';
const GBUFFER_D_TEXTURE_KEY = 'gBufferDTexture';
const DIRECTIONAL_LIGHT_SHADOW_MAP_KEY = 'directionalLightShadowMap';
const SPOT_LIGHT_SHADOW_MAP_KEY = 'spotLightShadowMap';
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

export class BufferVisualizerPass implements IPostProcessPass {
    dom: HTMLDivElement;
    rowPasses: RowPass[] = [];
    compositePass: FragmentPass;
    name: string = 'BufferVisualizerPass';
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    private geometry: PlaneGeometry;

    fullViewTextureEnabled: boolean = false;

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    constructor({ gpu }: { gpu: GPU }) {
        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });

        // row 0
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRow0PassFragmentShader,
                uniforms: [
                    {
                        name: 'uNearClip',
                        type: UniformTypes.Float,
                        value: 0.1,
                    },
                    {
                        name: 'uFarClip',
                        type: UniformTypes.Float,
                        value: 1,
                    },
                    {
                        name: 'uInverseViewProjectionMatrix',
                        type: UniformTypes.Matrix4,
                        value: Matrix4.identity,
                    },
                    // {
                    //     name: 'uDepthTexture',
                    //     type: UniformTypes.Texture,
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
                        // uniformName: UniformNames.GBufferATexture,
                        type: 'Texture',
                    },
                ],
                [
                    GBUFFER_B_TEXTURE_KEY,
                    {
                        // uniformName: UniformNames.GBufferBTexture,
                        type: 'Texture',
                    },
                ],
                [
                    GBUFFER_D_TEXTURE_KEY,
                    {
                        // uniformName: UniformNames.GBufferCTexture,
                        type: 'Texture',
                    },
                ],
                [
                    GBUFFER_C_TEXTURE_KEY,
                    {
                        // uniformName: UniformNames.GBufferDTexture
                        type: 'Texture',
                    },
                ],
            ]),
        });
        // row 1
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
                srcTextureEnabled: false,
            }),
            tiles: new Map([
                // [
                //     DEPTH_TEXTURE_KEY,
                //     {
                //         // uniformName: UniformNames.DepthTexture
                //         type: 'Texture',
                //     },
                // ],
                [
                    DIRECTIONAL_LIGHT_SHADOW_MAP_KEY,
                    {
                        // uniformName: UniformNames.DirectionalLightShadowMap,
                        type: 'Texture',
                    },
                ],

                [
                    `${SPOT_LIGHT_SHADOW_MAP_KEY}0`,
                    {
                        // uniformName: `${UniformNames.SpotLightShadowMap}0`
                        type: 'Texture',
                    },
                ],
                [
                    `${SPOT_LIGHT_SHADOW_MAP_KEY}1`,
                    {
                        // uniformName: `${UniformNames.SpotLightShadowMap}1`
                        type: 'Texture',
                    },
                ],
                [
                    `${SPOT_LIGHT_SHADOW_MAP_KEY}2`,
                    {
                        // uniformName: `${UniformNames.SpotLightShadowMap}2`
                        type: 'Texture',
                    },
                ],
                [
                    `${SPOT_LIGHT_SHADOW_MAP_KEY}3`,
                    {
                        // uniformName: `${UniformNames.SpotLightShadowMap}3`
                        type: 'Texture',
                    },
                ],
            ]),
        });
        // row 2
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
                srcTextureEnabled: false,
            }),
            tiles: new Map([
                [
                    AMBIENT_OCCLUSION_TEXTURE_KEY,
                    {
                        // uniformName: "uAmbientOcclusionTexture"
                        type: 'Texture',
                    },
                ],
                [
                    DEFERRED_SHADING_TEXTURE_KEY,
                    {
                        // uniformName: 'uDeferredShadingTexture'
                        type: 'Texture',
                    },
                ],
                [SSR_TEXTURE_KEY, { type: 'Texture', label: 'combine ssr' }],
                [
                    // DIRECTIONAL_LIGHT_SHADOW_MAP_KEY,
                    LIGHT_SHAFT_TEXTURE_KEY,
                    {
                        // uniformName: 'uLightShaftTexture'
                        type: 'Texture',
                    },
                ],
                [
                    VOLUMETRIC_LIGHT_TEXTURE_KEY,
                    {
                        // uniformName: 'uVolumetricLightTexture',
                        type: 'Texture',
                    },
                ],

                [
                    FOG_TEXTURE_KEY,
                    {
                        // uniformName: 'uFogTexture',
                        type: 'Texture',
                        label: 'combine fog',
                    },
                ],
            ]),
        });
        // row 3
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
                srcTextureEnabled: false,
            }),
            tiles: new Map([
                [
                    DEPTH_OF_FIELD_TEXTURE_KEY,
                    {
                        // uniformName: 'uDepthOfFieldTexture',
                        type: 'Texture',
                        label: 'dof',
                    },
                ],
            ]),
        });
        // row 4
        this.rowPasses.push({
            pass: new FragmentPass({
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
                        // uniformName: 'uBloomTexture',
                        type: 'Texture',
                        label: 'bloom',
                    },
                ],
            ]),
        });
        // row 5
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
                srcTextureEnabled: false,
            }),
            tiles: new Map([]),
        });

        this.compositePass = new FragmentPass({
            gpu,
            name: 'BufferVisualizerPass',
            fragmentShader: bufferVisualizerCompositePassFragmentShader,
            srcTextureEnabled: false,
            uniforms: [
                {
                    name: 'uFullViewTexture',
                    type: UniformTypes.Texture,
                    value: gpu.dummyTextureBlack,
                },
                {
                    name: 'uFullViewTextureEnabled',
                    type: UniformTypes.Float,
                    value: 0,
                },
                ...maton
                    .range(ROW_NUM)
                    .map((_, i) => {
                        return [
                            {
                                name: `uRow${i}Texture`,
                                type: UniformTypes.Texture,
                                value: gpu.dummyTextureBlack,
                            },
                        ];
                    })
                    .flat(),
                ...PostProcessPassBase.commonUniforms,
            ],
        });

        // initialize materials
        this.rowPasses.forEach(({ pass }) => this.materials.push(pass.material));
        this.materials.push(this.compositePass.material);

        // this.rowPasses.forEach(({ pass, tiles }, rowIndex) => {
        this.rowPasses.forEach(({ pass, tiles }, i) => {
            let colIndex = 0;
            // pass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, ROW_NUM));
            pass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, 1));
            for (const [key, tile] of tiles) {
                const uniformNamePrefix = tile.uniformNamePrefix || 'uTextureCol';
                const uniformNameTexture = `${uniformNamePrefix}${colIndex}`;
                const uniformNameUvOffset = `${uniformNameTexture}UvOffset`;
                const colOffset = -colIndex;

                if (!tile.uniformNamePrefix) {
                    tiles.get(key)!.uniformNamePrefix = uniformNamePrefix;
                }

                if (tile.type === 'Texture') {
                    tiles.get(key)!.uniformNameTexture = uniformNameTexture;
                }
                tiles.get(key)!.uniformNameUvOffset = uniformNameUvOffset;

                if (i === 0) {
                    pass.material.uniforms.addValue(
                        uniformNameUvOffset,
                        UniformTypes.Vector2,
                        new Vector2(colOffset, 0)
                    );
                    if (tile.type === 'Texture') {
                        pass.material.uniforms.addValue(
                            uniformNameTexture,
                            UniformTypes.Texture,
                            gpu.dummyTextureBlack
                        );
                    }
                } else {
                    pass.material.uniforms.addValue(
                        uniformNameUvOffset,
                        UniformTypes.Vector2,
                        new Vector2(colOffset, 0)
                    );
                    // console.log('hogehoge', pass, key, uniformNameTexture, UniformTypes.Texture, gpu.dummyTextureBlack);
                    pass.material.uniforms.addValue(uniformNameTexture, UniformTypes.Texture, gpu.dummyTextureBlack);
                }

                colIndex++;
            }
        });

        this.compositePass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(1, ROW_NUM));

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

        this.dom = document.createElement('div');
        this.dom.classList.add('buffer-visualizer-pass');
        const frag = document.createDocumentFragment();
        this.rowPasses.forEach(({ tiles }, rowIndex) => {
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
        this.dom.appendChild(frag);
        document.body.appendChild(this.dom);

        this.hideDom();
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.rowPasses.forEach(({ pass }) => {
            pass.setSize(this.width, this.height / ROW_NUM);
        });
        this.compositePass.setSize(this.width, this.height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    update() {
        if (this.enabled) {
            this.showDom();
        } else {
            this.hideDom();
        }
    }

    showDom() {
        this.dom.classList.remove('hidden');
    }

    hideDom() {
        this.dom.classList.add('hidden');
    }

    render(args: PostProcessPassRenderArgs) {
        const { gpu, renderer, lightActors } = args;

        const tmpRealWidth = renderer.realWidth;
        const tmpRealHeight = renderer.realHeight;

        this.geometry.start();

        this.rowPasses.forEach(({ pass, tiles }) => {
            if (lightActors?.directionalLight) {
                if (tiles.has(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)) {
                    pass.material.uniforms.setValue(
                        tiles.get(DIRECTIONAL_LIGHT_SHADOW_MAP_KEY)!.uniformNameTexture!,
                        // 'uDirectionalLightShadowMap',
                        lightActors.directionalLight.shadowMap!.read.depthTexture
                    );
                }
            }
            if (lightActors?.spotLights) {
                lightActors.spotLights.forEach((spotLight, i) => {
                    const key = `${SPOT_LIGHT_SHADOW_MAP_KEY}${i}`;
                    if (tiles.has(key)) {
                        if (spotLight.shadowMap) {
                            pass.material.uniforms.setValue(
                                tiles.get(key)!.uniformNameTexture!,
                                spotLight.shadowMap.read.depthTexture
                            );
                        }
                    }
                });
            }

            if (tiles.has(DEPTH_TEXTURE_KEY)) {
                // console.log(pass, tiles.get(DEPTH_TEXTURE_KEY)!.uniformNameTexture!);
                pass.material.uniforms.setValue(
                    tiles.get(DEPTH_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.depthPrePassRenderTarget.depthTexture
                );
            }

            if (tiles.has(GBUFFER_A_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uGBufferATexture',
                    tiles.get(GBUFFER_A_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.gBufferRenderTargets.gBufferATexture
                );
            }

            if (tiles.has(GBUFFER_B_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uGBufferBTexture',
                    tiles.get(GBUFFER_B_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.gBufferRenderTargets.gBufferBTexture
                );
            }

            if (tiles.has(GBUFFER_C_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uGBufferCTexture',
                    tiles.get(GBUFFER_C_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.gBufferRenderTargets.gBufferCTexture
                );
            }

            if (tiles.has(GBUFFER_D_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uGBufferDTexture',
                    tiles.get(GBUFFER_D_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.gBufferRenderTargets.gBufferDTexture
                );
            }

            if (tiles.has(AMBIENT_OCCLUSION_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uAmbientOcclusionTexture',
                    tiles.get(AMBIENT_OCCLUSION_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.ambientOcclusionPass.renderTarget.read.texture
                );
            }

            if (tiles.has(DEFERRED_SHADING_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uDeferredShadingTexture',
                    tiles.get(DEFERRED_SHADING_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.deferredShadingPass.renderTarget.read.texture
                );
            }

            if (tiles.has(SSR_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uSsrTexture',
                    tiles.get(SSR_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.ssrPass.renderTarget.read.texture
                );
            }

            if (tiles.has(LIGHT_SHAFT_TEXTURE_KEY)) {
                // console.log(
                //     tiles.has(LIGHT_SHAFT_TEXTURE_KEY),
                //     tiles.get(LIGHT_SHAFT_TEXTURE_KEY)!.uniformNameTexture!,
                //     renderer.lightShaftPass.renderTarget.read.texture
                // )
                pass.material.uniforms.setValue(
                    // 'uLightShaftTexture',
                    tiles.get(LIGHT_SHAFT_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.lightShaftPass.renderTarget.read.texture
                );
            }

            if (tiles.has(VOLUMETRIC_LIGHT_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uVolumetricLightTexture',
                    tiles.get(VOLUMETRIC_LIGHT_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.volumetricLightPass.renderTarget.read.texture
                );
            }

            if (tiles.has(DEPTH_OF_FIELD_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uDepthOfFieldTexture',
                    tiles.get(DEPTH_OF_FIELD_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.depthOfFieldPass.renderTarget.read.texture
                );
            }

            if (tiles.has(FOG_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uFogTexture',
                    tiles.get(FOG_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.fogPass.renderTarget.read.texture
                );
            }

            if (tiles.has(BLOOM_BLUR_MIP4_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    tiles.get(BLOOM_BLUR_MIP4_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTargetBlurMip4.read.texture
                );
            }

            if (tiles.has(BLOOM_BLUR_MIP8_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    tiles.get(BLOOM_BLUR_MIP8_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTargetBlurMip8.read.texture
                );
            }

            if (tiles.has(BLOOM_BLUR_MIP16_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    tiles.get(BLOOM_BLUR_MIP16_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTargetBlurMip16.read.texture
                );
            }

            if (tiles.has(BLOOM_BLUR_MIP32_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    tiles.get(BLOOM_BLUR_MIP32_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTargetBlurMip32.read.texture
                );
            }

            if (tiles.has(BLOOM_BLUR_MIP64_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    tiles.get(BLOOM_BLUR_MIP64_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTargetBlurMip64.read.texture
                );
            }

            if (tiles.has(BLOOM_TEXTURE_KEY)) {
                pass.material.uniforms.setValue(
                    // 'uBloomTexture',
                    tiles.get(BLOOM_TEXTURE_KEY)!.uniformNameTexture!,
                    renderer.bloomPass.renderTarget.read.texture
                );
            }
        });

        this.rowPasses[0].pass.material.uniforms.setValue(
            'uInverseViewProjectionMatrix',
            args.targetCamera.inverseViewProjectionMatrix
        );

        gpu.setSize(0, 0, this.width, this.height / ROW_NUM);

        this.rowPasses.forEach(({ pass, tiles }, i) => {
            if (tiles.size > 0) {
                pass.render({ ...args, isLastPass: false });
                this.compositePass.material.uniforms.setValue(`uRow${i}Texture`, pass.renderTarget.read.texture);
            }
        });
        this.compositePass.material.uniforms.setValue(
            'uFullViewTexture',
            // this.compositePass.renderTarget.read.texture
            renderer.gBufferRenderTargets.gBufferBTexture
            // renderer.ssrPass.renderTarget.read.texture
        );
        this.compositePass.material.uniforms.setValue('uFullViewTextureEnabled', this.fullViewTextureEnabled ? 1 : 0);
        // for debug
        // this.compositePass.material.uniforms.setValue('uFullViewTextureEnabled', 1);

        gpu.setSize(0, 0, tmpRealWidth, tmpRealHeight);

        this.compositePass.render({ ...args });

        // for debug
        // console.log(this.rowPasses)
    }
}
