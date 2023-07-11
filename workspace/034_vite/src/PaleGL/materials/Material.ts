import { Shader } from '@/PaleGL/core/Shader';
import {
    BlendTypes,
    UniformTypes,
    PrimitiveTypes,
    RenderQueues,
    FaceSide,
    UniformNames,
    PrimitiveType,
    BlendType,
    RenderQueue,
    UniformType,
} from '@/PaleGL/constants';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { buildVertexShader, buildFragmentShader } from '@/PaleGL/shaders/buildShader';
import { GPU } from '@/PaleGL/core/GPU';
import { Texture } from '@/PaleGL/core/Texture';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
import { CubeMap } from '@/PaleGL/core/CubeMap';
import { Vector2 } from '@/PaleGL/math/Vector2';
import { Color } from '@/PaleGL/math/Color';
import { DirectionalLightStruct } from '@/PaleGL/shaders/lightingCommon';

export type MaterialArgs = {
    // required

    // gpu: GPU,
    // TODO: required じゃなくて大丈夫??
    vertexShader?: string;
    fragmentShader?: string;

    // optional

    uniforms?: Uniforms;

    name?: string;

    depthFragmentShader?: string;

    vertexShaderGenerator?: VertexShaderGenerator;
    fragmentShaderGenerator?: FragmentShaderGenerator;
    depthFragmentShaderGenerator?: DepthFragmentShaderGenerator;

    vertexShaderModifier?: VertexShaderModifier;

    primitiveType?: PrimitiveType;
    depthTest?: boolean | null;
    depthWrite?: boolean | null;
    alphaTest?: number | null;
    faceSide?: FaceSide;
    receiveShadow?: boolean;
    blendType?: BlendType;
    renderQueue?: RenderQueue;

    useNormalMap?: boolean | null;

    // skinning
    isSkinning?: boolean | null;
    gpuSkinning?: boolean | null;
    jointNum?: number | null;

    // instancing
    isInstancing?: boolean;

    // vertex color
    useVertexColor?: boolean;

    queue?: RenderQueue;
    depthUniforms?: Uniforms;
};

export type UniformStructValue = {
    [key: string]: UniformTypeValuePair;
};

// TODO: fix type
export type UniformValue =
    | number
    | number[]
    | Vector2
    | Vector2[]
    | Vector3
    | Vector3[]
    | Matrix4
    | Matrix4[]
    | Texture
    | CubeMap
    | Color
    | Color[]
    | Float32Array
    | DirectionalLightStruct
    | UniformStructValue
    | null;

// TODO: key to type
export type VertexShaderModifier = {
    beginMain?: string;
    localPositionPostProcess?: string;
    worldPositionPostProcess?: string;
    viewPositionPostProcess?: string;
    outClipPositionPreProcess?: string;
    lastMain?: string;
};

export type VertexShaderGenerator = ({
    attributeDescriptors,
    isSkinning,
    jointNum,
    gpuSkinning,
    isInstancing,
}: {
    attributeDescriptors: AttributeDescriptor[];
    isSkinning: boolean;
    jointNum: number | null;
    gpuSkinning: boolean | null;
    isInstancing: boolean;
}) => string;

export type FragmentShaderGenerator = ({
    attributeDescriptors,
}: {
    attributeDescriptors?: AttributeDescriptor[];
}) => string;

export type DepthFragmentShaderGenerator = () => string;

type UniformTypeValuePair = {
    type: UniformType;
    value: UniformValue;
};

export interface Uniforms {
    [name: string]: UniformTypeValuePair;
}

// -------------------------------------------------------------------
// TODO:
// - rawVertex, rawFragment を渡せるように？
// - vertexShaderGenerator, fragmentShaderGenerator を剥がす
// -------------------------------------------------------------------

export class Material {
    name: string = '';

    shader: Shader | null = null;
    primitiveType: PrimitiveType;
    blendType: BlendType;
    renderQueue: RenderQueue;
    uniforms: Uniforms = {};
    depthUniforms: Uniforms;
    depthTest: boolean | null;
    depthWrite: boolean | null;
    alphaTest: number | null;
    // culling;
    faceSide: FaceSide;
    receiveShadow: boolean;
    queue: RenderQueue | null;

    useNormalMap: boolean | null;

    // skinning
    isSkinning: boolean | null;
    gpuSkinning: boolean | null;
    jointNum: number | null;

    // instancing
    isInstancing: boolean;

    // vertex color
    useVertexColor: boolean;

    vertexShader: string;
    fragmentShader: string;
    depthFragmentShader: string | null = null;

    rawVertexShader: string | null = null;
    rawFragmentShader: string | null = null;
    rawDepthFragmentShader: string | null = null;

    private vertexShaderGenerator: VertexShaderGenerator | null = null;
    private fragmentShaderGenerator: FragmentShaderGenerator | null = null;
    private depthFragmentShaderGenerator: DepthFragmentShaderGenerator | null = null;
    private _vertexShaderModifier: VertexShaderModifier = {};

