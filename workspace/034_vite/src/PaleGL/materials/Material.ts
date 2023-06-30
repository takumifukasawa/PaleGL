import {Shader} from "./../core/Shader.ts";
import {
    BlendTypes,
    UniformTypes,
    PrimitiveTypes,
    RenderQueues,
    FaceSide,
    UniformNames,
    PrimitiveType, BlendType, RenderQueue, UniformType
} from "./../constants.ts";
import {Matrix4} from "../math/Matrix4.ts";
import {Vector3} from "../math/Vector3.ts";
import {buildVertexShader, buildFragmentShader} from "../shaders/buildShader.ts";
import {GPU} from "../core/GPU.ts";
import {Texture} from "../core/Texture.ts";

// TODO: fix type
export type UniformValue = number | number[] | Vector3 | Vector3[] | Matrix4 | Matrix4[] | Texture | null;

export type VertexShaderModifier = {
    "beginMain"?: string,
    "localPositionPostProcess"?: string,
    "worldPositionPostProcess"?: string,
    "viewPositionPostProcess"?: string,
    "outClipPositionPreProcess"?: string,
    "lastMain"?: string,
}

export type VertexShaderGenerator = ({
                                         attributeDescriptors,
                                         isSkinning,
                                         jointNum,
                                         gpuSkinning,
                                         isInstancing
                                     }: {
    attributeDescriptors,
    isSkinning: boolean,
    jointNum: number | null,
    gpuSkinning: boolean,
    isInstancing: boolean

}) => string;

export type FragmentShaderGenerator = ({attributeDescriptors}: { attributeDescriptors }) => string;

export type DepthFragmentShaderGenerator = () => string;

export interface Uniforms {
    [name: string]: {
        type: UniformType,
        value: UniformValue
    }
}

// -------------------------------------------------------------------
// TODO:
// - rawVertex, rawFragment を渡せるように？
// - vertexShaderGenerator, fragmentShaderGenerator を剥がす
// -------------------------------------------------------------------

export class Material {
    name: string;

    shader: Shader;
    primitiveType: PrimitiveType;
    blendType: BlendType;
    renderQueue: RenderQueue;
    uniforms: Uniforms = {};
    depthUniforms: Uniforms;
    depthTest: boolean;
    depthWrite: boolean;
    alphaTest: number;
    culling;
    faceSide: FaceSide;
    receiveShadow: boolean;
    queue: RenderQueue | null;

    useNormalMap: boolean;

    // skinning
    isSkinning: boolean;
    gpuSkinning: boolean;
    jointNum: number | null;

    // instancing
    isInstancing: boolean;

    // vertex color
    useVertexColor: boolean;

    vertexShader: string;
    fragmentShader: string;
    depthFragmentShader: string;

    rawVertexShader: string;
    rawFragmentShader: string;
    rawDepthFragmentShader: string;

    private vertexShaderGenerator: VertexShaderGenerator;
    private fragmentShaderGenerator: FragmentShaderGenerator;
    private depthFragmentShaderGenerator: DepthFragmentShaderGenerator;
    private vertexShaderModifier: VertexShaderModifier;

    get isCompiledShader() {
        return !!this.shader;
    }

