import {Actor} from "./Actor";
import {Matrix4} from "../math/Matrix4";
import {Vector4} from "../math/Vector4";
// import {RenderTarget} from "./../core/RenderTarget";
import {
    ActorTypes,
    AttributeNames,
    AttributeUsageType,
    BlendTypes, CameraType,
    PrimitiveTypes,
    UniformNames
} from "../constants";
// import {Vector3} from "../math/Vector3";
import {Material} from "../materials/Material";
import {Geometry} from "../geometries/Geometry";
import {Mesh} from "./Mesh";
import {Attribute} from "../core/Attribute";
import {RenderTarget} from "../core/RenderTarget";
// import {Color} from "../math/Color";
import {Vector3} from "../math/Vector3";
import {PostProcess} from "../postprocess/PostProcess";
import {GPU} from "../core/GPU";
// import {AbstractRenderTarget} from "../core/AbstractRenderTarget";
import {GBufferRenderTargets} from "../core/GBufferRenderTargets";

export const FrustumDirection = {
    nearLeftTop: "nearLeftTop",
    nearRightTop: "nearRightTop",
    nearLeftBottom: "nearLeftBottom",
    nearRightBottom: "nearRightBottom",
    farLeftTop: "farLeftTop",
    farRightTop: "farRightTop",
    farLeftBottom: "farLeftBottom",
    farRightBottom: "farRightBottom",
} as const;
export type FrustumDirectionType = typeof FrustumDirection[keyof typeof FrustumDirection];

export type FrustumVectors = {
    [key in FrustumDirectionType]: Vector3;
};

export type CameraRenderTargetType = RenderTarget | GBufferRenderTargets | null;

export class Camera extends Actor {
    viewMatrix = Matrix4.identity;
    projectionMatrix = Matrix4.identity;
    #renderTarget: CameraRenderTargetType = null;
    clearColor: Vector4; // TODO: color class
    #postProcess: PostProcess | null;
    near: number = 1;
    far: number = 10;
    visibleFrustum: boolean = false;
    #visibleFrustumMesh: Mesh | null = null;
    cameraType: CameraType;
   
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
    constructor({cameraType, clearColor, postProcess}: {
        cameraType: CameraType,
        clearColor?: Vector4,
        postProcess?: PostProcess
    }) {
        super(ActorTypes.Camera);
        this.cameraType = cameraType;
        this.clearColor = clearColor || new Vector4(0, 0, 0, 1);
        this.#postProcess = postProcess || null;
    }

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

    setPostProcess(postProcess: PostProcess) {
        this.#postProcess = postProcess;
    }

    setClearColor(clearColor: Vector4) {
        this.clearColor = clearColor;
    }

    update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number }) {

        super.update({gpu, time, deltaTime});

        if (this.visibleFrustum && !this.#visibleFrustumMesh) {
            this.#visibleFrustumMesh = new Mesh({
                geometry: new Geometry({
                    gpu,
                    attributes: [
                        new Attribute({
                            name: AttributeNames.Position,
                            data: new Float32Array(new Array(3 * 8).fill(0)),
                            size: 3,
                            usageType: AttributeUsageType.DynamicDraw
                        }),
                    ],
                    drawCount: 2 * 12,
                    indices: [
                        // near clip
                        0, 1,
                        1, 3,
                        3, 2,
                        2, 0,
                        // far clip
                        4, 5,
                        5, 7,
                        7, 6,
                        6, 4,
                        // bridge
                        0, 4,
                        1, 5,
                        2, 6,
                        3, 7
                    ]
                }),
                material: new Material({
                    // gpu,
                    vertexShader: `#version 300 es
                    
                    layout (location = 0) in vec3 ${AttributeNames.Position};
                   
                    uniform mat4 ${UniformNames.WorldMatrix};
                    uniform mat4 ${UniformNames.ViewMatrix};
                    uniform mat4 ${UniformNames.ProjectionMatrix};
                    
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
                    depthWrite: false
                })
            });
            this.addChild(this.#visibleFrustumMesh as Actor);
        }

        if (this.#visibleFrustumMesh) {
            const frustumPositions = this.getFrustumLocalPositions();
            this.#visibleFrustumMesh.geometry.updateAttribute(AttributeNames.Position, new Float32Array([
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
            ]));
        }
    }

    updateTransform() {
        super.updateTransform();
        this.viewMatrix = this.transform.worldMatrix.clone().invert();
    }

    setRenderTarget(renderTarget: RenderTarget | GBufferRenderTargets | null) {
        this.#renderTarget = renderTarget;
    }

    // @ts-ignore
    #updateProjectionMatrix() {
        throw "should implementation";
    }

    getFrustumLocalPositions(): FrustumVectors {
        throw "should implementation";
    }

    getFrustumWorldPositions() {
        throw "should implementation";
    }
}
