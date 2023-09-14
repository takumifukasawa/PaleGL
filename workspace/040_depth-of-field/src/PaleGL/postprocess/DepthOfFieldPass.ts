import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import dofCircleOfConfusionFragmentShader from '@/PaleGL/shaders/dof-circle-of-confusion-fragment.glsl';
import dofBokehFragmentShader from '@/PaleGL/shaders/dof-bokeh-fragment.glsl';
import { PostProcessPassBase, PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';

// import { Texture } from '@/PaleGL/core/Texture.ts';

export class DepthOfFieldPass implements IPostProcessPass {
    // --------------------------------------------------------------------------------
    // public
    // --------------------------------------------------------------------------------

    // params
    focusDistance: number = 10;
    focusRange: number = 3;

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
                ...PostProcessPassBase.commonUniforms,
            },
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.circleOfConfusionPass.materials);

        //
        // dof bokeh pass
        //

        this.dofBokehPass = new FragmentPass({
            gpu,
            fragmentShader: dofBokehFragmentShader,
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            uniforms: {
                uSrcTextureWidth: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uSrcTextureHeight: {
                    type: UniformTypes.Float,
                    value: 1,
                },
            },
        });
        this.materials.push(...this.dofBokehPass.materials);
    }

    /**
     *
     */
    setup() {
        // this.circleOfConfusionPass.material.updateUniform(UniformNames.CameraNear, camera.near);
        // this.circleOfConfusionPass.material.updateUniform(UniformNames.CameraFar, camera.far);
        // this.circleOfConfusionPass.material.updateUniform(UniformNames.DepthTexture, depthTexture);
        this.circleOfConfusionPass.material.updateUniform('uFocusDistance', this.focusDistance);
        this.circleOfConfusionPass.material.updateUniform('uFocusRange', this.focusRange);
    }

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
        this.dofBokehPass.setSize(width, height);
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

        this.dofBokehPass.material.updateUniform('uSrcTextureWidth', this.circleOfConfusionPass.width);
        this.dofBokehPass.material.updateUniform('uSrcTextureHeight', this.circleOfConfusionPass.height);

        this.dofBokehPass.render({
            gpu,
            camera,
            renderer,
            // prevRenderTarget: this.circleOfConfusionPass.renderTarget,
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
    private dofBokehPass: FragmentPass;

    private geometry: PlaneGeometry;
}
