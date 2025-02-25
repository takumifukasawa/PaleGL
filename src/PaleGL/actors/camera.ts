import {
    Actor,
    ActorUpdateArgs,
    addChildActor,
    createActor,
} from '@/PaleGL/actors/actor.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector4 } from '@/PaleGL/math/Vector4';
import {
    ActorTypes,
    AttributeNames,
    AttributeUsageType,
    BlendTypes,
    CameraType,
    CameraTypes,
    PrimitiveTypes,
    UniformNames,
} from '@/PaleGL/constants';
// import {Vector3} from "@/PaleGL/math/Vector3";
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createMesh, Mesh } from './mesh.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Ray } from '@/PaleGL/math/Ray.ts';
import {
    SetSizeActorFunc,
    updateActor,
    updateActorTransform,
    UpdateActorTransformFunc
} from '@/PaleGL/actors/actorBehaviours.ts';
import { getFrustumLocalPositions } from '@/PaleGL/actors/cameraBehaviours.ts';
import { setSizePerspectiveCamera } from '@/PaleGL/actors/perspectiveCamera.ts';
import {setSizeOrthographicCamera} from "@/PaleGL/actors/orthographicCameraBehaviour.ts";

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

// export class Camera extends Actor {
//     viewMatrix = Matrix4.identity;
//     projectionMatrix = Matrix4.identity;
//     viewProjectionMatrix = Matrix4.identity;
//     inverseViewProjectionMatrix = Matrix4.identity;
//     inverseViewMatrix = Matrix4.identity;
//     inverseProjectionMatrix = Matrix4.identity;
//     _renderTarget: CameraRenderTargetType = null;
//     clearColor: Vector4; // TODO: color class
//     _postProcess: PostProcess | null;
//     near: number = 1;
//     far: number = 10;
//     visibleFrustum: boolean = false;
//     visibleFrustumMesh: Mesh | null = null;
//     cameraType: CameraType;
//
//     // mainCamera: boolean = false;
//
//     get cameraForward() {
//         // 見た目のforwardと逆になる値で正しい
//         // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
//         // なぜなら、projection行列でzを反転させるため
//         // pattern_1
//         return this.transform.getWorldForward().negate();
//         // pattern_2
//         // return new Vector3(this.viewMatrix.m20, this.viewMatrix.m21, this.viewMatrix.m22).negate().normalize();
//     }
//
//     get postProcess() {
//         return this._postProcess;
//     }
//
//     get enabledPostProcess() {
//         if (!this.postProcess) {
//             return false;
//         }
//         return this.postProcess.enabled;
//     }
//
//     get hasEnabledPostProcessPass(): boolean {
//         if (!this.enabledPostProcess) {
//             return false;
//         }
//         return this.postProcess!.hasEnabledPass;
//     }
//
//     // get postProcessRenderTarget() {
//     //     if(!this.postProcess) {
//     //         return null;
//     //     }
//     //     return this.postProcess.renderTarget;
//     // }
//
//     get renderTarget() {
//         return this._renderTarget;
//     }
//
//     get writeRenderTarget() {
//         if (this._renderTarget) {
//             // for double buffer
//             return this._renderTarget.isSwappable ? this._renderTarget.write : this._renderTarget;
//         }
//         return null;
//     }
//
//     // constructor({clearColor, postProcess}: { clearColor: Vector4, postProcess: PostProcess } = {}) {
//     constructor({
//         name,
//         cameraType,
//         clearColor,
//         postProcess,
//     }: {
//         name?: string;
//         cameraType: CameraType;
//         clearColor?: Vector4;
//         postProcess?: PostProcess;
//     }) {
//         super({ name, type: ActorTypes.Camera });
//         this.cameraType = cameraType;
//         this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
//         this._postProcess = postProcess || null;
//     }
//
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         // if (!this._postProcess) {
//         //     return;
//         // }
//         // if (this._renderTarget) {
//         //     this._postProcess.setSize(this._renderTarget.width, this._renderTarget.height);
//         // } else {
//         //     this._postProcess.setSize(width, height);
//         // }
//         if (this._renderTarget) {
//             this._renderTarget.setSize(width, height);
//         }
//         if (this._postProcess) {
//             this._postProcess.setSize(width, height);
//         }
//     }
//
//     /**
//      *
//      * @param postProcess
//      */
//     setPostProcess(postProcess: PostProcess) {
//         this._postProcess = postProcess;
//     }
//
//     /**
//      *
//      * @param clearColor
//      */
//     setClearColor(clearColor: Vector4) {
//         this.clearColor = clearColor;
//     }
//
//     /**
//      *
//      * @param gpu
//      * @param time
//      * @param deltaTime
//      */
//     update(args: ActorUpdateArgs) {
//         const { gpu } = args;
//         super.update(args);
//
//         if (!this.visibleFrustumMesh) {
//             this.visibleFrustumMesh = new Mesh({
//                 geometry: createGeometry({
//                     gpu,
//                     attributes: [
//                         createAttribute({
//                             name: AttributeNames.Position,
//                             data: new Float32Array(new Array(3 * 8).fill(0)),
//                             size: 3,
//                             usageType: AttributeUsageType.DynamicDraw,
//                         }),
//                     ],
//                     // index list
//                     // 0: nearLeftTop
//                     // 1: nearLeftBottom
//                     // 2: nearRightTop
//                     // 3: nearRightBottom
//                     // 4: farLeftTop
//                     // 5: farLeftBottom
//                     // 6: farRightTop
//                     // 7: farRightBottom
//                     //
//                     // pattern1: only line
//                     //
//                     // drawCount: 2 * 12,
//                     // indices: [
//                     //     // near clip
//                     //     0, 1, 1, 3, 3, 2, 2, 0,
//                     //     // far clip
//                     //     4, 5, 5, 7, 7, 6, 6, 4,
//                     //     // bridge
//                     //     0, 4, 1, 5, 2, 6, 3, 7,
//                     // ],
//                     //
//                     // pattern2: like face
//                     //
//                     drawCount: 3 * 2 * 6,
//                     // prettier-ignore
//                     indices: [
//                         // far
//                         6, 7, 4,
//                         4, 7, 5,
//                         // near clip
//                         0, 1, 2,
//                         2, 1, 3,
//                         // left
//                         0, 4, 5,
//                         5, 1, 0,
//                         // top
//                         0, 2, 4,
//                         2, 6, 4,
//                         // right
//                         2, 3, 6,
//                         6, 3, 7,
//                         // bottom
//                         1, 5, 7,
//                         7, 1, 3,
//                     ],
//                 }),
//                 material: createMaterial({
//                     // gpu,
//                     vertexShader: `
// layout (location = 0) in vec3 ${AttributeNames.Position};
// #include <lighting>
// #include <ub>
// void main() {gl_Position=${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);}
// `,
//                     fragmentShader: `
// out vec4 o; void main() {o=vec4(0,1.,0,1.);}
//                     `,
//                     primitiveType: PrimitiveTypes.Lines,
//                     blendType: BlendTypes.Transparent,
//                     // faceSide: FaceSide.Double,
//                     depthWrite: false,
//                 }),
//             });
//             this.addChild(this.visibleFrustumMesh as Actor);
//         }
//
//         if (this.visibleFrustumMesh) {
//             const frustumPositions = this.getFrustumLocalPositions();
//             if (!frustumPositions) {
//                 return;
//             }
//             this.visibleFrustumMesh.geometry.updateAttribute(
//                 AttributeNames.Position,
//                 new Float32Array([
//                     // near clip
//                     ...frustumPositions.nlt.e,
//                     ...frustumPositions.nlb.e,
//                     ...frustumPositions.nrt.e,
//                     ...frustumPositions.nrb.e,
//                     // far clip
//                     ...frustumPositions.flt.e,
//                     ...frustumPositions.flb.e,
//                     ...frustumPositions.frt.e,
//                     ...frustumPositions.frb.e,
//                 ])
//             );
//             this.visibleFrustumMesh.enabled = this.visibleFrustum;
//         }
//     }
//
//     /**
//      *
//      */
//     $updateTransform() {
//         super.$updateTransform();
//         this.viewMatrix = this.transform.getWorldMatrix().clone().invert();
//         this.inverseProjectionMatrix = this.projectionMatrix.clone().invert();
//         this.inverseViewMatrix = this.viewMatrix.clone().invert();
//         this.viewProjectionMatrix = Matrix4.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
//         this.inverseViewProjectionMatrix = this.viewProjectionMatrix.clone().invert();
//     }
//
//     isPerspective() {
//         return this.cameraType === CameraTypes.Perspective;
//     }
//
//     /**
//      *
//      * @param transform
//      */
//     transformScreenPoint(p: Vector3) {
//         const matInProjection = Matrix4.multiplyMatrices(
//             this.projectionMatrix,
//             this.viewMatrix,
//             Matrix4.translationMatrix(p)
//         );
//         const clipPosition = matInProjection.position;
//         const w = matInProjection.m33 === 0 ? 0.0001 : matInProjection.m33; // TODO: cheap NaN fallback
//         return new Vector3(clipPosition.x / w, clipPosition.y / w, clipPosition.z / w);
//     }
//
//     /**
//      *
//      * @param renderTarget
//      */
//     setRenderTarget(renderTarget: RenderTarget | GBufferRenderTargets | null) {
//         this._renderTarget = renderTarget;
//     }
//
//     /**
//      *
//      */
//     updateProjectionMatrix() {
//         console.error('[Camera.updateProjectionMatrix] should implementation');
//     }
//
//     /**
//      *
//      */
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     getFrustumLocalPositions(): FrustumVectors | null {
//         // console.error('[Camera.getFrustumLocalPosition] should implementation');
//     }
//
//     /**
//      *
//      */
//     getFrustumWorldPositions() {
//         // console.error('[Camera.getFrustumWorldPositions] should implementation');
//     }
//
//     /**
//      *
//      */
//     getWorldForward() {
//         // forwardはカメラの背面を向いている
//         return this.transform.getWorldForward().clone().negate();
//     }
//
//     viewpointToRay(viewportPoint: Vector2): Ray {
//         const clipPos = new Vector4(viewportPoint.x * 2 - 1, viewportPoint.y * 2 - 1, 1, 1);
//         const worldPos = clipPos.multiplyMatrix4(this.inverseViewProjectionMatrix);
//         worldPos.x = worldPos.x / worldPos.w;
//         worldPos.y = worldPos.y / worldPos.w;
//         worldPos.z = worldPos.z / worldPos.w;
//         const worldPosV3 = new Vector3(worldPos.x, worldPos.y, worldPos.z);
//         const rayOrigin = this.transform.getWorldPosition();
//         const rayDirection = worldPosV3.subVector(rayOrigin).normalize();
//         return new Ray(rayOrigin, rayDirection);
//     }
// }

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
    // // methods
    // getFrustumWorldPositions: GetFrustumVectorsFunc;
    // getFrustumLocalPositions: GetFrustumVectorsFunc;
    // updateProjectionMatrix: UpdateProjectionMatrixFunc;
};

