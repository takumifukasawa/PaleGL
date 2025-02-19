import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { LightActors, Renderer } from '@/PaleGL/core/Renderer.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import {
    PostProcessPassType,
    PrimitiveTypes,
    RenderTargetType,
    RenderTargetTypes,
    TextureFilterType,
    TextureFilterTypes,
    TextureWrapType,
    TextureWrapTypes,
    UniformBlockName,
    // UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import { Light } from '@/PaleGL/actors/Light.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';

type PostProcessPassParametersTemplate = {
    enabled: boolean;
};

// export type PostProcessPassParametersBase = PostProcessPassParametersTemplate & IPostProcessPassParameters<PostProcessPassParametersBase>;
export type PostProcessPassParametersBase = PostProcessPassParametersTemplate;

// export interface IPostProcessPassParameters<T extends PostProcessPassParametersBase> {
//     update?: (parameter: T) => T;
//     updateKey?: (key: keyof T, value: T[keyof T]) => T;
// }

export type PostProcessPassParametersBaseArgs = {
    enabled?: boolean;
};

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

export class PostProcessPassBase implements IPostProcessPass {
    // protected gpu: GPU;
    name: string;
    width: number = 1;
    height: number = 1;
    type: PostProcessPassType;

    // enabled: boolean = true;
    parameters: PostProcessPassParametersBase;

    mesh: Mesh;
    geometry: PlaneGeometry;
    material: Material;
    _renderTarget: RenderTarget;

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

    constructor({
        gpu,
        type,
        parameters,
        vertexShader,
        fragmentShader,
        rawVertexShader,
        rawFragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        useEnvMap = false,
        receiveShadow = false,
        name = '',
        renderTargetType = RenderTargetTypes.RGBA,
        minFilter = TextureFilterTypes.Linear,
        magFilter = TextureFilterTypes.Linear,
        wrapT = TextureWrapTypes.ClampToEdge,
        wrapS = TextureWrapTypes.ClampToEdge,
        srcTextureEnabled = true,
    }: {
        gpu: GPU;
        type: PostProcessPassType;
        parameters: PostProcessPassParametersBaseArgs;
        vertexShader?: string;
        fragmentShader?: string;
        rawVertexShader?: string;
        rawFragmentShader?: string;
        uniforms?: UniformsData;
        uniformBlockNames?: UniformBlockName[];
        useEnvMap?: boolean;
        receiveShadow?: boolean;
        name?: string;

        minFilter?: TextureFilterType;
        magFilter?: TextureFilterType;
        wrapS?: TextureWrapType;
        wrapT?: TextureWrapType;
        renderTargetType?: RenderTargetType;
        srcTextureEnabled?: boolean;
    }) {
        // super({name});
        this.name = name;
        this.type = type;

        this.parameters = {
            ...parameters,
            // type: parameters.type,
            enabled: parameters.enabled || true,
        };

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
                ...([{
                    name: UniformNames.BlendRate,
                    type: UniformTypes.Float,
                    value: 1,
                }]),
                ...uniforms,
                ...PostProcessPassBase.commonUniforms,
                ...(srcTextureEnabled
                    ? [
                          {
                              name: UniformNames.SrcTexture,
                              type: UniformTypes.Texture,
                              value: null,
                          },
                      ]
                    : []),
            ],
            uniformBlockNames,
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
            minFilter,
            magFilter,
            wrapS,
            wrapT,
        });
    }

    static get commonUniforms(): UniformsData {
        return [
            {
                name: UniformNames.TexelSize,
                type: UniformTypes.Float,
                value: 1,
            },
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
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
        ];
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

        // TODO: pass base で更新しちゃって大丈夫？
        this.material.uniforms.setValue(UniformNames.TargetWidth, this.width);
        this.material.uniforms.setValue(UniformNames.TargetHeight, this.height);
        this.material.uniforms.setValue(UniformNames.TexelSize, this.width / this.height);
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

    update() {}

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
        this.mesh.$updateTransform();

        // if (!this.material.isCompiledShader) {
        //     this.material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        //     renderer.checkNeedsBindUniformBufferObjectToMaterial(this.material);
        // }
        this.materials.forEach((material) => {
            if (!material.isCompiledShader) {
                material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
                renderer.$checkNeedsBindUniformBufferObjectToMaterial(material);
            }
        });

        // 渡してない場合はなにもしない. src texture がいらないとみなす
        // TODO: 無理やり渡しちゃっても良い気もしなくもない
        if (prevRenderTarget) {
            this.material.uniforms.setValue(UniformNames.SrcTexture, prevRenderTarget.$getTexture());
        }

        if (this.beforeRender) {
            this.beforeRender();
        }

        renderer.renderMesh(this.geometry, this.material);
    }
}
