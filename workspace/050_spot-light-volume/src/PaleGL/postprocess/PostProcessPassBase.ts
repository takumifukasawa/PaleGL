import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { LightActors, Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import { PrimitiveTypes, RenderTargetType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import { Light } from '@/PaleGL/actors/Light.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

export type PostProcessPassRenderArgs = {
    gpu: GPU;
    camera: Camera;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    isLastPass: boolean;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    targetCamera: Camera;
    time: number;
    lightActors?: LightActors;
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
    enabled: boolean = true;
    width: number = 1;
    height: number = 1;

    mesh: Mesh;
    geometry: PlaneGeometry;
    material: Material;
    private _renderTarget: RenderTarget;

    materials: Material[] = [];

    beforeRender: (() => void) | null = null;

    /**
     *
     */
    get renderTarget(): RenderTarget {
        return this._renderTarget;
    }

    /**
     *
     */
    static get baseVertexShader() {
        return postProcessPassVertexShader;
    }

    /**
     *
     * @param gpu
     * @param vertexShader
     * @param fragmentShader
     * @param uniforms
     * @param useEnvMap
     * @param receiveShadow
     * @param name
     * @param renderTargetType
     */
    constructor({
        gpu,
        vertexShader,
        fragmentShader,
        rawVertexShader,
        rawFragmentShader,
        uniforms = [],
        useEnvMap = false,
        receiveShadow = false,
        name = '',
        renderTargetType = RenderTargetTypes.RGBA,
    }: {
        gpu: GPU;
        vertexShader?: string;
        fragmentShader?: string;
        rawVertexShader?: string;
        rawFragmentShader?: string;
        uniforms?: UniformsData;
        useEnvMap?: boolean;
        receiveShadow?: boolean;
        name?: string;
        renderTargetType?: RenderTargetType;
    }) {
        // super({name});
        this.name = name;

        const baseVertexShader = PostProcessPassBase.baseVertexShader;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.geometry = new PlaneGeometry({ gpu });
        this.material = new Material({
            // gpu,
            name,
            vertexShader,
            fragmentShader,
            rawVertexShader,
            rawFragmentShader,
            uniforms: [
                ...uniforms,
                ...PostProcessPassBase.commonUniforms,
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
            ],
            useEnvMap: !!useEnvMap,
            receiveShadow: !!receiveShadow,
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
            type: renderTargetType,
        });
    }

    static get commonUniforms(): UniformsData {
        return [
            {
                name: UniformNames.TargetWidth,
                type: UniformTypes.Float,
                value: 1,
            },
            {
                name: UniformNames.TargetHeight,
                type: UniformTypes.Float,
                value: 1,
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.ViewPosition,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.ViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.TransposeInverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
        ];
        // passMaterial.updateUniform(UniformNames.GBufferATexture, renderer.gBufferRenderTargets.gBufferATexture);
        // passMaterial.updateUniform(UniformNames.GBufferBTexture, renderer.gBufferRenderTargets.gBufferBTexture);
        // passMaterial.updateUniform(UniformNames.DepthTexture, renderer.depthPrePassRenderTarget.depthTexture);
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
            renderer.setRenderTarget(camera.renderTarget, true);
        } else {
            renderer.setRenderTarget(this._renderTarget, true);
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
     */
    render({ gpu, targetCamera, renderer, prevRenderTarget, isLastPass }: PostProcessPassRenderArgs): void {
        // TODO: 整理したい. render時にsetRenderTargetしちゃって問題ない？？
        this.setRenderTarget(renderer, targetCamera, isLastPass);

        // ppの場合はいらない気がする
        this.mesh.updateTransform();

        if (!this.material.isCompiledShader) {
            this.material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        }

        // 渡してない場合はなにもしない. src texture がいらないとみなす
        // TODO: 無理やり渡しちゃっても良い気もしなくもない
        if (prevRenderTarget) {
            this.material.uniforms.setValue(UniformNames.SrcTexture, prevRenderTarget.texture);
        }

        if (this.beforeRender) {
            this.beforeRender();
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}
