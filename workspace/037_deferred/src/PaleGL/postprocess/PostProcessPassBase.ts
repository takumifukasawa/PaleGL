import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material, Uniforms } from '@/PaleGL/materials/Material.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import { PrimitiveTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import {IPostProcessPass} from "@/PaleGL/postprocess/IPostProcessPass.ts";

export type PostProcessRenderArgs = {
    gpu: GPU;
    camera: Camera;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    isLastPass: boolean;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    targetCamera: Camera;
    time: number;
};

// export interface IPostProcessPass {
//     // gpu: GPU;
//     name: string;
//     enabled: boolean;
//     width: number;
//     height: number;
//     renderTarget: RenderTarget;
//     materials: Material[];
// 
//     setSize: (width: number, height: number) => void;
//     setRenderTarget: (renderer: Renderer, camera: Camera, isLastPass: boolean) => void;
//     render: ({ gpu, camera, renderer, prevRenderTarget, isLastPass, time }: PostProcessRenderArgs) => void;
// }

export class PostProcessPassBase implements IPostProcessPass {
    // protected gpu: GPU;
    name: string;
    enabled: boolean = false;
    width: number = 1;
    height: number = 1;

    mesh: Mesh;
    geometry: PlaneGeometry;
    material: Material;
    private _renderTarget: RenderTarget;

    materials: Material[] = [];

    get renderTarget(): RenderTarget {
        return this._renderTarget;
    }

    // TODO: glslファイル化
    static get baseVertexShader() {
        return postProcessPassVertexShader;
    }

    /**
     *
     * @param gpu
     * @param vertexShader
     * @param fragmentShader
     * @param uniforms
     * @param name
     */
    constructor({
        gpu,
        vertexShader,
        fragmentShader,
        uniforms,
        name = '',
    }: {
        gpu: GPU;
        vertexShader?: string;
        fragmentShader: string;
        uniforms?: Uniforms;
        name?: string;
    }) {
        // super({name});
        this.name = name;
        
        const baseVertexShader = PostProcessPassBase.baseVertexShader;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });
        this.material = new Material({
            // gpu,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...uniforms,
                [UniformNames.SrcTexture]: {
                    type: UniformTypes.Texture,
                    value: null,
                },
            },
            primitiveType: PrimitiveTypes.Triangles,
        });
        this.materials.push(this.material);

        // TODO: mesh生成しなくていい気がする
        this.mesh = new Mesh({
            geometry: this.geometry,
            material: this.material,
        });

        this._renderTarget = new RenderTarget({
            gpu,
            width: 1,
            height: 1,
        });
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this._renderTarget.setSize(width, height);
    }

    /**
     *
     * @param renderer
     * @param camera
     * @param isLastPass
     */
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {
        if (isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this._renderTarget);
        }
    }

    /**
     * TODO: rename "prevRenderTarget"
     *
     * @param gpu
     * @param camera
     * @param renderer
     * @param prevRenderTarget
     * @param isLastPass
     * @param targetCamera
     * @param gBufferRenderTargets
     */
    render({ gpu, targetCamera, renderer, prevRenderTarget, isLastPass }: PostProcessRenderArgs): void {
        this.setRenderTarget(renderer, targetCamera, isLastPass);

        // ppの場合はいらない気がする
        this.mesh.updateTransform();

        if (!this.material.isCompiledShader) {
            this.material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        }

        // 渡してない場合はなにもしない. src texture がいらないとみなす
        // TODO: 無理やり渡しちゃっても良い気もしなくもない
        if (prevRenderTarget) {
            this.material.updateUniform(UniformNames.SrcTexture, prevRenderTarget.texture);
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}
