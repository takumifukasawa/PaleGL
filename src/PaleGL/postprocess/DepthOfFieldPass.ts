import {
    PostProcessPassType,
    RenderTargetTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import {createPlaneGeometry, PlaneGeometry} from '@/PaleGL/geometries/planeGeometry.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import dofCircleOfConfusionFragmentShader from '@/PaleGL/shaders/dof-circle-of-confusion-fragment.glsl';
import dofPreFilterFragmentShader from '@/PaleGL/shaders/dof-pre-filter-fragment.glsl';
import dofBokehFragmentShader from '@/PaleGL/shaders/dof-bokeh-fragment.glsl';
import dofBokehBlurFragmentShader from '@/PaleGL/shaders/dof-bokeh-blur-fragment.glsl';
import dofCompositeFragmentShader from '@/PaleGL/shaders/dof-composite-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';

const UNIFORM_NAME_COC_TEXTURE = 'uCocTexture';
const UNIFORM_NAME_DOF_TEXTURE = 'uDofTexture';

//
// ref:
// https://catlikecoding.com/unity/tutorials/advanced-rendering/depth-of-field/
// https://github.com/keijiro/KinoBokeh/tree/master
//

export type DepthOfFieldPassParametersBase = {
    focusDistance: number;
    focusRange: number;
    bokehRadius: number;
};

export type DepthOfFieldPassParameters = PostProcessPassParametersBase & DepthOfFieldPassParametersBase;

export type DepthOfFieldPassArgs = Partial<DepthOfFieldPassParameters>;

export function generateDepthOfFieldPassParameters(args: DepthOfFieldPassArgs = {}): DepthOfFieldPassParameters {
    return {
        enabled: args.enabled ?? true,
        focusDistance: args.focusDistance ?? 14,
        focusRange: args.focusRange ?? 10,
        bokehRadius: args.bokehRadius ?? 4,
    };
}

export class DepthOfFieldPass implements IPostProcessPass {
    // --------------------------------------------------------------------------------
    // public
    // --------------------------------------------------------------------------------

    type = PostProcessPassType.DepthOfField;

    // params
    // focusDistance: number = 14;
    // focusRange: number = 10;
    // bokehRadius = 4;
    parameters: DepthOfFieldPassParameters;

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
        // return this.circleOfConfusionPass.renderTarget;
        // return this.preFilterPass.renderTarget;
        // return this.dofBokehPass.renderTarget;
        // return this.bokehBlurPass.renderTarget;
        return this.compositePass.renderTarget;
    }

    /**
     *
     * @param gpu
     */
    constructor({ gpu, parameters }: { gpu: GPU; parameters?: DepthOfFieldPassParameters }) {
        // super();

        // this.gpu = gpu;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = createPlaneGeometry({ gpu });

        this.parameters = generateDepthOfFieldPassParameters(parameters);

        //
        // circle of confusion pass
        //

        // TODO: RHalf format
        this.circleOfConfusionPass = new FragmentPass({
            name: 'circleOfConfusionPass',
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
                    value: this.parameters.focusDistance,
                },
                {
                    name: 'uFocusRange',
                    type: UniformTypes.Float,
                    value: this.parameters.focusRange,
                },
                {
                    name: 'uBokehRadius',
                    type: UniformTypes.Float,
                    value: this.parameters.bokehRadius,
                },
                // {
                //     name: 'uCocParams',
                //     type: UniformTypes.Vector4,
                //     value: Vector4.zero,
                // },
                ...PostProcessPassBase.commonUniforms,
            ],
            uniformBlockNames: [
                // UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
            ],
            // NOTE: r11f_g11f_b10fだとunsignedなのでr16fにする
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
                    name: UNIFORM_NAME_COC_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UniformNames.TexelSize,
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
                    value: this.parameters.bokehRadius,
                },
                {
                    name: 'uBokehKernel',
                    type: UniformTypes.Vector4Array,
                    value: [],
                },
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
                    value: this.parameters.bokehRadius,
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
                    name: UNIFORM_NAME_COC_TEXTURE,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_DOF_TEXTURE,
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
        const w = Math.floor(width);
        const h = Math.floor(height);

        this.width = w;
        this.height = h;
        
        const downResolution = 2.;
        const rw = Math.floor(w / downResolution);
        const rh = Math.floor(h / downResolution);

        this.circleOfConfusionPass.setSize(rw, rh);
        this.preFilterPass.setSize(rw, rh);
        this.dofBokehPass.setSize(rw, rh);
        this.bokehBlurPass.setSize(rw, rh);

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

        //
        // 0: render coc pass
        //

        this.circleOfConfusionPass.material.uniforms.setValue('uFocusDistance', this.parameters.focusDistance);
        this.circleOfConfusionPass.material.uniforms.setValue('uFocusRange', this.parameters.focusRange);
        this.circleOfConfusionPass.material.uniforms.setValue('uBokehRadius', this.parameters.bokehRadius);

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

        this.preFilterPass.material.uniforms.setValue(UNIFORM_NAME_COC_TEXTURE, this.circleOfConfusionPass.renderTarget.$getTexture());

        this.preFilterPass.material.uniforms.setValue(
            UniformNames.TexelSize,
            new Vector2(1 / this.preFilterPass.width, 1 / this.preFilterPass.height)
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

        // this.dofBokehPass.material.uniforms.setValue('uCocTexture', this.circleOfConfusionPass.renderTarget.$getTexture());
        this.dofBokehPass.material.uniforms.setValue(
            'uTexelSize',
            new Vector2(1 / this.preFilterPass.width, 1 / this.preFilterPass.height)
        );
        this.dofBokehPass.material.uniforms.setValue('uBokehRadius', this.parameters.bokehRadius);

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
        this.bokehBlurPass.material.uniforms.setValue('uBokehRadius', this.parameters.bokehRadius);

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

        // this.compositePass.material.uniforms.setValue('uCocTexture', this.preFilterPass.renderTarget.$getTexture());
        this.compositePass.material.uniforms.setValue(UNIFORM_NAME_COC_TEXTURE, this.circleOfConfusionPass.renderTarget.$getTexture());
        this.compositePass.material.uniforms.setValue(UNIFORM_NAME_DOF_TEXTURE, this.bokehBlurPass.renderTarget.$getTexture());

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
    circleOfConfusionPass: FragmentPass;
    preFilterPass: FragmentPass;
    dofBokehPass: FragmentPass;
    bokehBlurPass: FragmentPass;
    compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