    get isCompiledShader() {
        return !!this.shader;
    }

    get vertexShaderModifier() {
        return this._vertexShaderModifier;
    }

    get useAlphaTest() {
        return this.alphaTest !== null;
    }

    constructor({
        // gpu,

        name = '',

        vertexShader = '',
        fragmentShader = '',
        depthFragmentShader,

        vertexShaderGenerator,
        fragmentShaderGenerator,
        depthFragmentShaderGenerator,

        vertexShaderModifier,

        primitiveType,
        depthTest = true,
        depthWrite = true,
        alphaTest = null,
        faceSide = FaceSide.Front,
        receiveShadow = false,
        blendType,
        renderQueue,

        useNormalMap = null,

        // skinning
        isSkinning = null,
        gpuSkinning = null,
        jointNum = null,

        // instancing
        isInstancing = false,

        // vertex color
        useVertexColor = false,

        queue,
        uniforms = {},
        depthUniforms = {},
    }: MaterialArgs) {
        this.name = name || '';

        // 外側から任意のタイミングでcompileした方が都合が良さそう
        // this.shader = new Shader({gpu, vertexShader, fragmentShader});

        // if (vertexShader) {
        this.vertexShader = vertexShader || '';
        // }
        // if (fragmentShader) {
        this.fragmentShader = fragmentShader || '';
        // }
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
            this._vertexShaderModifier = vertexShaderModifier;
        }

        this.primitiveType = primitiveType || PrimitiveTypes.Triangles;
        this.blendType = blendType || BlendTypes.Opaque;

        this.depthTest = depthTest ? !!depthTest : true;
        this.depthWrite = !!depthWrite;
        this.alphaTest = typeof alphaTest === 'number' ? alphaTest : null;

        this.faceSide = faceSide || FaceSide.Front;
        this.receiveShadow = !!receiveShadow;

        if (renderQueue) {
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
            throw '[Material.constructor] invalid render queue';
        }

        // skinning
        this.isSkinning = !!isSkinning;
        this.gpuSkinning = !!gpuSkinning;
        this.jointNum = typeof jointNum == 'number' ? jointNum : null;

        this.isInstancing = !!isInstancing;
        this.useVertexColor = !!useVertexColor;

        this.useNormalMap = !!useNormalMap;

        // TODO:
        // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        // - skinning回りもここで入れたい？
        const commonUniforms: Uniforms = {
            [UniformNames.WorldMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            [UniformNames.ViewMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            [UniformNames.ProjectionMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            [UniformNames.NormalMatrix]: {
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            // TODO: viewmatrixから引っ張ってきてもよい
            [UniformNames.ViewPosition]: {
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            [UniformNames.Time]: {
                type: UniformTypes.Float,
                value: 0,
            },
            ...(this.alphaTest
                ? {
                      uAlphaTestThreshold: {
                          type: UniformTypes.Float,
                          value: this.alphaTest,
                      },
                  }
                : {}),
        };

        const shadowUniforms: Uniforms = this.receiveShadow
            ? {
                  [UniformNames.ShadowMap]: {
                      type: UniformTypes.Texture,
                      value: null,
                  },
                  [UniformNames.ShadowMapProjectionMatrix]: {
                      type: UniformTypes.Matrix4,
                      value: Matrix4.identity,
                  },
                  // TODO: shadow map class を作って bias 持たせた方がよい
                  [UniformNames.ShadowBias]: {
                      type: UniformTypes.Float,
                      value: 0.01,
                  },
              }
            : {};

        this.queue = queue || null;

        this.uniforms = { ...commonUniforms, ...shadowUniforms, ...uniforms };

        this.depthUniforms = { ...commonUniforms, ...depthUniforms };
    }

    start({ gpu, attributeDescriptors = [] }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }): void {
        // for debug
        // console.log("[Material.start] attributeDescriptors", attributeDescriptors)

        if (!this.vertexShader && this.vertexShaderGenerator) {
            this.vertexShader = this.vertexShaderGenerator({
                attributeDescriptors,
                isSkinning: !!this.isSkinning,
                jointNum: this.jointNum,
                gpuSkinning: this.gpuSkinning,
                isInstancing: this.isInstancing,
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
        if (!this.uniforms[name]) {
            throw `[Material.updateUniform] invalid uniform key: ${name}`;
        }
        this.uniforms[name].value = value;
    }

    // // NOTE: renderer側でmaterial側のuniformをアップデートする用
    // updateUniforms({ gpu } = {}) {}

    // // TODO: engine向けのuniformの更新をrendererかmaterialでやるか悩ましい
    // updateEngineUniforms() {}

    getUniform(name: string): UniformValue {
        if (!this.uniforms[name]) {
            throw `[Material.getUniform] invalid uniform key: ${name}`;
        }
        return this.uniforms[name].value;
    }
}
