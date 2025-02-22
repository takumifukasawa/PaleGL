import { Actor, ActorUpdateArgs } from '@/PaleGL/actors/Actor';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector4 } from '@/PaleGL/math/Vector4';
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
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
import { Material } from '@/PaleGL/materials/Material';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { Mesh } from './Mesh';
import { Attribute } from '@/PaleGL/core/Attribute';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Ray } from '@/PaleGL/math/Ray.ts';

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

export type CameraRenderTargetType = RenderTarget | GBufferRenderTargets | null;

export class Camera extends Actor {
    viewMatrix = Matrix4.identity;
    projectionMatrix = Matrix4.identity;
    viewProjectionMatrix = Matrix4.identity;
    inverseViewProjectionMatrix = Matrix4.identity;
    inverseViewMatrix = Matrix4.identity;
    inverseProjectionMatrix = Matrix4.identity;
    _renderTarget: CameraRenderTargetType = null;
    clearColor: Vector4; // TODO: color class
    _postProcess: PostProcess | null;
    near: number = 1;
    far: number = 10;
    visibleFrustum: boolean = false;
    visibleFrustumMesh: Mesh | null = null;
    cameraType: CameraType;

    // mainCamera: boolean = false;

    get cameraForward() {
        // 見た目のforwardと逆になる値で正しい
        // ex) (0, 0, 5) -> (0, 0, 0) をみている時、カメラ的には (0, 0, -1) が正しいが (0, 0, 1) が返ってくる
        // なぜなら、projection行列でzを反転させるため
        // pattern_1
        return this.transform.worldForward.negate();
        // pattern_2
        // return new Vector3(this.viewMatrix.m20, this.viewMatrix.m21, this.viewMatrix.m22).negate().normalize();
    }

    get postProcess() {
        return this._postProcess;
    }

    get enabledPostProcess() {
        if (!this.postProcess) {
            return false;
        }
        return this.postProcess.enabled;
    }

    get hasEnabledPostProcessPass(): boolean {
        if (!this.enabledPostProcess) {
            return false;
        }
        return this.postProcess!.hasEnabledPass;
    }

    // get postProcessRenderTarget() {
    //     if(!this.postProcess) {
    //         return null;
    //     }
    //     return this.postProcess.renderTarget;
    // }

    get renderTarget() {
        return this._renderTarget;
    }

    get writeRenderTarget() {
        if (this._renderTarget) {
            // for double buffer
            return this._renderTarget.isSwappable ? this._renderTarget.write : this._renderTarget;
        }
        return null;
    }

    // constructor({clearColor, postProcess}: { clearColor: Vector4, postProcess: PostProcess } = {}) {
    constructor({
        name,
        cameraType,
        clearColor,
        postProcess,
    }: {
        name?: string;
        cameraType: CameraType;
        clearColor?: Vector4;
        postProcess?: PostProcess;
    }) {
        super({ name, type: ActorTypes.Camera });
        this.cameraType = cameraType;
        this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
        this._postProcess = postProcess || null;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        // if (!this._postProcess) {
        //     return;
        // }
        // if (this._renderTarget) {
        //     this._postProcess.setSize(this._renderTarget.width, this._renderTarget.height);
        // } else {
        //     this._postProcess.setSize(width, height);
        // }
        if (this._renderTarget) {
            this._renderTarget.setSize(width, height);
        }
        if (this._postProcess) {
            this._postProcess.setSize(width, height);
        }
    }

    /**
     *
     * @param postProcess
     */
    setPostProcess(postProcess: PostProcess) {
        this._postProcess = postProcess;
    }

    /**
     *
     * @param clearColor
     */
    setClearColor(clearColor: Vector4) {
        this.clearColor = clearColor;
    }

    /**
     *
     * @param gpu
     * @param time
     * @param deltaTime
     */
    update(args: ActorUpdateArgs) {
        const { gpu } = args;
        super.update(args);

        if (!this.visibleFrustumMesh) {
            this.visibleFrustumMesh = new Mesh({
                geometry: new Geometry({
                    gpu,
                    attributes: [
                        new Attribute({
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
                material: new Material({
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
            this.addChild(this.visibleFrustumMesh as Actor);
        }

        if (this.visibleFrustumMesh) {
            const frustumPositions = this.getFrustumLocalPositions();
            if (!frustumPositions) {
                return;
            }
            this.visibleFrustumMesh.geometry.updateAttribute(
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
            this.visibleFrustumMesh.enabled = this.visibleFrustum;
        }
    }

    /**
     *
     */
    $updateTransform() {
        super.$updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
        this.inverseProjectionMatrix = this.projectionMatrix.clone().invert();
        this.inverseViewMatrix = this.viewMatrix.clone().invert();
        this.viewProjectionMatrix = Matrix4.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
        this.inverseViewProjectionMatrix = this.viewProjectionMatrix.clone().invert();
    }

    isPerspective() {
        return this.cameraType === CameraTypes.Perspective;
    }

    /**
     *
     * @param transform
     */
    transformScreenPoint(p: Vector3) {
        const matInProjection = Matrix4.multiplyMatrices(
            this.projectionMatrix,
            this.viewMatrix,
            Matrix4.translationMatrix(p)
        );
        const clipPosition = matInProjection.position;
        const w = matInProjection.m33 === 0 ? 0.0001 : matInProjection.m33; // TODO: cheap NaN fallback
        return new Vector3(clipPosition.x / w, clipPosition.y / w, clipPosition.z / w);
    }

    /**
     *
     * @param renderTarget
     */
    setRenderTarget(renderTarget: RenderTarget | GBufferRenderTargets | null) {
        this._renderTarget = renderTarget;
    }

    /**
     *
     */
    updateProjectionMatrix() {
        console.error('[Camera.updateProjectionMatrix] should implementation');
    }

    /**
     *
     */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    getFrustumLocalPositions(): FrustumVectors | null {
        // console.error('[Camera.getFrustumLocalPosition] should implementation');
    }

    /**
     *
     */
    getFrustumWorldPositions() {
        // console.error('[Camera.getFrustumWorldPositions] should implementation');
    }

    /**
     *
     */
    getWorldForward() {
        // forwardはカメラの背面を向いている
        return this.transform.worldForward.clone().negate();
    }

    viewpointToRay(viewportPoint: Vector2): Ray {
        const clipPos = new Vector4(viewportPoint.x * 2 - 1, viewportPoint.y * 2 - 1, 1, 1);
        const worldPos = clipPos.multiplyMatrix4(this.inverseViewProjectionMatrix);
        worldPos.x = worldPos.x / worldPos.w;
        worldPos.y = worldPos.y / worldPos.w;
        worldPos.z = worldPos.z / worldPos.w;
        const worldPosV3 = new Vector3(worldPos.x, worldPos.y, worldPos.z);
        const rayOrigin = this.transform.worldPosition;
        const rayDirection = worldPosV3.subVector(rayOrigin).normalize();
        return new Ray(rayOrigin, rayDirection);
    }
}
