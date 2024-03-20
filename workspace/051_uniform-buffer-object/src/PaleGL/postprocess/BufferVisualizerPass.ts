import { UniformNames, UniformTypes } from '@/PaleGL/constants';
import bufferVisualizerPassFragmentShader from '@/PaleGL/shaders/buffer-visualizer-pass-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { GPU } from '@/PaleGL/core/GPU';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

const COL_NUM = 5;
const ROW_NUM = 5;

export class BufferVisualizerPass extends PostProcessPassBase {
    dom: HTMLDivElement;

    constructor({ gpu }: { gpu: GPU }) {
        const fragmentShader = bufferVisualizerPassFragmentShader;

        const tiles: { name: string; type?: 'Texture' | 'Other'; label?: string }[] = [
            // row: 0
            {
                name: UniformNames.GBufferATexture,
            },
            {
                name: UniformNames.GBufferBTexture,
            },
            {
                name: UniformNames.GBufferCTexture,
            },
            {
                name: UniformNames.GBufferDTexture,
            },
            {
                name: UniformNames.DepthTexture,
            },
            // row: 1
            {
                name: 'uWorldPosition',
                type: 'Other',
            },
            {
                name: 'uDirectionalLightShadowMap',
            },
            {
                name: 'uSpotLightShadowMap0',
            },
            {
                name: 'uSpotLightShadowMap1',
            },
            {
                name: 'uSpotLightShadowMap2',
            },
            // row: 2
            {
                name: 'uSpotLightShadowMap3',
            },
            {
                name: 'uAmbientOcclusionTexture',
            },
            {
                name: 'uDeferredShadingTexture',
            },
            {
                name: 'uLightShaftTexture',
            },
            {
                name: 'uVolumetricLightTexture',
            },
            // row: 3
            {
                name: 'uFogTexture',
            },
            {
                name: 'uDepthOfFieldTexture',
            },
            {
                name: 'uBloomTexture',
            }
        ];

        const uniforms: UniformsData = [
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
                name: "uTiling",
                type: UniformTypes.Vector2,
                value: new Vector2(COL_NUM, ROW_NUM)
            }
        ];
        tiles.forEach((tile, i) => {
            const col = i % COL_NUM;
            const row = Math.floor(i / COL_NUM);
            const colOffset = -col;
            const rowOffset = -ROW_NUM + 1 + row;
            uniforms.push({
                name: `${tile.name}UvOffset`,
                type: UniformTypes.Vector2,
                value: new Vector2(colOffset, rowOffset),
            });
            // console.log("hogehoge", `${tile.name}UvOffset`, colOffset, rowOffset)
            if (tile.type === 'Other') {
                return;
            }
            uniforms.push({
                name: tile.name,
                type: UniformTypes.Texture,
                // value: null
                value: gpu.dummyTextureBlack,
            });
        });
        // console.log('hogehoge', uniforms);

        super({
            gpu,
            name: 'BufferVisualizerPass',
            fragmentShader,
            // rawVertexShader,
            // rawFragmentShader,
            uniforms,
        });

        this.dom = document.createElement('div');
        this.dom.classList.add('buffer-visualizer-pass');
        this.dom.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: grid;
            grid-template-columns: repeat(${COL_NUM}, 1fr);
            grid-template-rows: repeat(${ROW_NUM}, 1fr);
        `;
        const frag = document.createDocumentFragment();
        tiles.forEach((tile, i) => {
            const col = i % COL_NUM;
            const row = Math.floor(i / COL_NUM);
            const label = `${tile.label || tile.name}, ${col}, ${row}`;
            const elem = document.createElement('div');
            elem.style.cssText = `
                display: flex;
                justify-content: flex-start;
                align-items: flex-end;
                font-size: 9px;
                line-height: 1em;
                font-weight: bold;
                padding: 9px;
            `;
            const p = document.createElement('p');
            p.textContent = label;
            elem.appendChild(p);
            frag.appendChild(elem);
            this.dom.appendChild(frag);
        });
        document.body.appendChild(this.dom);
    }

    render(args: PostProcessPassRenderArgs) {
        super.render(args);

        this.dom.style.visibility = this.enabled ? 'visible' : 'hidden';

        const { renderer, lightActors } = args;

        if (lightActors?.directionalLight) {
            this.material.uniforms.setValue(
                'uDirectionalLightShadowMap',
                lightActors.directionalLight.shadowMap!.read.depthTexture
                // spotLight.shadowMap!.read.depthTexture
            );
        }
        if (lightActors?.spotLights) {
            lightActors.spotLights.forEach((spotLight, i) => {
                const name = `uSpotLightShadowMap${i}`;
                if(spotLight.shadowMap) {
                    this.material.uniforms.setValue(name, spotLight.shadowMap.read.depthTexture);
                }
            });
        }
        this.material.uniforms.setValue(
            'uAmbientOcclusionTexture',
            renderer.ambientOcclusionPass.renderTarget.read.texture
        );
        this.material.uniforms.setValue(
            'uDeferredShadingTexture',
            renderer.deferredShadingPass.renderTarget.read.texture
        );
        this.material.uniforms.setValue('uLightShaftTexture', renderer.lightShaftPass.renderTarget.read.texture);
        this.material.uniforms.setValue(
            'uVolumetricLightTexture',
            renderer.volumetricLightPass.renderTarget.read.texture
        );
        this.material.uniforms.setValue('uDepthOfFieldTexture', renderer.depthOfFieldPass.renderTarget.read.texture);
        this.material.uniforms.setValue('uFogTexture', renderer.fogPass.renderTarget.read.texture);
        this.material.uniforms.setValue('uBloomTexture', renderer.bloomPass.renderTarget.read.texture);
    }
}
