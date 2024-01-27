
export const MAX_SPOT_LIGHT_COUNT = 4;

// -----------------------------------------------------------------------------
// engine
// TODO: const assertion の連番、自動で作ることはできない？ union型でいい感じにするしかない？
// TODO: ビルド最適化のために一個一個exportする
// -----------------------------------------------------------------------------


export const PrimitiveTypes = {
    Points: 0,
    Lines: 1,
    LineLoop: 2,
    LineStrip: 3,
    Triangles: 4,
    TriangleStrip: 5,
    TriangleFan: 6,
} as const;

export type PrimitiveType = (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes];

export const ShadingModelIds = {
    Lit: 1,
    Unlit: 2,
    Skybox: 3,
};

export type ShadingModelIds = (typeof ShadingModelIds)[keyof typeof ShadingModelIds];

export const DepthFuncTypes = {
    // Lequal: "Lequal",
    // Equal: "Equal",
    Lequal: 0,
    Equal: 1,
} as const;

export type DepthFuncType = (typeof DepthFuncTypes)[keyof typeof DepthFuncTypes];

export const BlendTypes = {
    Opaque: 0,
    Transparent: 1,
    Additive: 2,
} as const;

export type BlendType = (typeof BlendTypes)[keyof typeof BlendTypes];

export const RenderQueueType = {
    // TransformFeedback: 'TransformFeedback',
    Skybox: 's',
    Opaque: 'o',
    AlphaTest: 'a',
    Transparent: 't',
} as const;

export type RenderQueueType = (typeof RenderQueueType)[keyof typeof RenderQueueType];

export const RenderQueues = {
    [RenderQueueType.Skybox]: 0,
    [RenderQueueType.Opaque]: 1,
    [RenderQueueType.AlphaTest]: 2,
    [RenderQueueType.Transparent]: 3,
} as const;

export type RenderQueue = (typeof RenderQueues)[keyof typeof RenderQueues];

export const RenderbufferTypes = {
    Depth: 0,
} as const;

export type RenderbufferType = (typeof RenderbufferTypes)[keyof typeof RenderbufferTypes];

export const LightTypes = {
    Directional: 0,
    Spot: 1,
} as const;

export type LightType = (typeof LightTypes)[keyof typeof LightTypes];

export const ActorTypes = {
    Null: 0,
    Mesh: 1,
    SkinnedMesh: 2,
    Light: 3,
    Skybox: 4,
    Camera: 5,
    TextMesh: 6,
} as const;

export type ActorType = (typeof ActorTypes)[keyof typeof ActorTypes];

export const CameraTypes = {
    Perspective: 0,
    Orthographic: 1,
} as const;

export type CameraType = (typeof CameraTypes)[keyof typeof CameraTypes];

export const CubeMapAxis = {
    PositiveX: 0,
    NegativeX: 1,
    PositiveY: 2,
    NegativeY: 3,
    PositiveZ: 4,
    NegativeZ: 5,
} as const;

export type CubeMapAxis = (typeof CubeMapAxis)[keyof typeof CubeMapAxis];

export const FaceSide = {
    Front: 0,
    Back: 1,
    Double: 2,
} as const;

export type FaceSide = (typeof FaceSide)[keyof typeof FaceSide];

// export type AttributeUsageType =
// {
//     StaticDraw: "StaticDraw",
//     DynamicDraw: "DynamicDraw"
// }

// -----------------------------------------------------------------------------
// texture
// -----------------------------------------------------------------------------

export const TextureTypes = {
    RGBA: 0,
    Depth: 1,
    RGBA16F: 2,
    RGBA32F: 3,
    R11F_G11F_B10F: 4,
    R16F: 5,
} as const;

export type TextureType = (typeof TextureTypes)[keyof typeof TextureTypes];

export const TextureWrapTypes = {
    Repeat: 0,
    ClampToEdge: 1,
} as const;

export type TextureWrapType = (typeof TextureWrapTypes)[keyof typeof TextureWrapTypes];

export const TextureFilterTypes = {
    Nearest: 0, // min, mag
    Linear: 1, // min, mag
    NearestMipmapNearest: 2, // only min filter
    NearestMipmapLinear: 3, // only min filter,
    LinearMipmapNearest: 4, // only min filter
    LinearMipmapLinear: 5, // only min filter
} as const;

export type TextureFilterType = (typeof TextureFilterTypes)[keyof typeof TextureFilterTypes];

export const TextureDepthPrecisionType = {
    Medium: 0,
    High: 1
} as const;

export type TextureDepthPrecisionType = (typeof TextureDepthPrecisionType)[keyof typeof TextureDepthPrecisionType];

// -----------------------------------------------------------------------------
// render target types
// -----------------------------------------------------------------------------

export const RenderTargetTypes = {
    RGBA: 0,
    Depth: 1,
    Empty: 2,
    RGBA16F: 3,
    R11F_G11F_B10F: 4,
    R16F: 5,
} as const;

export type RenderTargetType = (typeof RenderTargetTypes)[keyof typeof RenderTargetTypes];

// -----------------------------------------------------------------------------
// animation keyframes
// -----------------------------------------------------------------------------

