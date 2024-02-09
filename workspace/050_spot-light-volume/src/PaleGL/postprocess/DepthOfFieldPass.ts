import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import dofCircleOfConfusionFragmentShader from '@/PaleGL/shaders/dof-circle-of-confusion-fragment.glsl';
import dofPreFilterFragmentShader from '@/PaleGL/shaders/dof-pre-filter-fragment.glsl';
import dofBokehFragmentShader from '@/PaleGL/shaders/dof-bokeh-fragment.glsl';
import dofBokehBlurFragmentShader from '@/PaleGL/shaders/dof-bokeh-blur-fragment.glsl';
import dofCompositeFragmentShader from '@/PaleGL/shaders/dof-composite-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';

// import { Texture } from '@/PaleGL/core/Texture.ts';

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//

export class DepthOfFieldPass implements IPostProcessPass {
    // --------------------------------------------------------------------------------
    // public
    // --------------------------------------------------------------------------------

    // params
    focusDistance: number = 14;
    focusRange: number = 10;
    bokehRadius = 4;

    // wip blade bokeh
    // focalLength: number = 200;
    // aperture: number = 2.8;
    // bladeCount: number = 5;
    // bladeCurvature: number = 0;
    // bladeRotation: number = 0;

    // gpu: GPU;
    name: string = 'DepthOfFieldPass';
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
        // circle of confusion pass
        //

        // TODO: RHalf format
        this.circleOfConfusionPass = new FragmentPass({
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
                    value: this.focusDistance,
                },
                {
                    name: 'uFocusRange',
                    type: UniformTypes.Float,
                    value: this.focusRange,
                },
                {
                    name: 'uBokehRadius',
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
                {
                    name: 'uCocParams',
                    type: UniformTypes.Vector4,
                    value: Vector4.zero,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            // TODO: r11f_g11f_b10fだとunsignedなのでr16fにする
            // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA16F
            renderTargetType: RenderTargetTypes.R16F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.circleOfConfusionPass.materials);

        //
        // prefilter
        //

        // TODO: RHalf format
        this.preFilterPass = new FragmentPass({
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
                    name: 'uCocTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uTexelSize',
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            renderTargetType: RenderTargetTypes.RGBA16F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.preFilterPass.materials);

        //
        // dof bokeh pass
        //

        this.dofBokehPass = new FragmentPass({
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
                    value: Vector2.zero,
                },
                {
                    name: 'uBokehRadius',
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
                {
                    name: 'uBokehKernel',
                    type: UniformTypes.Vector4Array,
                    value: [],
                },
                // uCocTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
            ],
        });
        this.materials.push(...this.dofBokehPass.materials);

        //
        // bokeh blur pass
        //

        this.bokehBlurPass = new FragmentPass({
            gpu,
            fragmentShader: dofBokehBlurFragmentShader,
            // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            renderTargetType: RenderTargetTypes.RGBA16F,
            uniforms: [
                {
                    name: 'uTexelSize',
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                {
                    name: 'uBokehRadius',
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
            ],
        });
        this.materials.push(...this.bokehBlurPass.materials);

        //
        // composite pass
        //

        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: dofCompositeFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: [
                {
                    name: 'uCocTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uDofTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
            ],
        });

        this.materials.push(...this.compositePass.materials);
    }

    // /**
    //  *
    //  */
    // setup() {
    //     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.CameraNear, camera.near);
    //     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.CameraFar, camera.far);
    //     // this.circleOfConfusionPass.material.uniforms.setValue(UniformNames.DepthTexture, depthTexture);
    // }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        // this.#width = width;
        // this.#height = height;
        this.width = width;
        this.height = height;

        this.circleOfConfusionPass.setSize(width, height);
        this.preFilterPass.setSize(width / 2, height / 2);

        this.dofBokehPass.setSize(width / 2, height / 2);
        // this.bokehBlurPass.setSize(width / 2, height / 2);
        this.bokehBlurPass.setSize(width / 2, height / 2);

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
        // 0: render coc pass
        //

        this.circleOfConfusionPass.material.uniforms.setValue('uFocusDistance', this.focusDistance);
        this.circleOfConfusionPass.material.uniforms.setValue('uFocusRange', this.focusRange);
        this.circleOfConfusionPass.material.uniforms.setValue('uBokehRadius', this.bokehRadius);

        this.circleOfConfusionPass.render({
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

        this.preFilterPass.material.uniforms.setValue('uCocTexture', this.circleOfConfusionPass.renderTarget.texture);

        this.preFilterPass.material.uniforms.setValue(
            'uTexelSize',
            new Vector2(1 / this.circleOfConfusionPass.width, 1 / this.circleOfConfusionPass.height)
        );

        this.preFilterPass.render({
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

        // this.dofBokehPass.material.uniforms.setValue('uCocTexture', this.circleOfConfusionPass.renderTarget.texture);
        this.dofBokehPass.material.uniforms.setValue(
            'uTexelSize',
            new Vector2(1 / this.preFilterPass.width, 1 / this.preFilterPass.height)
        );
        this.dofBokehPass.material.uniforms.setValue('uBokehRadius', this.bokehRadius);

        this.dofBokehPass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
            prevRenderTarget: this.preFilterPass.renderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });

        //
        // 3: render bokeh blur pass
        //

        this.bokehBlurPass.material.uniforms.setValue(
            'uTexelSize',
            // new Vector2(1 / this.bokehBlurPass.width, 1 / this.bokehBlurPass.height)
            new Vector2(1 / this.dofBokehPass.width, 1 / this.dofBokehPass.height)
        );
        this.bokehBlurPass.material.uniforms.setValue('uBokehRadius', this.bokehRadius);

        this.bokehBlurPass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
            prevRenderTarget: this.dofBokehPass.renderTarget,
            isLastPass: false,
            targetCamera,
            gBufferRenderTargets,
            time,
        });

        //
        // 4: render composite pass
        //

        // this.compositePass.material.uniforms.setValue('uCocTexture', this.preFilterPass.renderTarget.texture);
        this.compositePass.material.uniforms.setValue('uCocTexture', this.circleOfConfusionPass.renderTarget.texture);
        this.compositePass.material.uniforms.setValue('uDofTexture', this.bokehBlurPass.renderTarget.texture);

        this.compositePass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
            // prevRenderTarget: this.preFilterPass.renderTarget,
            // prevRenderTarget: this.dofBokehPass.renderTarget,
            // prevRenderTarget: this.bokehBlurPass.renderTarget,
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
    private circleOfConfusionPass: FragmentPass;
    private preFilterPass: FragmentPass;
    private dofBokehPass: FragmentPass;
    private bokehBlurPass: FragmentPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
