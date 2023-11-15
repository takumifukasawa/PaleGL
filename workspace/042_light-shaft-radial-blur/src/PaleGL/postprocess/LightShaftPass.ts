import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
// import lightShaftSampleFragmentShader from '@/PaleGL/shaders/light-shaft-sample-fragment.glsl';
import lightShaftCompositeFragmentShader from '@/PaleGL/shaders/light-shaft-composite-fragment.glsl';
import lightShaftDownSampleFragmentShader from '@/PaleGL/shaders/light-shaft-down-sample-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { Color } from '@/PaleGL/math/Color.ts';
import { RadialBlurPass } from '@/PaleGL/postprocess/RadialBlurPass.ts';
// import {Matrix4} from '@/PaleGL/math/Matrix4.ts';
// import {Vector3} from '@/PaleGL/math/Vector3.ts';
// import {Vector4} from '@/PaleGL/math/Vector4.ts';
// import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import {GaussianBlurPass} from '@/PaleGL/postprocess/GaussianBlurPass.ts';
// import {RadialBlurPass} from '@/PaleGL/postprocess/RadialBlurPass.ts';

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
        // TODO: composite pass の方にちゃんと書き換えましょう
        // return this.lightShaftDownSamplePass.renderTarget;
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
        // light shaft down sample
        //

        // this.lightShaftDownSamplePass = new RadialBlurPass({
        //     gpu,
        // });

        this.lightShaftDownSamplePass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftDownSampleFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.R16F,
            uniforms: {
                [UniformNames.DepthTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                ...PostProcessPassBase.commonUniforms,
            },
            // uniforms: {}
        });
        // this.lightShaftDownSamplePass = new RadialBlurPass({
        //     gpu,
        // });

        this.materials.push(...this.lightShaftDownSamplePass.materials);

        //
        // light shaft pass
        //

        // this.lightShaftSamplePass = new FragmentPass({
        //     gpu,
        //     fragmentShader: lightShaftSampleFragmentShader,
        //     renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        //     uniforms: {
        //         [UniformNames.DepthTexture]: {
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         uRayStep: {
        //             type: UniformTypes.Float,
        //             value: this.rayStep,
        //         },
        //         uRayNearOffset: {
        //             type: UniformTypes.Float,
        //             value: this.rayNearOffset,
        //         },
        //         uAttenuationBase: {
        //             type: UniformTypes.Float,
        //             value: this.attenuationBase,
        //         },
        //         uAttenuationPower: {
        //             type: UniformTypes.Float,
        //             value: this.attenuationPower,
        //         },
        //         uBlendRate: {
        //             type: UniformTypes.Float,
        //             value: this.blendRate,
        //         },
        //         uRayJitterSizeX: {
        //             type: UniformTypes.Float,
        //             value: this.rayJitterSizeX,
        //         },
        //         uRayJitterSizeY: {
        //             type: UniformTypes.Float,
        //             value: this.rayJitterSizeY,
        //         },
        //         uDepthBias: {
        //             type: UniformTypes.Float,
        //             value: this.depthBias,
        //         },
        //         // [UniformNames.ViewMatrix]: {
        //         //     type: UniformTypes.Matrix4,
        //         //     value: Matrix4.identity,
        //         // },
        //         [UniformNames.DirectionalLight]: {
        //             type: UniformTypes.Struct,
        //             value: {
        //                 direction: Vector3.zero,
        //                 intensity: 0,
        //                 color: new Vector4(0, 0, 0, 0),
        //             },
        //         },
        //         [UniformNames.ShadowMap]: {
        //             type: UniformTypes.Texture,
        //             value: null,
        //         },
        //         [UniformNames.ShadowMapProjectionMatrix]: {
        //             type: UniformTypes.Matrix4,
        //             value: Matrix4.identity,
        //         },
        //     },
        // });

        // this.materials.push(...this.lightShaftSamplePass.materials);

        //
        // blur passes
        //

        // blur 1
        this.blur1Pass = new RadialBlurPass({
            gpu,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.blur1Pass.materials);

        // blur 2
        this.blur2Pass = new RadialBlurPass({
            gpu,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.blur2Pass.materials);

        // blur 3
        this.blur3Pass = new RadialBlurPass({
            gpu,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
        });
        this.materials.push(...this.blur3Pass.materials);

        //
        // composite pass
        //

        // TODO: レンダリングに差し込む場合はr11g11b10fがよいはず
        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftCompositeFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                uBlurTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uLightShaftTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
            },
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

        this.lightShaftDownSamplePass.setSize(width / 2, height / 2);
        this.blur1Pass.setSize(width / 2, height / 2);
        this.blur2Pass.setSize(width / 2, height / 2);
        this.blur3Pass.setSize(width / 2, height / 2);
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

        // TODO: shadowmapを使った方法からの置き換え

        this.lightShaftDownSamplePass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
        // console.log(this.lightShaftDownSamplePass.materials)

        // console.log(this.lightShaftDownSamplePass)

        //
        // light shaft sample pass
        //

        // this.lightShaftSamplePass.material.updateUniform('uRayStep', this.rayStep);
        // this.lightShaftSamplePass.material.updateUniform('uRayNearOffset', this.rayNearOffset);
        // this.lightShaftSamplePass.material.updateUniform('uAttenuationBase', this.attenuationBase);
        // this.lightShaftSamplePass.material.updateUniform('uAttenuationPower', this.attenuationPower);
        // this.lightShaftSamplePass.material.updateUniform('uBlendRate', this.blendRate);
        // this.lightShaftSamplePass.material.updateUniform('uDepthBias', this.depthBias);
        // this.lightShaftSamplePass.material.updateUniform('uRayJitterSizeX', this.rayJitterSizeX);
        // // TODO: aspect比かけた方がよい？
        // this.lightShaftSamplePass.material.updateUniform('uRayJitterSizeY', this.rayJitterSizeY);
        // this.lightShaftSamplePass.render({
        //     gpu,
        //     camera,
        //     renderer,
        //     prevRenderTarget,
        //     isLastPass: false,
        //     targetCamera,
        //     gBufferRenderTargets,
        //     time,
        // });

        //
        // blur pass
        //

        this.blur1Pass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: this.lightShaftDownSamplePass.renderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
        this.blur2Pass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: this.blur1Pass.renderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
        this.blur3Pass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: this.blur2Pass.renderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });

        //
        // light shaft composite pass
        //

        // this.compositePass.material.updateUniform(
        //     'uLightShaftTexture',
        //     this.lightShaftSamplePass.renderTarget.read.texture
        // );
        // // this.compositePass.material.updateUniform(
        // //     'uLightShaftTexelSize',
        // //     new Vector2(1 / this.lightShaftSamplePass.width, 1 / this.lightShaftSamplePass.height)
        // // );
        this.compositePass.material.updateUniform('uBlurTexture', this.blur3Pass.renderTarget.read.texture);

        this.compositePass.render({
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

    // --------------------------------------------------------------------------------
    // private
    // --------------------------------------------------------------------------------

    // #width = 1;
    // #height = 1;

    // #lastPass;
    private lightShaftDownSamplePass: FragmentPass;
    // private lightShaftSamplePass: FragmentPass;
    private blur1Pass: RadialBlurPass;
    private blur2Pass: RadialBlurPass;
    private blur3Pass: RadialBlurPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
