import {
    Camera,
    FrustumDirection,
    FrustumDirectionType,
    FrustumVectors,
    GetFrustumVectorsFunc,
    UpdateProjectionMatrixFunc,
} from '@/PaleGL/actors/cameras/camera.ts';
import {
    AttributeNames,
    AttributeUsageType,
    BlendTypes,
    CameraType,
    CameraTypes,
    PrimitiveTypes,
    UniformNames,
} from '@/PaleGL/constants.ts';
import {
    getPerspectiveFrustumLocalPositions,
    setSizePerspectiveCamera,
    updatePerspectiveCameraProjectionMatrix,
} from '@/PaleGL/actors/cameras/perspectiveCameraBehaviour.ts';
import {
    getOrthographicFrustumLocalPositions,
    setSizeOrthographicCamera,
    updateOrthographicCameraProjectionMatrix,
} from '@/PaleGL/actors/cameras/orthographicCameraBehaviour.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import {
    defaultUpdateActorTransform,
    UpdateActorTransformFunc,
} from '@/PaleGL/actors/actorBehaviours.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Actor, ActorUpdateArgs, addChildActor } from '@/PaleGL/actors/actor.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { createMesh } from '@/PaleGL/actors/mesh.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import { getWorldForward } from '@/PaleGL/core/transform.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Ray } from '@/PaleGL/math/Ray.ts';

// mainCamera: boolean = false;

export const getCameraForward = (camera: Camera) => {
    // 見た目のforwardと逆になる値で正しい
    // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
    // なぜなら、projection行列でzを反転させるため
    // pattern_1
    return getWorldForward(camera.transform).negate();
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

export const updateCamera = (actor: Actor, args: ActorUpdateArgs) => {
    const camera = actor as Camera;
    const { gpu } = args;

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
    return getWorldForward(camera.transform).clone().negate();
};

export const viewpointToRay = (camera: Camera, viewportPoint: Vector2): Ray => {
    const clipPos = new Vector4(viewportPoint.x * 2 - 1, viewportPoint.y * 2 - 1, 1, 1);
    const worldPos = clipPos.multiplyMatrix4(camera.inverseViewProjectionMatrix);
    worldPos.x = worldPos.x / worldPos.w;
    worldPos.y = worldPos.y / worldPos.w;
    worldPos.z = worldPos.z / worldPos.w;
    const worldPosV3 = new Vector3(worldPos.x, worldPos.y, worldPos.z);
    const rayOrigin = getWorldForward(camera.transform);
    const rayDirection = worldPosV3.subVector(rayOrigin).normalize();
    return new Ray(rayOrigin, rayDirection);
};

// set size behaviour ---------------------------------------------------------

const setSizeCameraBehaviour: Partial<Record<CameraType, (camera: Camera, width: number, height: number) => void>> = {
    [CameraTypes.Perspective]: setSizePerspectiveCamera,
    [CameraTypes.Orthographic]: setSizeOrthographicCamera,
};

export function setSizeCamera(actor: Actor, width: number, height: number) {
    const camera = actor as Camera;
    setSizeCameraBehaviour[camera.cameraType]?.(camera, width, height);
}

// update behaviours -------------------------------------------------------

export const updateCameraTransform: UpdateActorTransformFunc = (actor) => {
    const camera = actor as Camera;
    defaultUpdateActorTransform(actor);
    camera.viewMatrix = camera.transform.worldMatrix.clone().invert();
    camera.inverseProjectionMatrix = camera.projectionMatrix.clone().invert();
    camera.inverseViewMatrix = camera.viewMatrix.clone().invert();
    camera.viewProjectionMatrix = Matrix4.multiplyMatrices(camera.projectionMatrix, camera.viewMatrix);
    camera.inverseViewProjectionMatrix = camera.viewProjectionMatrix.clone().invert();
};

// -------------------------------------------------------

// update projection matrix behaviour -----------------------------------------

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// export const defaultUpdateProjectionMatrix = (cameras: Camera) => {
//     updateProjectionMatrix()
// }

const updateProjectionMatrixBehaviour: Partial<Record<CameraType, UpdateProjectionMatrixFunc>> = {
    [CameraTypes.Orthographic]: updateOrthographicCameraProjectionMatrix,
    [CameraTypes.Perspective]: updatePerspectiveCameraProjectionMatrix,
};

export const updateProjectionMatrix: UpdateProjectionMatrixFunc = (camera) => {
    updateProjectionMatrixBehaviour[camera.cameraType]?.(camera);
};

// get frustum local ---------------------------------------------------------

export const getFrustumLocalPositionBehaviour: Partial<Record<CameraType, GetFrustumVectorsFunc>> = {
    [CameraTypes.Perspective]: getPerspectiveFrustumLocalPositions,
    [CameraTypes.Orthographic]: getOrthographicFrustumLocalPositions,
};

export const getFrustumLocalPositions: GetFrustumVectorsFunc = (camera: Camera) => {
    return getFrustumLocalPositionBehaviour[camera.cameraType]?.(camera) || null;
};

// get frustum world ---------------------------------------------------------

export const getFrustumWorldPositions: GetFrustumVectorsFunc = (camera: Camera): FrustumVectors | null => {
    const worldPositions: {
        [key in FrustumDirectionType]: Vector3;
    } = {
        nlt: Vector3.zero,
        nrt: Vector3.zero,
        nlb: Vector3.zero,
        nrb: Vector3.zero,
        flt: Vector3.zero,
        frt: Vector3.zero,
        flb: Vector3.zero,
        frb: Vector3.zero,
    };
    const localPositions = getFrustumLocalPositions(camera);
    if (localPositions) {
        for (const d in FrustumDirection) {
            const key = d as FrustumDirectionType;
            const wp = localPositions[key].multiplyMatrix4(camera.transform.worldMatrix);
            worldPositions[key] = wp;
        }
        return worldPositions;
    } else {
        return null;
    }
};
