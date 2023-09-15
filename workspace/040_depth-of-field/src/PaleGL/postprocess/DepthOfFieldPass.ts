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

// import { Texture } from '@/PaleGL/core/Texture.ts';

export class DepthOfFieldPass implements IPostProcessPass {
    // --------------------------------------------------------------------------------
    // public
    // --------------------------------------------------------------------------------

    // params
    focusDistance: number = 10;
    focusRange: number = 3;
    bokehRadius = 4;

    // gpu: GPU;
    name: string = 'DepthOfFieldPass';
    enabled: boolean = false;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    get renderTarget() {
        return this.circleOfConfusionPass.renderTarget;
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
            uniforms: {
                [UniformNames.SrcTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [UniformNames.DepthTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uFocusDistance: {
                    type: UniformTypes.Float,
                    value: this.focusDistance,
                },
                uFocusRange: {
                    type: UniformTypes.Float,
                    value: this.focusRange,
                },
                uBokehRadius: {
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
                ...PostProcessPassBase.commonUniforms,
            },
            // TODO: r11f_g11f_b10fだとunsignedなのでr16fにする
            // renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA16F
            renderTargetType: RenderTargetTypes.R16F
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
            uniforms: {
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
                // },
                uCocTexture: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                uTexelSize: {
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                ...PostProcessPassBase.commonUniforms,
            },
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
            uniforms: {
                // uSrcTextureWidth: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                // uSrcTextureHeight: {
                //     type: UniformTypes.Float,
                //     value: 1,
                // },
                uTexelSize: {
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                uBokehRadius: {
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
                // uCocTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
            },
        });
        this.materials.push(...this.dofBokehPass.materials);

        //
        // bokeh blur pass
        //

        this.bokehBlurPass = new FragmentPass({
            gpu,
            fragmentShader: dofBokehBlurFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                uTexelSize: {
                    type: UniformTypes.Vector2,
                    value: Vector2.zero,
                },
                uBokehRadius: {
                    type: UniformTypes.Float,
                    value: this.bokehRadius,
                },
            },
        });
        this.materials.push(...this.bokehBlurPass.materials);

        //
        // composite pass
        //

        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: dofCompositeFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                // uCocTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
            },
        });

        this.materials.push(...this.compositePass.materials);
    }

    // /**
    //  *
    //  */
    // setup() {
    //     // this.circleOfConfusionPass.material.updateUniform(UniformNames.CameraNear, camera.near);
    //     // this.circleOfConfusionPass.material.updateUniform(UniformNames.CameraFar, camera.far);
    //     // this.circleOfConfusionPass.material.updateUniform(UniformNames.DepthTexture, depthTexture);
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

        this.circleOfConfusionPass.material.updateUniform('uFocusDistance', this.focusDistance);
        this.circleOfConfusionPass.material.updateUniform('uFocusRange', this.focusRange);
        this.circleOfConfusionPass.material.updateUniform('uBokehRadius', this.bokehRadius);

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

        this.preFilterPass.material.updateUniform('uCocTexture', this.circleOfConfusionPass.renderTarget.texture);

        this.preFilterPass.material.updateUniform(
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

        // this.dofBokehPass.material.updateUniform('uCocTexture', this.circleOfConfusionPass.renderTarget.texture);
        this.dofBokehPass.material.updateUniform('uTexelSize', new Vector2(1 / this.width, 1 / this.height));
        this.dofBokehPass.material.updateUniform('uBokehRadius', this.bokehRadius);

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

        this.bokehBlurPass.material.updateUniform(
            'uTexelSize',
            // new Vector2(1 / this.bokehBlurPass.width, 1 / this.bokehBlurPass.height)
            new Vector2(1 / this.dofBokehPass.width, 1 / this.dofBokehPass.height)
        );
        this.bokehBlurPass.material.updateUniform('uBokehRadius', this.bokehRadius);

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

        this.compositePass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
            prevRenderTarget: this.preFilterPass.renderTarget,
            // prevRenderTarget: this.dofBokehPass.renderTarget,
            // prevRenderTarget: this.bokehBlurPass.renderTarget,
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
