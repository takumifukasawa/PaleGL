import { UniformNames, UniformTypes } from '@/PaleGL/constants';
import { PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
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

const COL_NUM = 6;
const ROW_NUM = 6;

// const DIRECTIONAL_LIGHT_SHADOW_MAP_KEY = 'directionalLightShadowMap';
// const SPOT_LIGHT_SHADOW_MAP_KEY = 'spotLightShadowMap';

// const areaFuncText = `
// float isArea(vec2 uv) {
//     return step(0., uv.x) * (1. - step(1., uv.x)) * step(0., uv.y) * (1. - step(1., uv.y));
// }
// 
// vec4 calcAreaColor(vec4 color, vec2 uv, vec2 tiling, vec2 offset) {
//     return color * isArea(uv * tiling + offset);
// }
// 
// vec4 calcTextureAreaColor(sampler2D tex, vec2 uv, vec2 tiling, vec2 offset) {
//     return calcAreaColor(texture(tex, uv * tiling + offset), uv, tiling, offset);
// }
// `;

// const row0FragmentShaderText = `#version 300 es
// 
// precision mediump float;
// 
// uniform vec2 uWorldPositionUvOffset;
// uniform sampler2D uDepthTexture;
// uniform vec2 uDepthTextureUvOffset;
// 
// uniform vec2 uTiling;
// uniform float uNearClip;
// uniform float uFarClip;
// uniform mat4 uInverseViewProjectionMatrix;
// 
// vec2 vUv;
// 
// ${areaFuncText}
// 
// void main() {
//     vec2 tiling = uTiling;
//     
//     vec2 depthUv = vUv * tiling + uDepthTextureUvOffset;
//     vec2 worldPositionUv = vUv * tiling + uWorldPositionUvOffset;
//   
//     float rawDepth = texture(uDepthTexture, depthUv).x * isArea(depthUv);
//     float sceneDepth = perspectiveDepthToLinearDepth(rawDepth, uNearClip, uFarClip);
// 
//     vec3 worldPosition = reconstructWorldPositionFromDepth(
//         worldPositionUv,
//         texture(uDepthTexture, worldPositionUv).x,
//         uInverseViewProjectionMatrix
//     );
// 
//     vec4 depthColor = calcAreaColor(vec4(sceneDepth), vUv, tiling, uDepthTextureUvOffset);
//     vec4 worldPositionColor = calcAreaColor(vec4(worldPosition, 1.), vUv, tiling, uWorldPositionUvOffset);   
//     
//     outColor = depthColor + worldPositionColor;
// }
// `;

// const baseFragmentShaderText = `#version 300 es
// 
// precision mediump float;
// 
// uniform sampler2D uTexture0;
// uniform vec2 uTexture0UvOffset;
// uniform sampler2D uTexture1;
// uniform vec2 uTexture1UvOffset;
// uniform sampler2D uTexture2;
// uniform vec2 uTexture2UvOffset;
// uniform sampler2D uTexture3;
// uniform vec2 uTexture3UvOffset;
// uniform sampler2D uTexture4;
// uniform vec2 uTexture4UvOffset;
// uniform sampler2D uTexture5;
// uniform vec2 uTexture5UvOffset;
// 
// uniform vec2 uTiling;
// 
// vec2 vUv;
// 
// out vec4 outColor;
// 
// ${areaFuncText}
// 
// void main() {
//     vec2 tiling = uTiling;
//     vec4 color0 = calcTextureAreaColor(uTexture0, vUv, tiling, uTexture0UvOffset);
//     vec4 color1 = calcTextureAreaColor(uTexture1, vUv, tiling, uTexture1UvOffset);
//     vec4 color2 = calcTextureAreaColor(uTexture2, vUv, tiling, uTexture2UvOffset);
//     vec4 color3 = calcTextureAreaColor(uTexture3, vUv, tiling, uTexture3UvOffset);
//     vec4 color4 = calcTextureAreaColor(uTexture4, vUv, tiling, uTexture4UvOffset);
//     vec4 color5 = calcTextureAreaColor(uTexture5, vUv, tiling, uTexture5UvOffset);
//     gl_FragColor = color0 + color1 + color2 + color3 + color4 + color5;
// }
// `;
// 
// const compositeFragmentShaderText = `#version 300 es
// 
// uniform sampler2D uRow0Texture;
// uniform sampler2D uRow1Texture;
// uniform sampler2D uRow2Texture;
// uniform sampler2D uRow3Texture;
// uniform sampler2D uRow4Texture;
// uniform sampler2D uRow5Texture;
// 
// vec2 vUv;
// 
// out vec4 outColor;
// 
// uniform vec2 uTiling;
// 
// ${areaFuncText}
// 
// void main() {
//     vec2 tiling = vec2(6., 6.);
//     vec4 color0 = calcTextureAreaColor(uRow0Texture, vUv, tiling, vec2(0., -5.));
//     vec4 color1 = calcTextureAreaColor(uRow1Texture, vUv, tiling, vec2(0., -4.));
//     vec4 color2 = calcTextureAreaColor(uRow2Texture, vUv, tiling, vec2(0., -3.));
//     vec4 color3 = calcTextureAreaColor(uRow3Texture, vUv, tiling, vec2(0., -2.));
//     vec4 color4 = calcTextureAreaColor(uRow4Texture, vUv, tiling, vec2(0., -1.));
//     vec4 color5 = calcTextureAreaColor(uRow5Texture, vUv, tiling, vec2(0., 0.));
//     outColor = color0 + color1 + color2 + color3 + color4 + color5;
// }
// `;

type RowPass = {
    pass: FragmentPass;
    tiles: Map<string, { label: string; type?: 'Texture' | 'Other' }>;
};

// type TileInfo = { name: string; type?: 'Texture' | 'Other'; label?: string };

export class BufferVisualizerPass implements IPostProcessPass {
    dom: HTMLDivElement;
    rowPasses: RowPass[] = [];
    compositePass: FragmentPass;

    // gpu: GPU;
    name: string = 'BufferVisualizerPass';
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    constructor({ gpu }: { gpu: GPU }) {
        // const fragmentShader = bufferVisualizerPassFragmentShader;

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
                    {
                        name: 'uTiling',
                        type: UniformTypes.Vector2,
                        value: new Vector2(COL_NUM, ROW_NUM),
                    },
                ],
            }),
            tiles: new Map([
                [
                    'depth',
                    {
                        label: 'depth',
                        type: 'Other',
                    },
                ],
                [
                    'worldPosition',
                    {
                        label: 'worldPosition',
                        type: 'Other',
                    },
                ],
            ]),
        });
        // row 1
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            }),
            tiles: new Map([
                [
                    UniformNames.GBufferATexture,
                    {
                        label: 'gBufferATexture',
                    },
                ],
                [
                    UniformNames.GBufferBTexture,
                    {
                        label: 'gBufferBTexture',
                    },
                ],
                [
                    UniformNames.GBufferCTexture,
                    {
                        label: 'gBufferCTexture',
                    },
                ],
                [
                    UniformNames.GBufferDTexture,
                    {
                        label: 'gBufferDTexture',
                    },
                ],
                [
                    UniformNames.DepthTexture,
                    {
                        label: 'depthTexture',
                    },
                ],
                [
                    UniformNames.DirectionalLightShadowMap,
                    {
                        label: 'directionalLightShadowMap',
                    },
                ],
            ]),
        });
        // row 2
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            }),
            tiles: new Map([
                [
                    'uSpotLightShadowMap0',
                    {
                        label: 'spotLightShadowMap0',
                    },
                ],
                [
                    'uSpotLightShadowMap1',
                    {
                        label: 'spotLightShadowMap1',
                    },
                ],
                [
                    'uSpotLightShadowMap2',
                    {
                        label: 'spotLightShadowMap2',
                    },
                ],
                [
                    'uSpotLightShadowMap3',
                    {
                        label: 'spotLightShadowMap3',
                    },
                ],
                [
                    'uAmbientOcclusionTexture',
                    {
                        label: 'ambientOcclusionTexture',
                    },
                ],
                [
                    'uDeferredShadingTexture',
                    {
                        label: 'deferredShadingTexture',
                    },
                ],
            ]),
        });
        // row 3
        this.rowPasses.push({
            pass: new FragmentPass({
                gpu,
                fragmentShader: bufferVisualizerRowBasePassFragmentShader,
            }),
            tiles: new Map([
                [
                    'uLightShaftTexture',
                    {
                        label: 'lightShaftTexture',
                    },
                ],
                [
                    'uVolumetricLightTexture',
                    {
                        label: 'volumetricLightTexture',
                    },
                ],
                [
                    'uFogTexture',
                    {
                        label: 'fogTexture',
                    },
                ],
                [
                    'uDepthOfFieldTexture',
                    {
                        label: 'depthOfFieldTexture',
                    },
                ],
                [
                    'uBloomTexture',
                    {
                        label: 'bloomTexture',
                    },
                ],
            ]),
        });

        this.compositePass = new FragmentPass({
            gpu,
            name: 'BufferVisualizerPass',
            fragmentShader: bufferVisualizerCompositePassFragmentShader,
            // rawVertexShader,
            // rawFragmentShader,
            // uniforms,
        });

        // initialize materials
        this.rowPasses.forEach(({ pass }) => this.materials.push(pass.material));
        this.materials.push(this.compositePass.material);

        // const tiles: TileInfo[] = [
        //     // row: 1
        //     {
        //         name: UniformNames.GBufferATexture,
        //     },
        //     {
        //         name: UniformNames.GBufferBTexture,
        //     },
        //     {
        //         name: UniformNames.GBufferCTexture,
        //     },
        //     {
        //         name: UniformNames.GBufferDTexture,
        //     },
        //     {
        //         name: UniformNames.DepthTexture,
        //     },
        //     {
        //         name: 'uWorldPosition',
        //         type: 'Other',
        //     },
        //     // row: 2
        //     {
        //         name: 'uDirectionalLightShadowMap',
        //     },

        //     {
        //         name: 'uAmbientOcclusionTexture',
        //     },
        //     // row: 3
        //     {
        //         name: 'uDeferredShadingTexture',
        //     },
        //     {
        //         name: 'uLightShaftTexture',
        //     },
        //     {
        //         name: 'uVolumetricLightTexture',
        //     },
        //     {
        //         name: 'uFogTexture',
        //     },
        //     {
        //         name: 'uDepthOfFieldTexture',
        //     },
        //     {
        //         name: 'uBloomTexture',
        //     },
        // ];

        // const uniforms: UniformsData = [
        //     {
        //         name: 'uNearClip',
        //         type: UniformTypes.Float,
        //         value: 0.1,
        //     },
        //     {
        //         name: 'uFarClip',
        //         type: UniformTypes.Float,
        //         value: 1,
        //     },
        //     {
        //         name: 'uInverseViewProjectionMatrix',
        //         type: UniformTypes.Matrix4,
        //         value: Matrix4.identity,
        //     },
        //     {
        //         name: 'uTiling',
        //         type: UniformTypes.Vector2,
        //         value: new Vector2(COL_NUM, ROW_NUM),
        //     },
        // ];

        this.rowPasses.forEach(({ pass, tiles }, rowIndex) => {
            let colIndex = 0;
            tiles.forEach((tile) => {
                const colOffset = -colIndex;
                const rowOffset = -ROW_NUM + 1 + rowIndex;
                pass.material.uniforms.addValue('uTiling', UniformTypes.Vector2, new Vector2(COL_NUM, ROW_NUM));
                pass.material.uniforms.addValue(
                    `${tile.label}UvOffset`,
                    UniformTypes.Vector2,
                    new Vector2(colOffset, rowOffset)
                );
                if (tile.type === 'Other') {
                    return;
                }
                pass.material.uniforms.addValue(tile.label, UniformTypes.Texture, gpu.dummyTextureBlack);
                colIndex++;
            });
        });

        // tiles.forEach((tile, i) => {
        //     const col = i % COL_NUM;
        //     const row = Math.floor(i / COL_NUM);
        //     const colOffset = -col;
        //     const rowOffset = -ROW_NUM + 1 + row;
        //     uniforms.push({
        //         name: `${tile.name}UvOffset`,
        //         type: UniformTypes.Vector2,
        //         value: new Vector2(colOffset, rowOffset),
        //     });
        //     // console.log("hogehoge", `${tile.name}UvOffset`, colOffset, rowOffset)
        //     if (tile.type === 'Other') {
        //         return;
        //     }
        //     uniforms.push({
        //         name: tile.name,
        //         type: UniformTypes.Texture,
        //         // value: null
        //         value: gpu.dummyTextureBlack,
        //     });
        // });
        // // console.log('hogehoge', uniforms);

        // this.rowPasses.push({
        //     pass: new FragmentPass({
        //         gpu,
        //         fragmentShader: baseFragmentShaderText,
        //     }),
        //     tiles: [
        //         {
        //             name: 'depth',
        //             type: 'Other',
        //         },
        //         {
        //             name: 'worldPosition',
        //             type: 'Other',
        //         },
        //     ],
        // });

        // const rowTileInfos: TileInfo[][] = [];
        // let rowTileIndex = -1;
        // tiles.forEach((tile, i) => {
        //     const rowIndex = Math.floor(i / COL_NUM);
        //     if (rowIndex == 0) {
        //         rowTileIndex++;
        //         rowTileInfos[rowTileIndex] = [];
        //     }
        //     rowTileInfos[rowTileIndex].push(tile);
        // });

        // rowTileInfos.forEach((tileInfos) => {
        //     this.rowPasses.push({
        //         pass: new FragmentPass({
        //             gpu,
        //             fragmentShader: baseFragmentShaderText,
        //         }),
        //         tiles: tileInfos,
        //     });
        // });

        // this.rowPasses.forEach(({ tiles, pass }) => {
        //     tiles.forEach((tile, j) => {
        //         const col = j % COL_NUM;
        //         const row = Math.floor(j / COL_NUM);
        //         const colOffset = -col;
        //         const rowOffset = -ROW_NUM + 1 + row;
        //         pass.material.uniforms.push({
        //             name: `${tile.name}UvOffset`,
        //             type: UniformTypes.Vector2,
        //             value: new Vector2(colOffset, rowOffset),
        //         });
        //         if (tile.type === 'Other') {
        //             return;
        //         }
        //         pass.material.uniforms.push({
        //             name: tile.name,
        //             type: UniformTypes.Texture,
        //             // value: null
        //             value: gpu.dummyTextureBlack,
        //         });
        //     });
        // });

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
    grid-template-columns: repeat(${COL_NUM}, 1fr);
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
    padding: 9px;
}
        `;
        document.head.appendChild(styleHeader);

        this.dom = document.createElement('div');
        this.dom.classList.add('buffer-visualizer-pass');
        const frag = document.createDocumentFragment();
        this.rowPasses.forEach(({ tiles }, rowIndex) => {
            let colIndex = 0;
            tiles.forEach((_, label) => {
                const newLabel = `${label || ''}, ${colIndex}, ${rowIndex}`;
                const elem = document.createElement('div');
                elem.classList.add('buffer-visualizer-pass-tile');
                const p = document.createElement('p');
                p.textContent = newLabel;
                elem.appendChild(p);
                frag.appendChild(elem);
                this.dom.appendChild(frag);
                colIndex++;
            });
        });
        document.body.appendChild(this.dom);

        this.dom.classList.add('hidden');
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.rowPasses.forEach(({ pass }) => {
            pass.setSize(width, height / ROW_NUM);
        });
        this.compositePass.setSize(width, height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    /**
     *
     */
    update() {
        if (this.enabled) {
            this.dom.classList.remove('hidden');
        } else {
            this.dom.classList.add('hidden');
        }
    }

    /**
     *
     * @param args
     */
    render(args: PostProcessPassRenderArgs) {
        const { renderer, lightActors } = args;

        this.rowPasses.forEach(({ pass, tiles }) => {
            if (lightActors?.directionalLight) {
                if (tiles.has(UniformNames.DirectionalLightShadowMap)) {
                    pass.material.uniforms.setValue(
                        'uDirectionalLightShadowMap',
                        lightActors.directionalLight.shadowMap!.read.depthTexture
                    );
                }
            }
            if (lightActors?.spotLights) {
                lightActors.spotLights.forEach((spotLight, i) => {
                    const uniformName = `${UniformNames.SpotLightShadowMap}${i}`;
                    if (tiles.has(uniformName)) {
                        // const { label } = tiles.get(uniformName);
                        if (spotLight.shadowMap) {
                            pass.material.uniforms.setValue(uniformName, spotLight.shadowMap.read.depthTexture);
                        }
                    }
                });
            }

            if (tiles.has('uAmbientOcclusionTexture')) {
                pass.material.uniforms.setValue(
                    'uAmbientOcclusionTexture',
                    renderer.ambientOcclusionPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uDeferredShadingTexture')) {
                pass.material.uniforms.setValue(
                    'uDeferredShadingTexture',
                    renderer.deferredShadingPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uLightShaftTexture')) {
                pass.material.uniforms.setValue(
                    'uLightShaftTexture',
                    renderer.lightShaftPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uVolumetricLightTexture')) {
                pass.material.uniforms.setValue(
                    'uVolumetricLightTexture',
                    renderer.volumetricLightPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uDepthOfFieldTexture')) {
                pass.material.uniforms.setValue(
                    'uDepthOfFieldTexture',
                    renderer.depthOfFieldPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uFogTexture')) {
                pass.material.uniforms.setValue('uFogTexture', renderer.fogPass.renderTarget.read.texture);
            }

            if (tiles.has('uBloomTexture')) {
                pass.material.uniforms.setValue('uBloomTexture', renderer.bloomPass.renderTarget.read.texture);
            }
        });
        
        this.rowPasses.forEach(({ pass }, i) => {
            pass.render({ ...args, isLastPass: false });
            this.compositePass.material.uniforms.setValue(`uRow${i}Texture`, pass.renderTarget.read.texture);
        });
        
        this.compositePass.render(args);
    }
}
