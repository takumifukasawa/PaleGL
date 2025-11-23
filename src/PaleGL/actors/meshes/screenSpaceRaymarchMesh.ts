import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE,
    MESH_TYPE_SCREEN_SPACE_RAYMARCH,
    PRIMITIVE_TYPE_TRIANGLES,
    UNIFORM_NAME_VIEW_DIRECTION,
    UNIFORM_NAME_TARGET_WIDTH,
    UNIFORM_NAME_TARGET_HEIGHT,
    UNIFORM_TYPE_VECTOR3,
} from '@/PaleGL/constants.ts';
import { createMesh, Mesh, MeshArgs, MeshOptionsArgs } from '@/PaleGL/actors/meshes/mesh.ts';
import { getMeshMainMaterial, getMeshMaterial } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {
    createScreenSpaceRaymarchMaterial,
    ScreenSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/screenSpaceRaymarchMaterial.ts';
import { MaterialArgs, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import { gbufferScreenSpaceRaymarchDepthFragmentTemplate } from '@/PaleGL/shaders/templates/gbuffer-screen-space-raymarch-depth-fragment-template.ts';
// import { litScreenSpaceRaymarchFragmentTemplate } from '@/PaleGL/shaders/templates/lit-screen-space-raymarch-fragment-template.ts';
import litScreenSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-screen-space-raymarch-fragment.glsl';
import gbufferScreenSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-gbuffer-screen-space-raymarch-depth-fragment.glsl';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { getPostProcessCommonUniforms } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { createVector3Zero } from '@/PaleGL/math/vector3.ts';

export type ScreenSpaceRaymarchMeshArgs = {
    gpu: Gpu;
    name?: string;
    geometry?: Geometry;
    uniforms?: UniformsData;
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
    materialArgs: ScreenSpaceRaymarchMaterialArgs;
    // } & MaterialArgs;
} & MeshOptionsArgs;

export type ScreenSpaceRaymarchMesh = Mesh;

export function createScreenSpaceRaymarchMesh(args: ScreenSpaceRaymarchMeshArgs) {
    const { gpu, name = '', uniforms = [], materialArgs, castShadow } = args;

    const mergedUniforms: UniformsData = [
        [UNIFORM_NAME_VIEW_DIRECTION, UNIFORM_TYPE_VECTOR3, createVector3Zero()],
        ...uniforms,
        ...getPostProcessCommonUniforms(),
    ];

    // const pragmaKey = `#pragma ${PRAGMA_RAYMARCH_SCENE}`;
    // const fragmentShader = (args.fragmentShaderTemplate ?? litScreenSpaceRaymarchFragmentLayout).replace(
    //     pragmaKey,
    //     args.fragmentShaderContent
    // );
    // const depthFragmentShader = (
    //     args.depthFragmentShaderTemplate ??
    // ).replace(
    //     pragmaKey,
    //     args.depthFragmentShaderContent
    // );

    // const fragmentShader = (args.fragmentShaderTemplate ?? litScreenSpaceRaymarchFragmentLayout).replace(
    //     PRAGMA_RAYMARCH_SCENE,
    //     args.fragmentShaderContent
    // );
    // const depthFragmentShader = (
    //     args.depthFragmentShaderTemplate ?? gbufferScreenSpaceRaymarchDepthFragmentLayout
    // ).replace(
    //     PRAGMA_RAYMARCH_SCENE,
    //     args.depthFragmentShaderContent
    // );

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = args.geometry ?? createPlaneGeometry({ gpu });
    const material = createScreenSpaceRaymarchMaterial({
        ...materialArgs,
        // overrides
        fragmentShader: litScreenSpaceRaymarchFragmentLayout,
        depthFragmentShader: gbufferScreenSpaceRaymarchDepthFragmentLayout,
        uniforms: mergedUniforms,
        // receiveShadow: !!receiveShadow,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        fragmentShaderModifiers: [[FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE, args.fragmentShaderContent]],
        depthFragmentShaderModifiers: [
            [FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE, args.depthFragmentShaderContent],
        ],
    });

    const mesh = createMesh({ name, geometry, material, meshType: MESH_TYPE_SCREEN_SPACE_RAYMARCH, castShadow });

    return {
        ...mesh,
    };
}

export const setSizeScreenSpaceRaymarchMesh = (actor: Actor, width: number, height: number) => {
    const mesh = actor as ScreenSpaceRaymarchMesh;
    setMaterialUniformValue(getMeshMainMaterial(mesh), UNIFORM_NAME_TARGET_WIDTH, width);
    setMaterialUniformValue(getMeshMaterial(mesh), UNIFORM_NAME_TARGET_HEIGHT, height);
};

// updateMaterial(args: { cameras: Camera }) {
//     super.updateMaterial(args);
// 
//     // const { cameras } = args;
// 
//     // this.mainMaterial.uniforms.setValue(UNIFORM_NAME_VIEW_DIRECTION, cameras.getWorldForward());
//     // this.mainMaterial.uniforms.setValue(UNIFORM_NAME_TARGET_WIDTH, width);
//     // this.mainMaterial.uniforms.setValue(UNIFORM_NAME_TARGET_HEIGHT, height);
// 
//     // // TODO: orthographic対応
//     // if (cameras.isPerspective()) {
//     //     const perspectiveCamera = cameras as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UNIFORM_NAME_CAMERA_ASPECT, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UNIFORM_NAME_CAMERA_FOV, perspectiveCamera.fov);
//     // }
// }
// 
// updateDepthMaterial({ cameras }: { cameras: Camera }) {
//     super.updateDepthMaterial({ cameras });
//     // if (cameras.isPerspective()) {
//     //     const perspectiveCamera = cameras as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UNIFORM_NAME_CAMERA_ASPECT, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UNIFORM_NAME_CAMERA_FOV, perspectiveCamera.fov);
//     // }
// }
