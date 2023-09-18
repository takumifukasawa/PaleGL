import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import lightShaftSampleFragmentShader from '@/PaleGL/shaders/light-shaft-sample-fragment.glsl';
import lightShaftCompositeFragmentShader from '@/PaleGL/shaders/light-shaft-composite-fragment.glsl';
import { PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Color } from '@/PaleGL/math/Color.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

//
// ref:
//

export class LightShaftPass implements IPostProcessPass {
    // --------------------------------------------------------------------------------
    // public
    // --------------------------------------------------------------------------------

    // params

    // [Range(0, 1)]
    blendRate = 1;
    // [Range(0, 1)]
    globalAlpha = 1;
    shaftColor = Color.white;
    // [Range(0, 128)]
    attenuationBase = 64;
    // [Range(0, 64)]
    attenuationPower = 1;
    // [Range(1, 128)]
    // [Range(0, 5)]
    rayStep = 0.1;
    // [Range(0, 5)]
    rayNearOffset = 0.01;
    // [Range(0, 0.2f)]
    rayJitterSizeX = 0.005;
    // [Range(0, 0.2f)]
    rayJitterSizeY = 0.005;
    // depthBias = 0.001;
    depthBias = 0;

    // gpu: GPU;
    name: string = 'LightShaftPass';
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

    /**
     *
     * @param gpu
     */
    constructor({ gpu }: { gpu: GPU; threshold?: number; tone?: number; bloomAmount?: number }) {
        // super();

        // this.gpu = gpu;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });

        //
        // light shaft pass
        //

        this.lightShaftSamplePass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftSampleFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                [UniformNames.DepthTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uRayStep: {
                    type: UniformTypes.Float,
                    value: this.rayStep,
                },
                uRayNearOffset: {
                    type: UniformTypes.Float,
                    value: this.rayNearOffset,
                },
                uAttenuationBase: {
                    type: UniformTypes.Float,
                    value: this.attenuationBase,
                },
                uAttenuationPower: {
                    type: UniformTypes.Float,
                    value: this.attenuationPower,
                },
                uBlendRate: {
                    type: UniformTypes.Float,
                    value: this.blendRate,
                },
                uDepthBias: {
                    type: UniformTypes.Float,
                    value: this.depthBias,
                },
                // [UniformNames.ViewMatrix]: {
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                [UniformNames.DirectionalLight]: {
                    type: UniformTypes.Struct,
                    value: {
                        direction: Vector3.zero,
                        intensity: 0,
                        color: new Vector4(0, 0, 0, 0),
                    },
                },
                [UniformNames.ShadowMap]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [UniformNames.ShadowMapProjectionMatrix]: {
                    type: UniformTypes.Matrix4,
                    value: Matrix4.identity,
                },
            },
        });

        this.materials.push(...this.lightShaftSamplePass.materials);
        
        //
        // composite pass
        //
        
        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftCompositeFragmentShader
        });
        
        this.materials.push(...this.compositePass.materials);
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.lightShaftSamplePass.setSize(width, height);
        this.compositePass.setSize(width, height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    /**
     *
     * @param gpu
     * @param camera
     * @param renderer
     * @param prevRenderTarget
     * @param isLastPass
     * @param gBufferRenderTargets
     * @param targetCamera
     * @param time
     */
    render({
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        gBufferRenderTargets,
        targetCamera,
        time,
    }: PostProcessPassRenderArgs) {
        // 一回だけ呼びたい
        this.geometry.start();
        // ppの場合はいらない気がする
        // this.mesh.updateTransform();

        //
        // light shaft sample pass
        //
        
        this.lightShaftSamplePass.material.updateUniform('uRayStep', this.rayStep);
        this.lightShaftSamplePass.material.updateUniform('uRayNearOffset', this.rayNearOffset);
        this.lightShaftSamplePass.material.updateUniform('uAttenuationBase', this.attenuationBase);
        this.lightShaftSamplePass.material.updateUniform('uAttenuationPower', this.attenuationPower);
        this.lightShaftSamplePass.material.updateUniform('uBlendRate', this.blendRate);
        this.lightShaftSamplePass.material.updateUniform('uDepthBias', this.depthBias);
        this.lightShaftSamplePass.render({
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
        // light shaft composite pass
        //
        
        this.compositePass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: this.lightShaftSamplePass.renderTarget,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    }

    // --------------------------------------------------------------------------------
    // private
    // --------------------------------------------------------------------------------

    // #width = 1;
    // #height = 1;

    // #lastPass;
    private lightShaftSamplePass: FragmentPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