export function createCamera({
    name,
    cameraType,
    clearColor = new Vector4(0, 0, 0, 1),
    postProcess = null,
}: {
    name?: string;
    cameraType: CameraType;
    clearColor?: Vector4;
    postProcess?: PostProcess | null;
}): Camera {
    const actor = createActor({ name, type: ActorTypes.Camera });

    const viewMatrix = Matrix4.identity;
    const projectionMatrix = Matrix4.identity;
    const viewProjectionMatrix = Matrix4.identity;
    const inverseViewProjectionMatrix = Matrix4.identity;
    const inverseViewMatrix = Matrix4.identity;
    const inverseProjectionMatrix = Matrix4.identity;
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
        // // methods
        // getFrustumWorldPositions,
        // getFrustumLocalPositions,
        // updateProjectionMatrix,
        // // overrides
        // updateTransform: updateCameraTransform,
    };
}

// mainCamera: boolean = false;

export const getCameraForward = (camera: Camera) => {
    // 見た目のforwardと逆になる値で正しい
    // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
    // なぜなら、projection行列でzを反転させるため
    // pattern_1
    return camera.transform.getWorldForward().negate();
    // pattern_2
    // return new Vector3(this.viewMatrix.m20, this.viewMatrix.m21, this.viewMatrix.m22).negate().normalize();
};

