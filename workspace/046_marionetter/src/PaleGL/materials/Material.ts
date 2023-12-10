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
    // UniformType,
    VertexShaderModifier,
    FragmentShaderModifier,
    DepthFuncType,
    DepthFuncTypes,
    RenderQueueType,
} from '@/PaleGL/constants';
import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { buildVertexShader, buildFragmentShader, ShaderDefines } from '@/PaleGL/shaders/buildShader';
import { GPU } from '@/PaleGL/core/GPU';
// import { Texture } from '@/PaleGL/core/Texture';
import { AttributeDescriptor } from '@/PaleGL/core/Attribute';
// import { CubeMap } from '@/PaleGL/core/CubeMap';
// import { Vector2 } from '@/PaleGL/math/Vector2';
// import { Color } from '@/PaleGL/math/Color';
// import { DirectionalLightStruct } from '@/PaleGL/actors/DirectionalLight.ts';
// import {Vector4} from "@/PaleGL/math/Vector4.ts";
import {Uniforms, UniformsData} from '@/PaleGL/core/Uniforms.ts';

export type MaterialArgs = {
    // required

    // gpu: GPU,
    // TODO: required じゃなくて大丈夫??
    vertexShader?: string;
    fragmentShader?: string;

    // optional

    uniforms?: UniformsData;

    name?: string;

    depthFragmentShader?: string;

    vertexShaderGenerator?: VertexShaderGenerator;
    fragmentShaderGenerator?: FragmentShaderGenerator;
    depthFragmentShaderGenerator?: DepthFragmentShaderGenerator;

    vertexShaderModifier?: VertexShaderModifier;
    fragmentShaderModifier?: FragmentShaderModifier;

    primitiveType?: PrimitiveType;
    depthTest?: boolean | null;
    depthWrite?: boolean | null;
    depthFuncType?: DepthFuncType;
    alphaTest?: number | null;
    faceSide?: FaceSide;
    receiveShadow?: boolean;
    blendType?: BlendType;
    renderQueue?: RenderQueue;

    // normal map
    useNormalMap?: boolean | null;

    // env map
    useEnvMap?: boolean | null;

    // skinning
    isSkinning?: boolean | null;
    gpuSkinning?: boolean | null;
    jointNum?: number | null;

    // instancing
    isInstancing?: boolean;

    // vertex color
    useVertexColor?: boolean;

    queue?: RenderQueue;
    depthUniforms?: UniformsData;
};

// export type UniformStructValue = {
//     [key: string]: UniformTypeValuePair;
// };
//
// // TODO: fix type
// export type UniformValue =
//     | number
//     | number[]
//     | Vector2
//     | Vector2[]
//     | Vector3
//     | Vector3[]
//     | Vector4
//     | Vector4[]
//     | Matrix4
//     | Matrix4[]
//     | Texture
//     | CubeMap
//     | Color
//     | Color[]
//     | Float32Array
//     | DirectionalLightStruct
//     | UniformStructValue
//     | null;

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

