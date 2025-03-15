import { Gpu } from '@/PaleGL/core/gpu.ts';
import {
    FragmentShaderModifierPragmas,
    MeshTypes,
    PrimitiveTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
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

type ScreenSpaceRaymarchMeshArgs = {
    gpu: Gpu;
    name?: string;
    geometry?: Geometry;
    uniforms?: UniformsData;
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
    materialArgs: ScreenSpaceRaymarchMaterialArgs;
} & MaterialArgs;

export type ScreenSpaceRaymarchMesh = Mesh;

export function createScreenSpaceRaymarchMesh(args: ScreenSpaceRaymarchMeshArgs) {
    const { gpu, name = '', uniforms = [], materialArgs } = args;

    const mergedUniforms: UniformsData = [
        {
            name: UniformNames.ViewDirection,
            type: UniformTypes.Vector3,
            value: createVector3Zero(),
        },
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
        primitiveType: PrimitiveTypes.Triangles,
        uniformBlockNames: [UniformBlockNames.Timeline],
        fragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: args.fragmentShaderContent,
            }
        ],
        depthFragmentShaderModifiers: [
            {
                pragma: FragmentShaderModifierPragmas.RAYMARCH_SCENE,
                value: args.depthFragmentShaderContent,
            }
        ],
    });

    const mesh = createMesh({ name, geometry, material, meshType: MeshTypes.ScreenSpaceRaymarch });

    return {
        ...mesh,
    };
}

export const setSizeScreenSpaceRaymarchMesh = (actor: Actor, width: number, height: number) => {
    const mesh = actor as ScreenSpaceRaymarchMesh;
    setMaterialUniformValue(getMeshMainMaterial(mesh), UniformNames.TargetWidth, width);
    setMaterialUniformValue(getMeshMaterial(mesh), UniformNames.TargetHeight, height);
};

// updateMaterial(args: { cameras: Camera }) {
//     super.updateMaterial(args);
// 
//     // const { cameras } = args;
// 
//     // this.mainMaterial.uniforms.setValue(UniformNames.ViewDirection, cameras.getWorldForward());
//     // this.mainMaterial.uniforms.setValue(UniformNames.TargetWidth, width);
//     // this.mainMaterial.uniforms.setValue(UniformNames.TargetHeight, height);
// 
//     // // TODO: orthographic対応
//     // if (cameras.isPerspective()) {
//     //     const perspectiveCamera = cameras as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraAspect, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraFov, perspectiveCamera.fov);
//     // }
// }
// 
// updateDepthMaterial({ cameras }: { cameras: Camera }) {
//     super.updateDepthMaterial({ cameras });
//     // if (cameras.isPerspective()) {
//     //     const perspectiveCamera = cameras as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraAspect, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraFov, perspectiveCamera.fov);
//     // }
// }