    get vertexShaderModifier() {
        return this.vertexShaderModifier;
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

                    useNormalMap,

                    // skinning
                    isSkinning,
                    gpuSkinning,
                    jointNum,

                    // instancing
                    isInstancing = false,

                    // vertex color 
                    useVertexColor = false,

                    queue,
                    uniforms = {},
                    depthUniforms = {}
                }: {
                    // required

                    gpu: GPU,
                    vertexShader: string,
                    fragmentShader: string,

                    // optional

                    uniforms?: Uniforms,

                    name?: string,

                    depthFragmentShader?: string,

                    vertexShaderGenerator?: VertexShaderGenerator,
                    fragmentShaderGenerator?: FragmentShaderGenerator,
                    depthFragmentShaderGenerator?: DepthFragmentShaderGenerator,

                    vertexShaderModifier?: VertexShaderModifier,

                    primitiveType?: PrimitiveType,
                    depthTest?: boolean,
                    depthWrite?: boolean,
                    alphaTest?: number,
                    faceSide?: FaceSide,
                    receiveShadow?: boolean,
                    blendType?: BlendType,
                    renderQueue?: RenderQueue,

                    useNormalMap?: boolean,

                    // skinning
                    isSkinning?: boolean,
                    gpuSkinning?: boolean,
                    jointNum?: number | null,

                    // instancing
                    isInstancing?: boolean,

                    // vertex color 
                    useVertexColor?: boolean,

                    queue?: RenderQueue,
                    depthUniforms?: Uniforms
                }
    ) {
        this.name = name;

        // 外側から任意のタイミングでcompileした方が都合が良さそう
        // this.shader = new Shader({gpu, vertexShader, fragmentShader});

        if (vertexShader) {
            this.vertexShader = vertexShader;
        }
        if (fragmentShader) {
            this.fragmentShader = fragmentShader;
        }
        if (depthFragmentShader) {
            this.depthFragmentShader = depthFragmentShader;
        }

        if (vertexShaderGenerator) {
            this.vertexShaderGenerator = vertexShaderGenerator;
        }
        if (fragmentShaderGenerator) {
            this.fragmentShaderGenerator = fragmentShaderGenerator;
        }
        if (depthFragmentShaderGenerator) {
            this.depthFragmentShaderGenerator = depthFragmentShaderGenerator;
        }

        if (vertexShaderModifier) {
            this.vertexShaderModifier = vertexShaderModifier;
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
        this.jointNum = jointNum;

        this.isInstancing = isInstancing;
        this.useVertexColor = useVertexColor;

        this.useNormalMap = useNormalMap;

        // TODO:
        // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        // - skinning回りもここで入れたい？
        const commonUniforms = {
            [UniformNames.WorldMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity
            },
            [UniformNames.ViewMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity
            },
            [UniformNames.ProjectionMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity
            },
            [UniformNames.NormalMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity
            },
            // TODO: viewmatrixから引っ張ってきてもよい
            [UniformNames.ViewPosition]: {
                type: UniformTypes.Vector3,
                value: Vector3.zero
            },
            [UniformNames.Time]: {
                type: UniformTypes.Float,
                value: 0
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
                value: Matrix4.identity
            },
            // TODO: shadow map class を作って bias 持たせた方がよい
            [UniformNames.ShadowBias]: {
                type: UniformTypes.Float,
                value: 0.01
            }
        } : {};

        this.queue = queue || null;

        this.uniforms = {...commonUniforms, ...shadowUniforms, ...uniforms};

        this.depthUniforms = {...commonUniforms, ...depthUniforms};
    }

    start({gpu, attributeDescriptors})
        :
        void {
        // for debug
        // console.log("[Material.start] attributeDescriptors", attributeDescriptors)

        if (!
            this.vertexShader && this.vertexShaderGenerator
        ) {
            this.vertexShader = this.vertexShaderGenerator({
                attributeDescriptors,
                isSkinning: this.isSkinning,
                jointNum: this.jointNum,
                gpuSkinning: this.gpuSkinning,
                isInstancing: this.isInstancing
            });
        }
        if (!this.fragmentShader && this.fragmentShaderGenerator) {
            this.fragmentShader = this.fragmentShaderGenerator({
                attributeDescriptors,
            });
        }
        if (!this.depthFragmentShader && this.depthFragmentShaderGenerator) {
            this.depthFragmentShader = this.depthFragmentShaderGenerator();
        }

        const rawVertexShader = buildVertexShader(this.vertexShader, attributeDescriptors);
        const rawFragmentShader = buildFragmentShader(this.fragmentShader);

        this.rawVertexShader = rawVertexShader;
        this.rawFragmentShader = rawFragmentShader;

        this.shader = new Shader({
            gpu,
            // vertexShader: this.vertexShader,
            vertexShader: rawVertexShader,
            // fragmentShader: this.fragmentShader
            fragmentShader: rawFragmentShader,
        });
    }

// TODO:
// - structみたいな深い階層もupdateができるようにしたい
// - 'updateUniformValue'の方が良い??
    updateUniform(name: string, value: UniformValue): void {
        if (!
            this.uniforms[name]
        ) {
            throw `[Material.updateUniform] invalid uniform key: ${name}`;
        }
        this.uniforms[name].value = value;
    }

// // NOTE: renderer側でmaterial側のuniformをアップデートする用
// updateUniforms({ gpu } = {}) {}

// // TODO: engine向けのuniformの更新をrendererかmaterialでやるか悩ましい
// updateEngineUniforms() {} 

    getUniform(name)
        :
        UniformValue {
        if (!this.uniforms[name]) {
            throw `[Material.getUniform] invalid uniform key: ${name}`;
        }
        return this.uniforms[name].value;
    }
}
