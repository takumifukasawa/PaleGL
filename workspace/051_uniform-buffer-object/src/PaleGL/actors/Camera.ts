import { Actor } from '@/PaleGL/actors/Actor';
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
// import {Color} from "@/PaleGL/math/Color";
import { Vector3 } from '@/PaleGL/math/Vector3';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { GPU } from '@/PaleGL/core/GPU';
// import {AbstractRenderTarget} from "@/PaleGL/core/AbstractRenderTarget";
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { Ray } from '@/PaleGL/math/Ray.ts';
import {Vector2} from "@/PaleGL/math/Vector2.ts";
// import { Transform } from '@/PaleGL/core/Transform.ts';
// import {Renderer} from "@/PaleGL/core/Renderer.ts";
// import {Renderer} from "@/PaleGL/core/Renderer.ts";
// import {Scene} from "@/PaleGL/core/Scene.ts";

export const FrustumDirection = {
    nearLeftTop: 'nearLeftTop',
    nearRightTop: 'nearRightTop',
    nearLeftBottom: 'nearLeftBottom',
    nearRightBottom: 'nearRightBottom',
    farLeftTop: 'farLeftTop',
    farRightTop: 'farRightTop',
    farLeftBottom: 'farLeftBottom',
    farRightBottom: 'farRightBottom',
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
    #renderTarget: CameraRenderTargetType = null;
    clearColor: Vector4; // TODO: color class
    #postProcess: PostProcess | null;
    near: number = 1;
    far: number = 10;
    visibleFrustum: boolean = false;
    #visibleFrustumMesh: Mesh | null = null;
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
        return this.#postProcess;
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
        return this.#renderTarget;
    }

    get writeRenderTarget() {
        if (this.#renderTarget) {
            // for double buffer
            return this.#renderTarget.isSwappable ? this.#renderTarget.write : this.#renderTarget;
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
        this.#postProcess = postProcess || null;
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        // if (!this.#postProcess) {
        //     return;
        // }
        // if (this.#renderTarget) {
        //     this.#postProcess.setSize(this.#renderTarget.width, this.#renderTarget.height);
        // } else {
        //     this.#postProcess.setSize(width, height);
        // }
        if (this.#renderTarget) {
            this.#renderTarget.setSize(width, height);
        }
        if (this.#postProcess) {
            this.#postProcess.setSize(width, height);
        }
    }

    /**
     *
     * @param postProcess
     */
    setPostProcess(postProcess: PostProcess) {
        this.#postProcess = postProcess;
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
    update({ gpu, time, deltaTime }: { gpu: GPU; time: number; deltaTime: number }) {
        super.update({ gpu, time, deltaTime });

        if (this.visibleFrustum && !this.#visibleFrustumMesh) {
            this.#visibleFrustumMesh = new Mesh({
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
                    drawCount: 2 * 12,
                    indices: [
                        // near clip
                        0, 1, 1, 3, 3, 2, 2, 0,
                        // far clip
                        4, 5, 5, 7, 7, 6, 6, 4,
                        // bridge
                        0, 4, 1, 5, 2, 6, 3, 7,
                    ],
                }),
                material: new Material({
                    // gpu,
                    vertexShader: `#version 300 es
                    
                    layout (location = 0) in vec3 ${AttributeNames.Position};

                    #pragma TRANSFORM_VERTEX_UNIFORMS
                   
                    void main() {
                        gl_Position = ${UniformNames.ProjectionMatrix} * ${UniformNames.ViewMatrix} * ${UniformNames.WorldMatrix} * vec4(${AttributeNames.Position}, 1.);
                    }
                    `,
                    fragmentShader: `#version 300 es
                   
                    precision mediump float;
                    
                    out vec4 outColor;
                    
                    void main() {
                        outColor = vec4(0, 1., 0, 1.);
                    }
                    `,
                    primitiveType: PrimitiveTypes.Lines,
                    blendType: BlendTypes.Transparent,
                    depthWrite: false,
                }),
            });
            this.addChild(this.#visibleFrustumMesh as Actor);
        }

        if (this.#visibleFrustumMesh) {
            const frustumPositions = this.getFrustumLocalPositions();
            this.#visibleFrustumMesh.geometry.updateAttribute(
                AttributeNames.Position,
                new Float32Array([
                    // near clip
                    ...frustumPositions.nearLeftTop.elements,
                    ...frustumPositions.nearLeftBottom.elements,
                    ...frustumPositions.nearRightTop.elements,
                    ...frustumPositions.nearRightBottom.elements,
                    // far clip
                    ...frustumPositions.farLeftTop.elements,
                    ...frustumPositions.farLeftBottom.elements,
                    ...frustumPositions.farRightTop.elements,
                    ...frustumPositions.farRightBottom.elements,
                ])
            );
        }
    }

    /**
     *
     */
    updateTransform() {
        super.updateTransform();
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
        this.#renderTarget = renderTarget;
    }

    /**
     *
     */
    updateProjectionMatrix() {
        throw '[Camera.updateProjectionMatrix] should implementation';
    }

    /**
     *
     */
    getFrustumLocalPositions(): FrustumVectors {
        throw '[Camera.getFrustumLocalPosition] should implementation';
    }

    /**
     *
     */
    getFrustumWorldPositions() {
        throw '[Camera.getFrustumWorldPositions] should implementation';
    }

    /**
     *
     */
    getWorldForward() {
        // forwardはカメラの背面を向いている
        return this.transform.worldForward.clone().negate();
        // return this.transform.worldForward.clone().negate().normalize();
    }

    /**
     * 
     * @param viewportPoint
     */
    viewpointToRay(viewportPoint: Vector2) {
        const clipPos = new Vector4(
            viewportPoint.x * 2 - 1,
            viewportPoint.y * 2 - 1,
            1,
            1
        );
        const worldPos = clipPos.multiplyMatrix4(this.inverseViewProjectionMatrix);
        worldPos.x = worldPos.x / worldPos.w;
        worldPos.y = worldPos.y / worldPos.w;
        worldPos.z = worldPos.z / worldPos.w;
        const worldPosV3 = new Vector3(worldPos.x, worldPos.y, worldPos.z);
        const rayOrigin = this.transform.worldPosition;
        const rayDirection = worldPosV3.subVector(rayOrigin).normalize();
        return new Ray(rayOrigin, rayDirection);
    }

    // /**
    //  *
    //  * @param r
    //  * @param t
    //  */
    // getWorldForwardInFrustum(r: number, t: number) {
    //     throw `[Camera.cameraForwardInFrustum] should implementation: param: ${r}, ${t}`;
    // }

    // /**
    //  *
    //  * @param renderer
    //  * @param scene
    //  * @param useShadowPass
    //  * @param clearScene
    //  */
    // // render(renderer: Renderer) {
    // //     renderer.render();
    // // }
}