export const getCameraPostProcess = (camera: Camera) => {
    return camera.postProcess;
};

export const enabledCameraPostProcess = (camera: Camera) => {
    if (!camera.postProcess) {
        return false;
    }
    return camera.postProcess.enabled;
};

export const hasEnabledPostProcessPass = (camera: Camera) => {
    if (!enabledCameraPostProcess(camera)) {
        return false;
    }
    return camera.postProcess!.hasEnabledPass;
};

export const getCameraRenderTarget = (camera: Camera) => {
    return camera.renderTarget;
};

export const getWriteRenderTarget = (camera: Camera) => {
    if (camera.renderTarget) {
        // for double buffer
        return camera.renderTarget.isSwappable ? camera.renderTarget.write : camera.renderTarget;
    }
    return null;
};

export const setCameraSize = (camera: Camera, width: number, height: number) => {
    if (camera.renderTarget) {
        camera.renderTarget.setSize(width, height);
    }
    if (camera.postProcess) {
        camera.postProcess.setSize(width, height);
    }
};

export const setCameraPostProcess = (camera: Camera, postProcess: PostProcess) => {
    camera.postProcess = postProcess;
};

export const setCameraClearColor = (camera: Camera, clearColor: Vector4) => {
    camera.clearColor = clearColor;
};