// type UniformTypeValuePair = {
//     type: UniformType;
//     value: UniformValue;
// };
//
// export interface Uniforms {
//     [name: string]: UniformTypeValuePair;
// }

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
    uniforms: Uniforms;
    depthUniforms: Uniforms;
    depthTest: boolean | null;
    depthWrite: boolean | null;
    depthFuncType: DepthFuncType;
    alphaTest: number | null;
    // culling;
    faceSide: FaceSide;
    receiveShadow: boolean;
    queue: RenderQueue | null;

    useNormalMap: boolean | null;

    useEnvMap: boolean | null;

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
    private _fragmentShaderModifier: FragmentShaderModifier = {};

    get isCompiledShader() {
        return !!this.shader;
    }

    get vertexShaderModifier() {
        return this._vertexShaderModifier;
    }

    get fragmentShaderModifier() {
        return this._fragmentShaderModifier;
    }

    get useAlphaTest() {
        return this.alphaTest !== null;
    }

    /**
     * 
     * @param name
     * @param vertexShader
     * @param fragmentShader
     * @param depthFragmentShader
     * @param vertexShaderGenerator
     * @param fragmentShaderGenerator
     * @param depthFragmentShaderGenerator
     * @param vertexShaderModifier
     * @param primitiveType
     * @param depthTest
     * @param depthWrite
     * @param depthFuncType
     * @param alphaTest
     * @param faceSide
     * @param receiveShadow
     * @param blendType
     * @param renderQueue
     * @param useNormalMap
     * @param isSkinning
     * @param gpuSkinning
     * @param jointNum
     * @param isInstancing
     * @param useVertexColor
     * @param useEnvMap
     * @param queue
     * @param uniforms
     * @param depthUniforms
     */
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
        depthFuncType = DepthFuncTypes.Lequal,
        alphaTest = null,
        faceSide = FaceSide.Front,
        receiveShadow = false,
        blendType = BlendTypes.Opaque,
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

        // env map
        useEnvMap = false,

        queue,
        uniforms = [],
        depthUniforms = [],
    } // uniforms = {},
    // depthUniforms = {},
    : MaterialArgs) {
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

        // this.depthTest = depthTest ? !!depthTest : true;
        this.depthTest = !!depthTest;
        this.depthWrite = !!depthWrite;
        this.depthFuncType = depthFuncType;

        this.alphaTest = typeof alphaTest === 'number' ? alphaTest : null;

        this.faceSide = faceSide || FaceSide.Front;
        this.receiveShadow = !!receiveShadow;

        if (renderQueue) {
            this.renderQueue = renderQueue;
        } else {
            switch (this.blendType) {
                case BlendTypes.Opaque:
                    this.renderQueue = RenderQueues[RenderQueueType.Opaque];
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    this.renderQueue = RenderQueues[RenderQueueType.Transparent];
                    break;
            }
        }

        // console.log(renderQueue, this.renderQueue, this.blendType);

        if (!this.renderQueue) {
            console.error(`[Material.constructor] invalid render queue: ${renderQueue}`);
        }

        // skinning
        this.isSkinning = !!isSkinning;
        this.gpuSkinning = !!gpuSkinning;
        this.jointNum = typeof jointNum == 'number' ? jointNum : null;

        this.isInstancing = !!isInstancing;
        this.useVertexColor = !!useVertexColor;

        // normal map
        this.useNormalMap = !!useNormalMap;

        // env map
        this.useEnvMap = !!useEnvMap;

        // TODO:
        // - シェーダーごとにわける？(postprocessやreceiveShadow:falseの場合はいらないuniformなどがある
        // - skinning回りもここで入れたい？
        const commonUniforms: UniformsData = [
            {
                name: UniformNames.WorldMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.NormalMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                // TODO: viewmatrixから引っ張ってきてもよい
                name: UniformNames.ViewPosition,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
            ...(this.alphaTest
                ? [
                      {
                          name: 'uAlphaTestThreshold',
                          type: UniformTypes.Float,
                          value: this.alphaTest,
                      },
                  ]
                : []),
        ];

        // TODO: いまやdeferred-shading-passでしか使ってないのでここでやる必要がないかも
        const shadowUniforms: UniformsData = this.receiveShadow
            ? [
                  {
                      name: UniformNames.ShadowMap,
                      type: UniformTypes.Texture,
                      value: null,
                  },
                  {
                      name: UniformNames.ShadowMapProjectionMatrix,
                      type: UniformTypes.Matrix4,
                      value: Matrix4.identity,
                  },
                  {
                      // TODO: shadow map class を作って bias 持たせた方がよい
                      name: UniformNames.ShadowBias,
                      type: UniformTypes.Float,
                      value: 0.01,
                  },
              ]
            : [];

        this.queue = queue || null;

        this.uniforms = new Uniforms(commonUniforms, shadowUniforms, uniforms);

        this.depthUniforms = new Uniforms(commonUniforms, depthUniforms);
    }
    
    // createDepthMaterial() {
    // }

    /**
     * 
     * @param gpu
     * @param attributeDescriptors
     */
    start({ gpu, attributeDescriptors }: { gpu: GPU; attributeDescriptors: AttributeDescriptor[] }): void {
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

        const shaderDefineOptions: ShaderDefines = {
            receiveShadow: !!this.receiveShadow,
            isSkinning: !!this.isSkinning,
            gpuSkinning: !!this.gpuSkinning,
            useNormalMap: !!this.useNormalMap,
            useEnvMap: !!this.useEnvMap,
            useReceiveShadow: !!this.receiveShadow,
            useVertexColor: !!this.useVertexColor,
            isInstancing: !!this.isInstancing,
            useAlphaTest: !!this.alphaTest,
        };

        const rawVertexShader = buildVertexShader(
            this.vertexShader,
            attributeDescriptors,
            shaderDefineOptions,
            this.vertexShaderModifier
        );
        const rawFragmentShader = buildFragmentShader(
            this.fragmentShader,
            shaderDefineOptions,
            this.fragmentShaderModifier
        );

        this.rawVertexShader = rawVertexShader;
        this.rawFragmentShader = rawFragmentShader;

        // for debug
        // console.log(this.fragmentShader, shaderDefineOptions, this.fragmentShaderModifier, rawFragmentShader)
        // console.log(rawFragmentShader)

        this.shader = new Shader({
            gpu,
            // vertexShader: this.vertexShader,
            vertexShader: rawVertexShader,
            // fragmentShader: this.fragmentShader
            fragmentShader: rawFragmentShader,
        });
    }
}
