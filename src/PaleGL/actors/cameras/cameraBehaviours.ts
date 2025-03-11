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
    FaceSide,
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
import {
    cloneVector3,
    createVector3,
    createVector3Zero,
    multiplyVector3AndMatrix4,
    negateVector3, normalizeVector3, subVector3AndVector3, v3x, v3y, v3z,
    Vector3
} from '@/PaleGL/math/Vector3.ts';
import { defaultUpdateActorTransform, UpdateActorTransformFunc } from '@/PaleGL/actors/actorBehaviours.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Actor, ActorUpdateArgs, addChildActor } from '@/PaleGL/actors/actor.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { createMesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import {
    createVector4,
    multiplyVector4AndMatrix4,
    setV4x,
    setV4y,
    setV4z,
    v4w,
    v4x, v4y, v4z,
    Vector4
} from '@/PaleGL/math/vector4.ts';
import { PostProcess } from '@/PaleGL/postprocess/postProcess.ts';
import { getWorldForward } from '@/PaleGL/core/transform.ts';
import { RenderTarget } from '@/PaleGL/core/renderTarget.ts';
import { GBufferRenderTargets } from '@/PaleGL/core/gBufferRenderTargets.ts';
import { v2x, v2y, Vector2 } from '@/PaleGL/math/vector2.ts';
import { createRay, Ray } from '@/PaleGL/math/ray.ts';
import { updateGeometryAttribute } from '@/PaleGL/geometries/geometryBehaviours.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { getWriteRenderTarget, setRenderTargetSizeBehaviour } from '@/PaleGL/core/renderTargetBehaviours.ts';

// mainCamera: boolean = false;

export const getCameraForward = (camera: Camera) => {
    // 見た目のforwardと逆になる値で正しい
    // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
    // なぜなら、projection行列でzを反転させるため
    // pattern_1
    return negateVector3(getWorldForward(camera.transform));
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

export const getCameraWriteRenderTarget = (camera: Camera) => {
    if (camera.renderTarget) {
        // for double buffer
        return camera.renderTarget.isSwappable ? getWriteRenderTarget(camera.renderTarget) : camera.renderTarget;
    }
    return null;
};

export const setCameraSize = (camera: Camera, width: number, height: number) => {
    if (camera.renderTarget) {
        setRenderTargetSizeBehaviour(camera.renderTarget, width, height);
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
                        data: new Float32Array(maton.range(3 * 8 * 6).fill(0)),
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
                drawCount: 8 * 6,
                // prettier-ignore
                indices: [
                    ...maton.range(8 * 6, true),
                    // 0, 1, 2, 3,
                    // 4, 5, 6, 7

                    // // far
                    // 6, 7, 4,
                    // 5, 7, 4,
                    // // near clip
                    // 0, 1, 2,
                    // 3, 1, 2,
                    // // left
                    // 0, 4, 5,
                    // 0, 1, 5,
                    // // top
                    // 0, 2, 4,
                    // 4, 6, 2,
                    // // right
                    // 2, 3, 6,
                    // 7, 3, 6,
                    // // bottom
                    // 1, 5, 7,
                    // 3, 1, 7,
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
                faceSide: FaceSide.Double,
                depthWrite: false,
            }),
        });
        console.log('hogehoge', camera.visibleFrustumMesh);
        addChildActor(camera, camera.visibleFrustumMesh as Actor);
    }

    if (camera.visibleFrustumMesh) {
        const frustumPositions = getFrustumLocalPositions(camera);
        if (!frustumPositions) {
            return;
        }

        // near clip
        const nlt = frustumPositions.nlt.e; // nearLeftTop: 0
        const nlb = frustumPositions.nlb.e; // nearLeftBottom: 1
        const nrt = frustumPositions.nrt.e; // nearRightTop: 2
        const nrb = frustumPositions.nrb.e; // nearRightBottom: 3
        // far clip
        const flt = frustumPositions.flt.e; // farLeftTop: 4
        const flb = frustumPositions.flb.e; // farLeftBottom: 5
        const frt = frustumPositions.frt.e; // farRightTop: 6
        const frb = frustumPositions.frb.e; // farRightBottom: 7

        updateGeometryAttribute(
            camera.visibleFrustumMesh.geometry,
            AttributeNames.Position,
            new Float32Array([
                // far
                ...flt,
                ...frt,
                ...frt,
                ...frb,
                ...frb,
                ...flb,
                ...flb,
                ...flt,
                // near
                ...nlt,
                ...nrt,
                ...nrt,
                ...nrb,
                ...nrb,
                ...nlb,
                ...nlb,
                ...nlt,
                // left
                ...flt,
                ...nlt,
                ...nlt,
                ...nlb,
                ...nlb,
                ...flb,
                ...flb,
                ...flt,
                // top
                ...frt,
                ...nrt,
                ...nrt,
                ...nlt,
                ...nlt,
                ...flt,
                ...flt,
                ...frt,
                // right
                ...frb,
                ...nrb,
                ...nrb,
                ...nrt,
                ...nrt,
                ...frt,
                ...frt,
                ...frb,
                // bottom
                ...flb,
                ...nlb,
                ...nlb,
                ...nrb,
                ...nrb,
                ...frb,
                ...frb,
                ...flb,
                // ...flb, ...frb,
                // // near clip
                // ...frustumPositions.nlt.e, // nearLeftTop: 0
                // ...frustumPositions.nlb.e, // nearLeftBottom: 1
                // ...frustumPositions.nrt.e, // nearRightTop: 2
                // ...frustumPositions.nrb.e, // nearRightBottom: 3
                // // far clip
                // ...frustumPositions.flt.e, // farLeftTop: 4
                // ...frustumPositions.flb.e, // farLeftBottom: 5
                // ...frustumPositions.frt.e, // farRightTop: 6
                // ...frustumPositions.frb.e, // farRightBottom: 7
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
    return createVector3(
        v3x(clipPosition) / w,
        v3y(clipPosition) / w,
        v3z(clipPosition) / w
    );
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
    return negateVector3(cloneVector3(getWorldForward(camera.transform)));
};

export const viewpointToRay = (camera: Camera, viewportPoint: Vector2): Ray => {
    const clipPos = createVector4(v2x(viewportPoint) * 2 - 1, v2y(viewportPoint) * 2 - 1, 1, 1);
    const worldPos = multiplyVector4AndMatrix4(clipPos, camera.inverseViewProjectionMatrix);
    setV4x(worldPos, v4x(worldPos) / v4w(worldPos));
    setV4y(worldPos, v4y(worldPos) / v4w(worldPos));
    setV4z(worldPos, v4z(worldPos) / v4w(worldPos));
    const worldPosV3 = createVector3(v4x(worldPos), v4y(worldPos), v4z(worldPos));
    const rayOrigin = getWorldForward(camera.transform);
    const rayDirection = normalizeVector3(subVector3AndVector3(worldPosV3, rayOrigin));
    return createRay(rayOrigin, rayDirection);
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
        nlt: createVector3Zero(),
        nrt: createVector3Zero(),
        nlb: createVector3Zero(),
        nrb: createVector3Zero(),
        flt: createVector3Zero(),
        frt: createVector3Zero(),
        flb: createVector3Zero(),
        frb: createVector3Zero(),
    };
    const localPositions = getFrustumLocalPositions(camera);
    if (localPositions) {
        for (const d in FrustumDirection) {
            const key = d as FrustumDirectionType;
            const wp = multiplyVector3AndMatrix4(localPositions[key], camera.transform.worldMatrix);
            worldPositions[key] = wp;
        }
        return worldPositions;
    } else {
        return null;
    }
};
