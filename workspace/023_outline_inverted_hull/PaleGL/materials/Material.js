import {Shader} from "./../core/Shader.js";
import {BlendTypes, UniformTypes, PrimitiveTypes, RenderQueues, FaceSide} from "./../constants.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader.js";

export class Material {
    shader;
    primitiveType;
    blendType;
    renderQueue;
    uniforms = {};
    depthUniforms;
    depthTest;
    depthWrite;
    alphaTest;
    culling;
    faceSide;
    receiveShadow;
    isSkinning;
    queue;
    
    vertexShader;
    fragmentShader;
    depthFragmentShader;
   
    get isCompiledShader() {
        return !!this.shader;
    }
    
    constructor({
        gpu,
        vertexShader,
        fragmentShader,
        depthFragmentShader,
        primitiveType,
        depthTest = null,
        depthWrite = null,
        alphaTest = null,
        faceSide = FaceSide.Front,
        receiveShadow = false,
        blendType,
        renderQueue,
        isSkinning,
        queue,
        uniforms = {},
        depthUniforms = {}
    }) {
        // 外側から任意のタイミングでcompileした方が都合が良さそう
        // this.shader = new Shader({gpu, vertexShader, fragmentShader});

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.depthFragmentShader = depthFragmentShader;
        
        this.primitiveType = primitiveType || PrimitiveTypes.Triangles;
        this.blendType = blendType || BlendTypes.Opaque;

        this.depthTest = depthTest !== null ? depthTest : true;
        this.depthWrite = depthWrite;
        this.alphaTest = alphaTest;

        this.faceSide = faceSide;
        this.receiveShadow = !!receiveShadow;

        if (!!renderQueue) {
            this.renderQueue = renderQueue;
        } else {
            switch (this.blendType) {
                case BlendTypes.Opaque:
                    this.renderQueue = RenderQueues.Opaque;
                    break;
                case BlendTypes.Transparent:
                    this.renderQueue = RenderQueues.Transparent;
                    break;
            }
        }

        if (!this.renderQueue) {
            throw "invalid render queue";
        }
        
        this.isSkinning = isSkinning;

        // TODO: シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
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
            },

            ...(this.alphaTest ? {
                uAlphaTestThreshold: {
                    type: UniformTypes.Float,
                    value: this.alphaTest
                }
            } : {})
        };
        
        const shadowUniforms = this.receiveShadow ? {
            uShadowMap: {
                type: UniformTypes.Texture,
                value: null,
            },
            uShadowMapProjectionMatrix: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: shadow map class を作って bias 持たせた方がよい
            uShadowBias: {
                type: UniformTypes.Float,
                value: 0.01
            }
        } : {};
        
        this.queue = queue || null;

        this.uniforms = {...commonUniforms, ...shadowUniforms, ...uniforms};
        
        this.depthUniforms = {...commonUniforms, ...depthUniforms };
    }
    
    compileShader({ gpu }) {
        this.shader = new Shader({
            gpu,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
    }
}
