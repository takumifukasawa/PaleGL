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
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassParametersBaseArgs
// } from "@/PaleGL/postprocess/PostProcessPassBase.ts";
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createMaterial, Material } from '@/PaleGL/materials/material.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { LightActors, Renderer } from '@/PaleGL/core/renderer.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';

export type PostProcessPassParametersTemplate = {
    // gpu: Gpu;
    enabled: boolean;
};

// export type PostProcessPassParametersBase = PostProcessPassParametersTemplate & IPostProcessPassParameters<PostProcessPassParametersBase>;
export type PostProcessPassParametersBase = PostProcessPassParametersTemplate;

// export interface IPostProcessPassParameters<T extends PostProcessPassParametersBase> {
//     update?: (parameter: T) => T;
//     updateKey?: (key: keyof T, value: T[keyof T]) => T;
// }

export type PostProcessPassParametersBaseArgs = {
    gpu: Gpu;
    enabled?: boolean;
};

export type PostProcessPassRenderArgs = {
    gpu: Gpu;
    camera: Camera;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    isLastPass: boolean;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    targetCamera: Camera;
    time: number;
    lightActors?: LightActors;
};

export type PostProcessPassBase = {
    gpu: Gpu,
    name: string;
    type: PostProcessPassType;
    width: number;
    height: number;
    parameters: PostProcessPassParametersBase;
    geometry: Geometry;
    materials: Material[];
    enabled: boolean;
};

type PostProcessPassBaseArgs = Omit<PostProcessPassBase, 'width' | 'height' | 'enabled' | 'parameters'> &
    Partial<{
        width: number;
        height: number;
        enabled: boolean;
        parameters: PostProcessPassParametersBase;
    }>;

export function createPostProcessPassBase(args: PostProcessPassBaseArgs): PostProcessPassBase {
    return {
        gpu: args.gpu,
        name: args.name,
        type: args.type,
        width: args.width !== undefined ? args.width : 1, // TODO: asssign 1
        height: args.height !== undefined ? args.height : 1, // TODO: assign 1
        parameters: args.parameters || { enabled: true },
        geometry: args.geometry,
        materials: args.materials,
        enabled: args.enabled === undefined ? true : args.enabled,
    };
}

export type PostProcessSinglePass = PostProcessPassBase & {
    renderTarget: RenderTarget;
    mesh: Mesh;
    // geometry: Geometry;
    material: Material;
    // materials: Material[];
};

export function createPostProcessSinglePass(args: {
    gpu: Gpu;
    type: PostProcessPassType;
    parameters?: PostProcessPassParametersTemplate;
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
    
    enabled?: boolean;
}): PostProcessSinglePass {
    const {
        gpu,
        type,
        // parameters,
        vertexShader = postProcessPassVertexShader,
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
        enabled
    } = args;

    const width = 1;
    const height = 1;
    const materials: Material[] = [];

    const parameters = {
        ...args.parameters,
        // type: parameters.type,
        // enabled: enabled || true,
    };

    // const baseVertexShader = getPostProcessBaseVertexShader();
    // vertexShader = vertexShader || baseVertexShader;
    
    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = createPlaneGeometry({ gpu });
    const material = createMaterial({
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
            ...getPostProcessCommonUniforms(),
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
    materials.push(material);

    // TODO: mesh生成しなくていい気がする
    const mesh = createMesh({
        geometry,
        material,
    });

    const renderTarget = createRenderTarget({
        gpu,
        width,
        height,
        type: renderTargetType,
        minFilter,
        magFilter,
        wrapS,
        wrapT,
    });
    
    return {
        gpu,
        name,
        type,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        parameters: parameters || { enabled: true }, // TODO: 削除必須
        width,
        height,
        renderTarget,
        mesh,
        geometry,
        material,
        materials,
        enabled: enabled === undefined ? true : enabled,
    };
}

export function getPostProcessBaseVertexShader() {
    return postProcessPassVertexShader;
}

export function getPostProcessCommonUniforms(): UniformsData {
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
