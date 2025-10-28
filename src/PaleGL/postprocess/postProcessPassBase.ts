import {
    PostProcessPassType,
    PRIMITIVE_TYPE_TRIANGLES,
    RenderTargetType,
    RENDER_TARGET_TYPE_RGBA,
    TextureFilterType,
    TEXTURE_FILTER_TYPE_LINEAR,
    TextureWrapType,
    TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE,
    UniformBlockName,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_NAME_BLEND_RATE,
    UNIFORM_NAME_SRC_TEXTURE,
    UNIFORM_NAME_TEXEL_SIZE,
    UNIFORM_NAME_TARGET_WIDTH,
    UNIFORM_NAME_TARGET_HEIGHT,
    UNIFORM_NAME_TIME,
} from '@/PaleGL/constants.ts';
// import {
//     PostProcessPassParametersBase,
//     PostProcessPassParametersBaseArgs
// } from "@/PaleGL/postprocess/PostProcessPassBase.ts";
import { Camera } from '@/PaleGL/actors/cameras/camera.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { LightActors, Renderer } from '@/PaleGL/core/renderer.ts';
import { createRenderTarget, RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { createMaterial, Material } from '@/PaleGL/materials/material.ts';
import postProcessPassVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';

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
    gpu: Gpu;
    name: string;
    type: PostProcessPassType;
    width: number;
    height: number;
    geometry: Geometry;
    materials: Material[];
    enabled: boolean;
};

type PostProcessPassBaseArgs = Omit<PostProcessPassBase, 'width' | 'height' | 'enabled'> &
    Partial<{
        width: number;
        height: number;
        enabled: boolean;
    }>;

export const createPostProcessPassBase = (args: PostProcessPassBaseArgs): PostProcessPassBase => {
    return {
        gpu: args.gpu,
        name: args.name,
        type: args.type,
        width: args.width !== undefined ? args.width : 1, // TODO: asssign 1
        height: args.height !== undefined ? args.height : 1, // TODO: assign 1
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

export const createPostProcessSinglePass = (args: {
    gpu: Gpu;
    type: PostProcessPassType;
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
}): PostProcessSinglePass => {
    const {
        gpu,
        type,
        vertexShader = postProcessPassVertexShader,
        fragmentShader,
        rawVertexShader,
        rawFragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        useEnvMap = false,
        receiveShadow = false,
        name = '',
        renderTargetType = RENDER_TARGET_TYPE_RGBA,
        minFilter = TEXTURE_FILTER_TYPE_LINEAR,
        magFilter = TEXTURE_FILTER_TYPE_LINEAR,
        wrapT = TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE,
        wrapS = TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE,
        srcTextureEnabled = true,
        enabled,
    } = args;

    const width = 1;
    const height = 1;
    const materials: Material[] = [];

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
            ...[[UNIFORM_NAME_BLEND_RATE, UNIFORM_TYPE_FLOAT, 1]] as UniformsData,
            ...uniforms,
            ...getPostProcessCommonUniforms(),
            ...(srcTextureEnabled
                ? ([[UNIFORM_NAME_SRC_TEXTURE, UNIFORM_TYPE_TEXTURE, null]] as UniformsData)
                : []),
        ] as UniformsData,
        uniformBlockNames,
        useEnvMap: !!useEnvMap,
        receiveShadow: !!receiveShadow,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
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

export const getPostProcessBaseVertexShader = () => {
    return postProcessPassVertexShader;
}

export const getPostProcessCommonUniforms = (): UniformsData => {
    return [
        [UNIFORM_NAME_TEXEL_SIZE, UNIFORM_TYPE_FLOAT, 1],
        [UNIFORM_NAME_TARGET_WIDTH, UNIFORM_TYPE_FLOAT, 1],
        [UNIFORM_NAME_TARGET_HEIGHT, UNIFORM_TYPE_FLOAT, 1],
        [UNIFORM_NAME_TIME, UNIFORM_TYPE_FLOAT, 0],
    ];
}
