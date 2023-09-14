import { RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { Material } from '@/PaleGL/materials/Material';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import depthOfFieldFragmentShader from '@/PaleGL/shaders/depth-of-field-composite-fragment.glsl';
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

        this.compositePass = new FragmentPass({
            gpu,
            fragmentShader: depthOfFieldFragmentShader,
            uniforms: {
                [UniformNames.SrcTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                [UniformNames.DepthTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
                "uFocusDistance": {
                    type: UniformTypes.Float,
                    value: this.focusDistance,
                },
                "uFocusRange": {
                    type: UniformTypes.Float,
                    value: this.focusRange,
                },
                ...PostProcessPassBase.commonUniforms,
            },
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.compositePass.materials);
    }

    /**
     * 
     */
    setup() {
        // this.compositePass.material.updateUniform(UniformNames.CameraNear, camera.near);
        // this.compositePass.material.updateUniform(UniformNames.CameraFar, camera.far);
        // this.compositePass.material.updateUniform(UniformNames.DepthTexture, depthTexture);
        this.compositePass.material.updateUniform("uFocusDistance", this.focusDistance);
        this.compositePass.material.updateUniform("uFocusRange", this.focusRange);
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.#width = width;
        this.#height = height;

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

    #width = 1;
    #height = 1;

    // #lastPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;
}
