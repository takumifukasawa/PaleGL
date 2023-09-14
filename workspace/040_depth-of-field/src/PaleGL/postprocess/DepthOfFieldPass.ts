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

export class DepthOfFieldPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'BloomPass';
    enabled: boolean = false;
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    // #lastPass;
    private compositePass: FragmentPass;

    private geometry: PlaneGeometry;

    get renderTarget() {
        return this.compositePass.renderTarget;
    }

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
                ...PostProcessPassBase.commonUniforms,
            },
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this.compositePass.materials);
    }

    #width = 1;
    #height = 1;

    setSize(width: number, height: number) {
        this.#width = width;
        this.#height = height;

        console.log(this.#width, this.#height);

        this.compositePass.setSize(width, height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

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
}