export const updateCamera = (camera: Camera, args: ActorUpdateArgs) => {
    const { gpu } = args;

    updateActor(camera, args);

    if (!camera.visibleFrustumMesh) {
        camera.visibleFrustumMesh = createMesh({
            geometry: createGeometry({
                gpu,
                attributes: [
                    createAttribute({
                        name: AttributeNames.Position,
                        data: new Float32Array(new Array(3 * 8).fill(0)),
                        size: 3,
                        usageType: AttributeUsageType.DynamicDraw,
                    }),
                ],
                // index list
                // 0: nearLeftTop
                // 1: nearLeftBottom
                // 2: nearRightTop
                // 3: nearRightBottom
                // 4: farLeftTop
                // 5: farLeftBottom
                // 6: farRightTop
                // 7: farRightBottom
                //
                // pattern1: only line
                //
                // drawCount: 2 * 12,
                // indices: [
                //     // near clip
                //     0, 1, 1, 3, 3, 2, 2, 0,
                //     // far clip
                //     4, 5, 5, 7, 7, 6, 6, 4,
                //     // bridge
                //     0, 4, 1, 5, 2, 6, 3, 7,
                // ],
                //
                // pattern2: like face
                //
                drawCount: 3 * 2 * 6,
                // prettier-ignore
                indices: [
                    // far
                    6, 7, 4,
                    4, 7, 5,
                    // near clip
                    0, 1, 2,
                    2, 1, 3,
                    // left
                    0, 4, 5,
                    5, 1, 0,
                    // top
                    0, 2, 4,
                    2, 6, 4,
                    // right
                    2, 3, 6,
                    6, 3, 7,
                    // bottom
                    1, 5, 7,
                    7, 1, 3,
                ],
            }),
            material: createMaterial({
                // gpu,
                vertexShader: `
layout (location = 0) in vec3 ${AttributeNames.Position};
#include <lighting>
#include <ub>
void main() {gl_Position=${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);}
`,
                fragmentShader: `
out vec4 o; void main() {o=vec4(0,1.,0,1.);}
                    `,
                primitiveType: PrimitiveTypes.Lines,
                blendType: BlendTypes.Transparent,
                // faceSide: FaceSide.Double,
                depthWrite: false,
            }),
        });
        addChildActor(camera, camera.visibleFrustumMesh as Actor);
    }

    if (camera.visibleFrustumMesh) {
        const frustumPositions = getFrustumLocalPositions(camera);
        if (!frustumPositions) {
            return;
        }
        camera.visibleFrustumMesh.geometry.updateAttribute(
            AttributeNames.Position,
            new Float32Array([
                // near clip
                ...frustumPositions.nlt.e,
                ...frustumPositions.nlb.e,
                ...frustumPositions.nrt.e,
                ...frustumPositions.nrb.e,
                // far clip
                ...frustumPositions.flt.e,
                ...frustumPositions.flb.e,
                ...frustumPositions.frt.e,
                ...frustumPositions.frb.e,
            ])
        );
        camera.visibleFrustumMesh.enabled = camera.visibleFrustum;
    }
};

