import { GPU } from '@/PaleGL/core/GPU.ts';
import {
    ActorTypes,
    PRAGMA_RAYMARCH_SCENE,
    PrimitiveTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
import { createMesh, getMeshMainMaterial, getMeshMaterial, Mesh } from '@/PaleGL/actors/mesh.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import {
    createScreenSpaceRaymarchMaterial,
    ScreenSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/screenSpaceRaymarchMaterial.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { MaterialArgs, setMaterialUniformValue } from '@/PaleGL/materials/material.ts';
// import { gbufferScreenSpaceRaymarchDepthFragmentTemplate } from '@/PaleGL/shaders/templates/gbuffer-screen-space-raymarch-depth-fragment-template.ts';
// import { litScreenSpaceRaymarchFragmentTemplate } from '@/PaleGL/shaders/templates/lit-screen-space-raymarch-fragment-template.ts';
import litScreenSpaceRaymarchFragmentLayout from '@/PaleGL/shaders/layout/layout-lit-screen-space-raymarch-fragment.glsl';
import gbufferScreenSpaceRaymarchDepthFragmentLayout from '@/PaleGL/shaders/layout/layout-gbuffer-screen-space-raymarch-depth-fragment.glsl';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { Actor } from '@/PaleGL/actors/actor.ts';

type ScreenSpaceRaymarchMeshArgs = {
    gpu: GPU;
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
            value: Vector3.zero,
        },
        ...uniforms,
        ...PostProcessPassBase.commonUniforms,
    ];

    const fragmentShader = (args.fragmentShaderTemplate ?? litScreenSpaceRaymarchFragmentLayout).replace(
        PRAGMA_RAYMARCH_SCENE,
        args.fragmentShaderContent
    );
    const depthFragmentShader = (
        args.depthFragmentShaderTemplate ?? gbufferScreenSpaceRaymarchDepthFragmentLayout
    ).replace(PRAGMA_RAYMARCH_SCENE, args.depthFragmentShaderContent);

    // NOTE: geometryは親から渡して使いまわしてもよい
    const geometry = args.geometry ?? createPlaneGeometry({ gpu });
    const material = createScreenSpaceRaymarchMaterial({
        ...materialArgs,
        // overrides
        fragmentShader,
        depthFragmentShader,
        uniforms: mergedUniforms,
        // receiveShadow: !!receiveShadow,
        primitiveType: PrimitiveTypes.Triangles,
        uniformBlockNames: [UniformBlockNames.Timeline],
    });

    const mesh = createMesh({ name, geometry, material, type: ActorTypes.ScreenSpaceRaymarchMesh });

    return {
        ...mesh,
    };
}

export const setSizeScreenSpaceRaymarchMesh = (actor: Actor, width: number, height: number) => {
    const mesh = actor as ScreenSpaceRaymarchMesh;
    setMaterialUniformValue(getMeshMainMaterial(mesh), UniformNames.TargetWidth, width);
    setMaterialUniformValue(getMeshMaterial(mesh), UniformNames.TargetHeight, height);
};

// updateMaterial(args: { camera: Camera }) {
//     super.updateMaterial(args);
// 
//     // const { camera } = args;
// 
//     // this.mainMaterial.uniforms.setValue(UniformNames.ViewDirection, camera.getWorldForward());
//     // this.mainMaterial.uniforms.setValue(UniformNames.TargetWidth, width);
//     // this.mainMaterial.uniforms.setValue(UniformNames.TargetHeight, height);
// 
//     // // TODO: orthographic対応
//     // if (camera.isPerspective()) {
//     //     const perspectiveCamera = camera as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraAspect, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraFov, perspectiveCamera.fov);
//     // }
// }
// 
// updateDepthMaterial({ camera }: { camera: Camera }) {
//     super.updateDepthMaterial({ camera });
//     // if (camera.isPerspective()) {
//     //     const perspectiveCamera = camera as PerspectiveCamera;
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraAspect, perspectiveCamera.aspect);
//     //     this.setUniformValueToAllMaterials(UniformNames.CameraFov, perspectiveCamera.fov);
//     // }
// }
