import {Shader} from "./../core/Shader.js";
import {BlendTypes, UniformTypes, PrimitiveTypes, RenderQueues} from "./../constants.js";
import {Matrix4} from "../math/Matrix4.js";

export class Material {
    shader;
    primitiveType;
    blendType;
    renderQueue;
    uniforms = {};

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
        blendType,
        renderQueue,
        uniforms = {}
    }) {
        this.shader = new Shader({gpu, vertexShader, fragmentShader});
        this.primitiveType = primitiveType || PrimitiveTypes.Triangles;
        this.blendType = blendType || BlendTypes.Opaque;

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

        // TODO: シェーダーごとにわける？
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
        };

        this.uniforms = {...commonUniforms, ...uniforms};
    }
}
