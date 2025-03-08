import { createRenderTarget, RenderTarget, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import {
    createMaterial,
    isCompiledMaterialShader,
    Material,
    setMaterialUniformValue, startMaterial
} from '@/PaleGL/materials/material.ts';
import {
    checkNeedsBindUniformBufferObjectToMaterial,
    LightActors,
    Renderer,
    renderMesh, setRendererRenderTarget
} from '@/PaleGL/core/renderer.ts';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
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
import {createMesh, Mesh} from '@/PaleGL/actors/meshes/mesh.ts';
import { createPlaneGeometry, PlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass.ts';
// import { Vector3 } from '@/PaleGL/math/Vector3.ts';
// import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
// import { Light } from '@/PaleGL/actors/light.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {updateActorTransform} from "@/PaleGL/actors/actorBehaviours.ts";
import { getGeometryAttributeDescriptors } from '@/PaleGL/geometries/geometryBehaviours.ts';

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
    // protected gpu: Gpu;
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
        this.geometry = createPlaneGeometry({ gpu });
        this.material = createMaterial({
            // gpu,
            name,
            vertexShader,
            fragmentShader,
            rawVertexShader,
            rawFragmentShader,
            uniforms: [
                ...[
                    {
                        name: UniformNames.BlendRate,
                        type: UniformTypes.Float,
                        value: 1,
                    },
                ],
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
        this.mesh = createMesh({
            geometry: this.geometry,
            material: this.material,
        });

        this._renderTarget = createRenderTarget({
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
        setRenderTargetSize(this._renderTarget, width, height);

        // TODO: pass base で更新しちゃって大丈夫？
        setMaterialUniformValue(this.material, UniformNames.TargetWidth, this.width);
        setMaterialUniformValue(this.material, UniformNames.TargetHeight, this.height);
        setMaterialUniformValue(this.material, UniformNames.TexelSize, this.width / this.height);
    }

    /**
     *
     * @param renderer
     * @param camera
     * @param isLastPass
     */
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {
        if (isLastPass) {
            setRendererRenderTarget(renderer, camera.renderTarget, true);
        } else {
            setRendererRenderTarget(renderer, this._renderTarget, true);
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
        updateActorTransform(this.mesh);
        // this.mesh.$updateTransform();

        // if (!this.material.isCompiledShader) {
        //     this.material.start({ gpu, attributeDescriptors: this.geometry.getAttributeDescriptors() });
        //     renderer.checkNeedsBindUniformBufferObjectToMaterial(this.material);
        // }
        this.materials.forEach((material) => {
            if (!isCompiledMaterialShader(material)) {
                startMaterial(material, { gpu, attributeDescriptors: getGeometryAttributeDescriptors(this.geometry) });
                checkNeedsBindUniformBufferObjectToMaterial(renderer, material);
            }
        });

        // 渡してない場合はなにもしない. src texture がいらないとみなす
        // TODO: 無理やり渡しちゃっても良い気もしなくもない
        if (prevRenderTarget) {
            setMaterialUniformValue(this.material, UniformNames.SrcTexture, prevRenderTarget.texture);
        }

        if (this.beforeRender) {
            this.beforeRender();
        }

        renderMesh(renderer, this.geometry, this.material);
    }
}
