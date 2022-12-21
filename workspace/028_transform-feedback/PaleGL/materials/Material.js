import {Shader} from "./../core/Shader.js";
import {BlendTypes, UniformTypes, PrimitiveTypes, RenderQueues, FaceSide} from "./../constants.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader.js";

// TODO: depth fragment は mesh に持たせた方がわかりやすそう
export class Material {
    name;
  
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
    queue;
    
    isSkinning;
    gpuSkinning;
    jointNum;
    
    vertexShader;
    fragmentShader;
    depthFragmentShader;

    #vertexShaderGenerator;
    #fragmentShaderGenerator;
    #depthFragmentShaderGenerator;

    #vertexShaderModifier;
    
    get isCompiledShader() {
        return !!this.shader;
    }
    
    get vertexShaderModifier() {
        return this.#vertexShaderModifier;
    }

    constructor({
        gpu,
        
        name,
        
        vertexShader,
        fragmentShader,
        depthFragmentShader,
        
        vertexShaderGenerator,
        fragmentShaderGenerator,
        depthFragmentShaderGenerator,
        
        vertexShaderModifier,
        
        primitiveType,
        depthTest = null,
        depthWrite = null,
        alphaTest = null,
        faceSide = FaceSide.Front,
        receiveShadow = false,
        blendType,
        renderQueue,
        isSkinning,
        gpuSkinning,
        queue,
        uniforms = {},
        depthUniforms = {}
    }) {
        this.name = name;
        
        // 外側から任意のタイミングでcompileした方が都合が良さそう
        // this.shader = new Shader({gpu, vertexShader, fragmentShader});
        
        if(vertexShader) {
            this.vertexShader = vertexShader;
        }
        if(fragmentShader) {
            this.fragmentShader = fragmentShader;
        }
        if(depthFragmentShader) {
            this.depthFragmentShader = depthFragmentShader;
        }
        
        if(vertexShaderGenerator) {
            this.#vertexShaderGenerator = vertexShaderGenerator;
        }
        if(fragmentShaderGenerator) {
            this.#fragmentShaderGenerator = fragmentShaderGenerator;
        }
        if(depthFragmentShaderGenerator) {
            this.#depthFragmentShaderGenerator = depthFragmentShaderGenerator;
        }
        
        if(vertexShaderModifier) {
            this.#vertexShaderModifier = vertexShaderModifier;
        }
        
        //this.#generateVertexShader = () => {
        //    if(this.vertexShader) {
        //        return;
        //    }
        //    // this.vertexShader = vertexShader;
        //    this.vertexShader = vertexShaderGenerator({ isSkinning, jointNum, gpuSkinning });
        //};
        //this.#generateFragmentShader = () => {
        //    if(this.fragmentShader) {
        //        return;
        //    }
        //    // this.fragmentShader = fragmentShader;
        //    this.fragmentShader = fragmentShaderGenerator();
        //};
        //this.#generateDepthFragmentShader = () => {
        //    if(this.depthFragmentShader) {
        //        return;
        //    }
        //    // this.depthFragmentShader = depthFragmentShader;
        //    // this.depthFragmentShader = depthFragmentShaderGenerator();
        //}
        
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
                case BlendTypes.Additive:
                    this.renderQueue = RenderQueues.Transparent;
                    break;
            }
        }

        if (!this.renderQueue) {
            throw "[Material.constructor] invalid render queue";
        }
       
        // TODO: フラグだけで判別した方が良い気がする
        // this.isSkinning = isSkinning || !!uniforms.uJointMatrices;
        // this.gpuSkinning = gpuSkinning || !!uniforms.uJointTexture;
        this.isSkinning = isSkinning;
        this.gpuSkinning = gpuSkinning;

        // TODO:
        // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        // - skinning回りもここで入れたい？
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

    start({ gpu, attributeDescriptors }) {
        // for debug
        // console.log("[Material.start] attributeDescriptors", attributeDescriptors)

        if(!this.vertexShader && this.#vertexShaderGenerator) {
            this.vertexShader = this.#vertexShaderGenerator({
                attributeDescriptors,
                isSkinning: this.isSkinning,
                jointNum: this.jointNum, 
                gpuSkinning: this.gpuSkinning
            });
        }
        if(!this.fragmentShader && this.#fragmentShaderGenerator) {
            this.fragmentShader = this.#fragmentShaderGenerator();
        }
        if(!this.depthFragmentShader && this.#depthFragmentShaderGenerator) {
            this.depthFragmentShader = this.#depthFragmentShaderGenerator();
        }

        this.shader = new Shader({
            gpu,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
    }
}
