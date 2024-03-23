import {RenderTargetTypes, UniformNames, UniformTypes} from '@/PaleGL/constants';

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
import lightShaftRadialBlurFragmentShader from '@/PaleGL/shaders/light-shaft-radial-blur-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase';
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
// import { RadialBlurPass } from '@/PaleGL/postprocess/RadialBlurPass.ts';
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

    blendRate: number = 0.65;
    passScaleBase: number = 0.2;
    rayStepStrength: number = 0.012;

    name: string = 'LightShaftPass';
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    #directionalLight: DirectionalLight | null = null;

    #radialBlurOriginUniformName: string = 'uRadialBlurOrigin';
    #radialBlurPassScaleBaseUniformName: string = 'uRadialBlurPassScaleBase';
    #radialBlurPassIndexUniformName: string = 'uRadialBlurPassIndex';
    #radialBlurRayStepStrengthUniformName: string = 'uRadialBlurRayStepStrength';

    get renderTarget() {
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
            uniforms: [
                {
                    name: UniformNames.DepthTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            // uniforms: {}
        });
        // this.lightShaftDownSamplePass = new RadialBlurPass({
        //     gpu,
        // });

        this.materials.push(...this.lightShaftDownSamplePass.materials);

        //
        // blur passes
        //

        // blur 1
        this.blur1Pass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftRadialBlurFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    name: this.#radialBlurPassIndexUniformName,
                    type: UniformTypes.Float,
                    value: 0,
                },
                {
                    name: this.#radialBlurOriginUniformName,
                    type: UniformTypes.Vector2,
                    value: Vector2.identity,
                },
                {
                    name: this.#radialBlurPassScaleBaseUniformName,
                    type: UniformTypes.Float,
                    value: this.passScaleBase,
                },
                {
                    name: this.#radialBlurRayStepStrengthUniformName,
                    type: UniformTypes.Float,
                    value: this.rayStepStrength,
                },
            ],
        });

        this.materials.push(...this.blur1Pass.materials);

        // blur 2
        this.blur2Pass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftRadialBlurFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    name: this.#radialBlurPassIndexUniformName,
                    type: UniformTypes.Float,
                    value: 1,
                },
                {
                    name: this.#radialBlurOriginUniformName,
                    type: UniformTypes.Vector2,
                    value: Vector2.identity,
                },
                {
                    name: this.#radialBlurPassScaleBaseUniformName,
                    type: UniformTypes.Float,
                    value: this.passScaleBase,
                },
                {
                    name: this.#radialBlurRayStepStrengthUniformName,
                    type: UniformTypes.Float,
                    value: this.rayStepStrength,
                },
            ],
        });

        this.materials.push(...this.blur2Pass.materials);

        // blur 3
        this.blur3Pass = new FragmentPass({
            gpu,
            fragmentShader: lightShaftRadialBlurFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    name: this.#radialBlurPassIndexUniformName,
                    type: UniformTypes.Float,
                    value: 2,
                },
                {
                    name: this.#radialBlurOriginUniformName,
                    type: UniformTypes.Vector2,
                    value: Vector2.identity,
                },
                {
                    name: this.#radialBlurPassScaleBaseUniformName,
                    type: UniformTypes.Float,
                    value: this.passScaleBase,
                },
                {
                    name: this.#radialBlurRayStepStrengthUniformName,
                    type: UniformTypes.Float,
                    value: this.rayStepStrength,
                },
            ],
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
            uniforms: [
                {
                    name: 'uLightShaftTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlendRate',
                    type: UniformTypes.Float,
                    value: this.blendRate,
                },
            ],
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

    update() {}
    
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

        //
        // blur pass
        //

        // -1 ~ 1 (in screen)
        // directional light の位置をそのまま使う場合
        // const lightPositionInClip = targetCamera.transformScreenPoint(this.#directionalLight!.transform.position);
        // 適当に遠いところに飛ばす場合 TODO: directionを考慮。位置だけだとダメ
        const lightPositionInClip = targetCamera.transformScreenPoint(
            this.#directionalLight!.transform.position.clone().scale(10000)
        );
        // 0 ~ 1
        const lightPositionInUv = new Vector2(lightPositionInClip.x * 0.5 + 0.5, lightPositionInClip.y * 0.5 + 0.5);
        // this.#directionalLight!.transform.getPositionInScreen(targetCamera);

        this.blur1Pass.material.uniforms.setValue(this.#radialBlurOriginUniformName, lightPositionInUv);
        this.blur1Pass.material.uniforms.setValue(this.#radialBlurPassScaleBaseUniformName, this.passScaleBase);
        this.blur1Pass.material.uniforms.setValue(this.#radialBlurRayStepStrengthUniformName, this.rayStepStrength);

        this.blur2Pass.material.uniforms.setValue(this.#radialBlurOriginUniformName, lightPositionInUv);
        this.blur2Pass.material.uniforms.setValue(this.#radialBlurPassScaleBaseUniformName, this.passScaleBase);
        this.blur2Pass.material.uniforms.setValue(this.#radialBlurRayStepStrengthUniformName, this.rayStepStrength);

        this.blur3Pass.material.uniforms.setValue(this.#radialBlurOriginUniformName, lightPositionInUv);
        this.blur3Pass.material.uniforms.setValue(this.#radialBlurPassScaleBaseUniformName, this.passScaleBase);
        this.blur3Pass.material.uniforms.setValue(this.#radialBlurRayStepStrengthUniformName, this.rayStepStrength);

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

        this.compositePass.material.uniforms.setValue('uLightShaftTexture', this.blur3Pass.renderTarget.read.texture);
        this.compositePass.material.uniforms.setValue('uBlendRate', this.blendRate);

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

    setDirectionalLight(light: DirectionalLight) {
        // light.transform.position
        this.#directionalLight = light;
    }

    // --------------------------------------------------------------------------------
    // private
    // --------------------------------------------------------------------------------

    // #width = 1;
    // #height = 1;

    // #lastPass;
    private lightShaftDownSamplePass: FragmentPass;
    // private lightShaftSamplePass: FragmentPass;
    private blur1Pass: FragmentPass;
    private blur2Pass: FragmentPass;
    private blur3Pass: FragmentPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
