import { UniformNames, UniformTypes } from '@/PaleGL/constants';
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

type RowPass = {
    pass: FragmentPass;
    tiles: Map<string, { label: string; type?: 'Texture' | 'Other'; overrideUniformName?: string }>;
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
                    {
                        name: 'uDepthTexture',
                        type: UniformTypes.Texture,
                        value: null,
                    },
                ],
            }),
            tiles: new Map([
                [
                    'uDepthTexture',
                    {
                        label: 'depth',
                        type: 'Other',
                    },
                ],
                [
                    'uWorldPosition',
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
            uniforms: [
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
            for (const [uniformName, tile] of tiles) {
                const colOffset = -colIndex;
                if (i === 0) {
                    // pass.material.uniforms.addValue(`${uniformName}`, UniformTypes.Texture, gpu.dummyTextureBlack);
                    pass.material.uniforms.addValue(
                        `${uniformName}UvOffset`,
                        UniformTypes.Vector2,
                        new Vector2(colOffset, 0)
                    );
                    colIndex++;
                    if (tile.type === 'Other') {
                        continue;
                    }
                    pass.material.uniforms.addValue(
                        uniformName,
                        UniformTypes.Texture,
                        gpu.dummyTextureBlack
                    );
                } else {
                    // tile.overrideUniformName = `uTexture${colIndex}`;
                    // pass.material.uniforms.addValue(
                    //     `${tile.overrideUniformName}`,
                    //     UniformTypes.Texture,
                    //     gpu.dummyTextureBlack
                    // );
                    tile.overrideUniformName = `uTexture${colIndex}`;
                    pass.material.uniforms.addValue(
                        `${tile.overrideUniformName}UvOffset`,
                        UniformTypes.Vector2,
                        new Vector2(colOffset, 0)
                    );
                    pass.material.uniforms.addValue(
                        tile.overrideUniformName,
                        UniformTypes.Texture,
                        gpu.dummyTextureBlack
                    );
                    colIndex++;
                }
            }
        });
        console.log(this.rowPasses);

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
    padding: 9px;
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
            for (const [, tile] of tiles) {
                const newLabel = `${tile.label || ''}, ${colIndex}, ${rowIndex}`;
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
                if (tiles.has(UniformNames.DirectionalLightShadowMap)) {
                    pass.material.uniforms.setValue(
                        tiles.get(UniformNames.DirectionalLightShadowMap)!.overrideUniformName!,
                        // 'uDirectionalLightShadowMap',
                        lightActors.directionalLight.shadowMap!.read.depthTexture
                    );
                }
            }
            if (lightActors?.spotLights) {
                lightActors.spotLights.forEach((spotLight, i) => {
                    const uniformName = `${UniformNames.SpotLightShadowMap}${i}`;
                    if (tiles.has(uniformName)) {
                        if (spotLight.shadowMap) {
                            pass.material.uniforms.setValue(
                                tiles.get(uniformName)!.overrideUniformName!,
                                spotLight.shadowMap.read.depthTexture
                            );
                        }
                    }
                });
            }

            if (tiles.has('uAmbientOcclusionTexture')) {
                pass.material.uniforms.setValue(
                    // 'uAmbientOcclusionTexture',
                    tiles.get('uAmbientOcclusionTexture')!.overrideUniformName!,
                    renderer.ambientOcclusionPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uDeferredShadingTexture')) {
                pass.material.uniforms.setValue(
                    // 'uDeferredShadingTexture',
                    tiles.get('uDeferredShadingTexture')!.overrideUniformName!,
                    renderer.deferredShadingPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uLightShaftTexture')) {
                pass.material.uniforms.setValue(
                    // 'uLightShaftTexture',
                    tiles.get('uLightShaftTexture')!.overrideUniformName!,
                    renderer.lightShaftPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uVolumetricLightTexture')) {
                pass.material.uniforms.setValue(
                    // 'uVolumetricLightTexture',
                    tiles.get('uVolumetricLightTexture')!.overrideUniformName!,
                    renderer.volumetricLightPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uDepthOfFieldTexture')) {
                pass.material.uniforms.setValue(
                    // 'uDepthOfFieldTexture',
                    tiles.get('uDepthOfFieldTexture')!.overrideUniformName!,
                    renderer.depthOfFieldPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uFogTexture')) {
                pass.material.uniforms.setValue(
                    // 'uFogTexture',
                    tiles.get('uFogTexture')!.overrideUniformName!,
                    renderer.fogPass.renderTarget.read.texture
                );
            }

            if (tiles.has('uBloomTexture')) {
                pass.material.uniforms.setValue(
                    // 'uBloomTexture',
                    tiles.get('uBloomTexture')!.overrideUniformName!,
                    renderer.bloomPass.renderTarget.read.texture
                );
            }
        });

        this.rowPasses[0].pass.material.uniforms.setValue(
            'uInverseViewProjectionMatrix',
            args.targetCamera.inverseViewProjectionMatrix
        );

        gpu.setSize(0, 0, this.width, this.height / ROW_NUM);

        this.rowPasses.forEach(({ pass }, i) => {
            pass.render({ ...args, isLastPass: false });
            this.compositePass.material.uniforms.setValue(`uRow${i}Texture`, pass.renderTarget.read.texture);
        });

        gpu.setSize(0, 0, tmpRealWidth, tmpRealHeight);

        this.compositePass.render({ ...args });
    }
}
