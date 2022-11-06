import {Shader} from "./../core/Shader.js";
import {BlendTypes, UniformTypes, PrimitiveTypes, RenderQueues, FaceSide} from "./../constants.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";

export class Material {
    shader;
    primitiveType;
    blendType;
    renderQueue;
    uniforms = {};
    depthTest;
    depthWrite;
    culling;
    faceSide;

    static UniformTypes = {
        Float: "Float",
        Matrix4fv: "Matrix4fv",
        Vector3f: "Vector3f",
    };

    constructor({
        gpu,
        vertexShader,
        fragmentShader,
        primitiveType,
        depthTest = null,
        depthWrite = null,
        faceSide = FaceSide.Front,
        blendType,
        renderQueue,
        uniforms = {}
    }) {
        this.shader = new Shader({gpu, vertexShader, fragmentShader});
        this.primitiveType = primitiveType || PrimitiveTypes.Triangles;
        this.blendType = blendType || BlendTypes.Opaque;
        
        this.depthTest = depthTest !== null ? depthTest : true;
        this.depthWrite = depthWrite;
        
        this.faceSide = faceSide;

        if(!!renderQueue) {
            this.renderQueue = renderQueue;
        } else {
            switch(this.blendType) {
                case BlendTypes.Opaque:
                    this.renderQueue = RenderQueues.Opaque;
                    break;
                case BlendTypes.Transparent: 
                    this.renderQueue = RenderQueues.Transparent;
                    break;
            }
        }
        
        if(!this.renderQueue) {
            throw "invalid render queue";
        }

        // TODO: シェーダーごとにわける？(postprocessの場合はいらないuniformなどがある
        const commonUniforms = {
            uWorldMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uViewMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uProjectionMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            uNormalMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: viewmatrixから引っ張ってきてもよい
            uViewPosition: {
                type: UniformTypes.Vector3,
                value: Vector3.zero()
            }
        };

        this.uniforms = {...commonUniforms, ...uniforms};
    }
}