// behaviours -------------------------------------------------------

export const updateCameraTransform: UpdateActorTransformFunc = (actor) => {
    const camera = actor as Camera;
    updateActorTransform(actor);
    camera.viewMatrix = camera.transform.getWorldMatrix().clone().invert();
    camera.inverseProjectionMatrix = camera.projectionMatrix.clone().invert();
    camera.inverseViewMatrix = camera.viewMatrix.clone().invert();
    camera.viewProjectionMatrix = Matrix4.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);
    camera.inverseViewProjectionMatrix = camera.viewProjectionMatrix.clone().invert();
};

const setSizeCameraBehaviour: Partial<Record<CameraType, (camera: Camera, width: number, height: number) => void>> = {
    [CameraTypes.Perspective]: setSizePerspectiveCamera,
    [CameraTypes.Orthographic]: setSizeOrthographicCamera,
};

export const setSizeCamera: SetSizeActorFunc = (actor, width, height) => {
    const camera = actor as Camera;
    setSizeCameraBehaviour[camera.cameraType]?.(camera, width, height);
};

// -------------------------------------------------------

export const isPerspectiveCamera = (camera: Camera) => {
    return camera.cameraType === CameraTypes.Perspective;
};

export const transformScreenPoint = (camera: Camera, p: Vector3) => {
    const matInProjection = Matrix4.multiplyMatrices(
        camera.projectionMatrix,
        camera.viewMatrix,
        Matrix4.translationMatrix(p)
    );
    const clipPosition = matInProjection.position;
    const w = matInProjection.m33 === 0 ? 0.0001 : matInProjection.m33; // TODO: cheap NaN fallback
    return new Vector3(clipPosition.x / w, clipPosition.y / w, clipPosition.z / w);
};

export const setCameraRenderTarget = (camera: Camera, renderTarget: RenderTarget | GBufferRenderTargets | null) => {
    camera.renderTarget = renderTarget;
};

// export const updateProjectionMatrix: UpdateProjectionMatrixFunc = () => {
//     console.error('[Camera.updateProjectionMatrix] should implementation');
// };
//
// export const getFrustumLocalPositions: GetFrustumVectorsFunc = () => {
//     console.error('[getFrustumLocalPositions] should implementation');
//     return null;
// };
//
// export const getFrustumWorldPositions: GetFrustumVectorsFunc = () => {
//     console.error('[getFrustumWorldPositions] should implementation');
//     return null;
// };

export const getCameraWorldForward = (camera: Camera) => {
    // forwardはカメラの背面を向いている
    return camera.transform.getWorldForward().clone().negate();
};

export const viewpointToRay = (camera: Camera, viewportPoint: Vector2): Ray => {
    const clipPos = new Vector4(viewportPoint.x * 2 - 1, viewportPoint.y * 2 - 1, 1, 1);
    const worldPos = clipPos.multiplyMatrix4(camera.inverseViewProjectionMatrix);
    worldPos.x = worldPos.x / worldPos.w;
    worldPos.y = worldPos.y / worldPos.w;
    worldPos.z = worldPos.z / worldPos.w;
    const worldPosV3 = new Vector3(worldPos.x, worldPos.y, worldPos.z);
    const rayOrigin = camera.transform.getWorldPosition();
    const rayDirection = worldPosV3.subVector(rayOrigin).normalize();
    return new Ray(rayOrigin, rayDirection);
};
