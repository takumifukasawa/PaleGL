import { Actor, createActor } from '@/PaleGL/actors/actor.ts';
import { createMat4Identity, Matrix4 } from '@/PaleGL/math/matrix4.ts';
import {createVector4, Vector4} from '@/PaleGL/math/vector4.ts';
import {
    ActorTypes,
    CameraType,
} from '@/PaleGL/constants.ts';
// import {Vector3} from "@/PaleGL/math/Vector3";
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { Vector3 } from '@/PaleGL/math/vector3.ts';
import { PostProcess } from '@/PaleGL/postprocess/postProcess.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';

export const FrustumDirection = {
    nlt: 'nlt',
    nrt: 'nrt',
    nlb: 'nlb',
    nrb: 'nrb',
    flt: 'flt',
    frt: 'frt',
    flb: 'flb',
    frb: 'frb',
} as const;
export type FrustumDirectionType = (typeof FrustumDirection)[keyof typeof FrustumDirection];

export type FrustumVectors = {
    [key in FrustumDirectionType]: Vector3;
};

export type GetFrustumVectorsFunc = (camera: Camera) => FrustumVectors | null;

export type UpdateProjectionMatrixFunc = (camera: Camera) => void;

export type CameraRenderTargetType = RenderTarget | GBufferRenderTargets | null;

export type Camera = Actor & {
    clearColor: Vector4;
    postProcess: PostProcess | null;
    cameraType: CameraType;
    viewMatrix: Matrix4;
    projectionMatrix: Matrix4;
    viewProjectionMatrix: Matrix4;
    inverseViewProjectionMatrix: Matrix4;
    inverseViewMatrix: Matrix4;
    inverseProjectionMatrix: Matrix4;
    renderTarget: CameraRenderTargetType | null;
    near: number;
    far: number;
    visibleFrustum: boolean;
    visibleFrustumMesh: Mesh | null;
    autoResize: boolean;
    // // methods
    // getFrustumWorldPositions: GetFrustumVectorsFunc;
    // getFrustumLocalPositions: GetFrustumVectorsFunc;
    // updateProjectionMatrix: UpdateProjectionMatrixFunc;
};

export function createCamera({
    name,
    cameraType,
    clearColor = createVector4(0, 0, 0, 1),
    postProcess = null,
}: {
    name?: string;
    cameraType: CameraType;
    clearColor?: Vector4;
    postProcess?: PostProcess | null;
}): Camera {
    const actor = createActor({ name, type: ActorTypes.Camera });

    const viewMatrix = createMat4Identity();
    const projectionMatrix = createMat4Identity();
    const viewProjectionMatrix = createMat4Identity();
    const inverseViewProjectionMatrix = createMat4Identity();
    const inverseViewMatrix = createMat4Identity();
    const inverseProjectionMatrix = createMat4Identity();
    const renderTarget: CameraRenderTargetType = null;
    const near: number = 1;
    const far: number = 10;
    const visibleFrustum: boolean = false;
    const visibleFrustumMesh: Mesh | null = null;

    return {
        ...actor,
        clearColor,
        postProcess,
        cameraType,
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        inverseViewProjectionMatrix,
        inverseViewMatrix,
        inverseProjectionMatrix,
        renderTarget,
        near,
        far,
        visibleFrustum,
        visibleFrustumMesh,
        autoResize: true
        // // methods
        // getFrustumWorldPositions,
        // getFrustumLocalPositions,
        // updateProjectionMatrix,
        // // overrides
        // updateTransform: updateCameraTransform,
    };
}