export const AnimationKeyframeTypes = {
    Vector3: 0,
    Quaternion: 1,
} as const;

export type AnimationKeyframeType = (typeof AnimationKeyframeTypes)[keyof typeof AnimationKeyframeTypes];

// -----------------------------------------------------------------------------
// geometry attributes
// -----------------------------------------------------------------------------

// TODO: rename Type"s"
export const AttributeUsageType = {
    StaticDraw: 0,
    DynamicDraw: 1,
    DynamicCopy: 2,
} as const;

export type AttributeUsageType = (typeof AttributeUsageType)[keyof typeof AttributeUsageType];

export const AttributeNames = {
    Position: 'aPosition',
    Color: 'aColor',
    Uv: 'aUv',
    Normal: 'aNormal',
    Tangent: 'aTangent',
    Binormal: 'aBinormal',
    // skinning
    BoneIndices: 'aBoneIndices',
    BoneWeights: 'aBoneWeighs',
    // instancing
    InstancePosition: 'aInstancePosition',
    InstanceScale: 'aInstanceScale',
    InstanceRotation: 'aInstanceRotation',
    InstanceAnimationOffset: 'aInstanceAnimationOffset',
    InstanceVertexColor: 'aInstanceVertexColor',
    InstanceVelocity: 'aInstanceVelocity',
} as const;

export type AttributeName = (typeof AttributeNames)[keyof typeof AttributeNames];

// -----------------------------------------------------------------------------
// uniforms
// -----------------------------------------------------------------------------

export const UniformTypes = {
    Matrix4: 0,
    Matrix4Array: 1,
    Texture: 2,
    CubeMap: 3,
    Vector2: 4,
    Vector2Array: 5,
    Vector3: 6,
    Vector4: 7,
    Vector4Array: 8,
    Struct: 9,
    StructArray: 10,
    Float: 11,
    FloatArray: 12,
    Int: 13,
    Color: 14,
    ColorArray: 15,
} as const;

export type UniformTypes = (typeof UniformTypes)[keyof typeof UniformTypes];

// TODO: Texture -> Map にしたい？
// TODO: objectじゃなくて単体のconst_stringにするべき
export const UniformNames = {
    // transforms
    WorldMatrix: 'uWorldMatrix',
    ViewMatrix: 'uViewMatrix',
    ProjectionMatrix: 'uProjectionMatrix',
    ViewProjectionMatrix: 'uViewProjectionMatrix',
    NormalMatrix: 'uNormalMatrix',
    InverseWorldMatrix: 'uInverseWorldMatrix',
    InverseViewMatrix: 'uInverseViewMatrix',
    InverseViewProjectionMatrix: 'uInverseViewProjectionMatrix',
    InverseProjectionMatrix: 'uInverseProjectionMatrix',
    TransposeInverseViewMatrix: 'uTransposeInverseViewMatrix',
    ViewDirectionProjectionInverse: 'uViewDirectionProjectionInverse',
    ViewPosition: 'uViewPosition',
    ViewDirection: 'uViewDirection',
    // g-buffer
    GBufferATexture: 'uGBufferATexture',
    GBufferBTexture: 'uGBufferBTexture',
    GBufferCTexture: 'uGBufferCTexture',
    GBufferDTexture: 'uGBufferDTexture',
    // shading model id
    ShadingModelId: 'uShadingModelId',
    // depth
    DepthTexture: 'uDepthTexture',
    // surface
    Metallic: 'uMetallic',
    Roughness: 'uRoughness',
    // ao
    // AmbientOcclusionTexture: "uAmbientOcclusionTexture",
    // skinning
    JointMatrices: 'uJointMatrices',
    JointTexture: 'uJointTexture',
    BoneCount: 'uBoneCount',
    JointTextureColNum: 'uJointTextureColNum',
    TotalFrameCount: 'uTotalFrameCount', // TODO: 名前変えたい
    // shadow map
    ShadowMap: 'uShadowMap',
    ShadowMapProjectionMatrix: 'uShadowMapProjectionMatrix',
    ShadowBias: 'uShadowBias',
    LightViewProjectionMatrix: 'uLightViewProjectionMatrix',
    // mainly post process
    SrcTexture: 'uSrcTexture',
    // time
    Time: 'uTime',
    // usualy post process
    TargetWidth: 'uTargetWidth',
    TargetHeight: 'uTargetHeight',
    // camera
    CameraNear: 'uNearClip',
    CameraFar: 'uFarClip',
    // cubemap
    CubeTexture: 'uCubeTexture',
    // light
    DirectionalLight: 'uDirectionalLight',
    SpotLight: 'uSpotLight',
    LightDirection: 'direction',
    LightIntensity: 'intensity',
    LightColor: 'color',
    // spot light
    LightPosition: 'position',
    LightDistance: 'distance',
    LightAttenuation: 'attenuation',
    LightConeCos: 'coneCos',
    LightPenumbraCos: 'penumbraCos',
    // font
    FontMap: 'uFontMap',
    FontTiling: 'uFontTiling',
    // skybox
    Skybox: 'uSkybox',
    RotationOffset: 'uRotationOffset', // TODO: 名前変えたい
} as const;

