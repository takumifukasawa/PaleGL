import {Shader} from "./../core/Shader.js";
import {BlendTypes, UniformTypes, PrimitiveTypes, RenderQueues, FaceSide, UniformNames} from "./../constants.js";
import {Matrix4} from "../math/Matrix4.js";
import {Vector3} from "../math/Vector3.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader.js";

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
   
    // skinning
    isSkinning;
    gpuSkinning;
    jointNum;
    
    // instancing
    isInstancing;
    
    // vertex color
    useVertexColor;

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
        
        // skinning
        isSkinning,
        gpuSkinning,
        
        // instancing
        isInstancing = false,
       
        // vertex color 
        useVertexColor = false,
        
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
      
        // skinning
        this.isSkinning = isSkinning;
        this.gpuSkinning = gpuSkinning;
        
        this.isInstancing = isInstancing;
        this.useVertexColor = useVertexColor;

        // TODO:
        // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        // - skinning回りもここで入れたい？
        const commonUniforms = {
            [UniformNames.WorldMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            [UniformNames.ViewMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            [UniformNames.ProjectionMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            [UniformNames.NormalMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: viewmatrixから引っ張ってきてもよい
            [UniformNames.ViewPosition]: {
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
            [UniformNames.ShadowMap]: {
                type: UniformTypes.Texture,
                value: null,
            },
            [UniformNames.ShadowMapProjectionMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity()
            },
            // TODO: shadow map class を作って bias 持たせた方がよい
            [UniformNames.ShadowBias]: {
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
                gpuSkinning: this.gpuSkinning,
                isInstancing: this.isInstancing
            });
        }
        if(!this.fragmentShader && this.#fragmentShaderGenerator) {
            this.fragmentShader = this.#fragmentShaderGenerator({
                attributeDescriptors,
            });
        }
        if(!this.depthFragmentShader && this.#depthFragmentShaderGenerator) {
            this.depthFragmentShader = this.#depthFragmentShaderGenerator();
        }
       
        // for debug
        // console.log(this.uniforms, this.depthUniforms)
        
        this.shader = new Shader({
            gpu,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });
    }

    updateUniform(name, value) {
        if(!this.uniforms[name]) {
            throw "[Material.updateUniform] invalid name.";
        }
        this.uniforms[name].value = value;
    }
   
    // // NOTE: renderer側でmaterial側のuniformをアップデートする用
    // updateUniforms({ gpu } = {}) {}
    
    // // TODO: engine向けのuniformの更新をrendererかmaterialでやるか悩ましい
    // updateEngineUniforms() {} 
}