export type UniformName = (typeof UniformNames)[keyof typeof UniformNames];

// export const PostProcessUniformNames = {
//     TargetWidth: 'uTargetWidth',
//     TargetHeight: 'uTargetHeight',
//     CameraNear: 'uNearClip',
//     CameraFar: 'uFarClip',
// } as const;

// export type PostProcessUniformName = (typeof PostProcessUniformNames)[keyof typeof PostProcessUniformNames];

// -----------------------------------------------------------------------------
// shaders
// -----------------------------------------------------------------------------

const ShaderModifierPragmas = {
    BEGIN_MAIN: 'BEGIN_MAIN',
    END_MAIN: 'END_MAIN',
    APPEND_ATTRIBUTES: 'APPEND_ATTRIBUTES',
    APPEND_UNIFORMS: 'APPEND_UNIFORMS',
} as const;

type ShaderModifierPragmas = (typeof ShaderModifierPragmas)[keyof typeof ShaderModifierPragmas];

export const VertexShaderModifierPragmas = {
    LOCAL_POSITION_POST_PROCESS: 'LOCAL_POSITION_POST_PROCESS',
    INSTANCE_TRANSFORM_PRE_PROCESS: 'INSTANCE_TRANSFORM_PRE_PROCESS',
    WORLD_POSITION_POST_PROCESS: 'WORLD_POSITION_POST_PROCESS',
    VIEW_POSITION_POST_PROCESS: 'VIEW_POSITION_POST_PROCESS',
    OUT_CLIP_POSITION_PRE_PROCESS: 'OUT_CLIP_POSITION_PRE_PROCESS',
    ...ShaderModifierPragmas,
} as const;

export type VertexShaderModifierPragmas =
    (typeof VertexShaderModifierPragmas)[keyof typeof VertexShaderModifierPragmas];

export const FragmentShaderModifierPragmas = {
    ...ShaderModifierPragmas,
} as const;
export type FragmentShaderModifierPragmas =
    (typeof FragmentShaderModifierPragmas)[keyof typeof FragmentShaderModifierPragmas];

// TODO: key to type
export type VertexShaderModifier = {
    [key in VertexShaderModifierPragmas]?: string;
};

export type FragmentShaderModifier = {
    [key in FragmentShaderModifierPragmas]?: string;
};

export const ShaderPartialPragmas = {
    DEPTH_FUNCTIONS: 'DEPTH_FUNCTIONS',
    ENGINE_UNIFORMS: 'ENGINE_UNIFORMS',
    TRANSFORM_VERTEX_UNIFORMS: 'TRANSFORM_VERTEX_UNIFORMS',
    PSEUDO_HDR: 'PSEUDO_HDR',
} as const;

export type ShaderPartialPragmas = (typeof ShaderPartialPragmas)[keyof typeof ShaderPartialPragmas];

export const ShaderPragmas = {
    DEFINES: 'DEFINES',
    ATTRIBUTES: 'ATTRIBUTES',
    ...ShaderModifierPragmas,
    ...ShaderPartialPragmas,
} as const;

export type ShaderPragmas = (typeof ShaderPragmas)[keyof typeof ShaderPragmas];

// -----------------------------------------------------------------------------
// webgl
// -----------------------------------------------------------------------------

export const GLColorAttachment = {
    COLOR_ATTACHMENT0: 36064, // gl.COLOR_ATTACHMENT0 + 0
    COLOR_ATTACHMENT1: 36065, // gl.COLOR_ATTACHMENT0 + 1
    COLOR_ATTACHMENT2: 36066, // gl.COLOR_ATTACHMENT0 + 2
    COLOR_ATTACHMENT3: 36067, // gl.COLOR_ATTACHMENT0 + 3
    COLOR_ATTACHMENT4: 36068, // gl.COLOR_ATTACHMENT0 + 4
    COLOR_ATTACHMENT5: 36069, // gl.COLOR_ATTACHMENT0 + 5
    COLOR_ATTACHMENT6: 36070, // gl.COLOR_ATTACHMENT0 + 6
    COLOR_ATTACHMENT7: 36071, // gl.COLOR_ATTACHMENT0 + 7
} as const;

export type GLColorAttachment =
    | 36064 // gl.COLOR_ATTACHMENT0 + 0
    | 36065 // gl.COLOR_ATTACHMENT0 + 1
    | 36066 // gl.COLOR_ATTACHMENT0 + 2
    | 36067 // gl.COLOR_ATTACHMENT0 + 3
    | 36068 // gl.COLOR_ATTACHMENT0 + 4
    | 36069 // gl.COLOR_ATTACHMENT0 + 5
    | 36070 // gl.COLOR_ATTACHMENT0 + 6
    | 36071; // gl.COLOR_ATTACHMENT0 + 7

export const GLFrameBufferStatus = {
    FRAMEBUFFER_COMPLETE: 36053,
    FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
    FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
    FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
    FRAMEBUFFER_UNSUPPORTED: 36061,
} as const;

export const GLExtensionName = {
    ColorBufferFloat: 'EXT_color_buffer_float',
} as const;
