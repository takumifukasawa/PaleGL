// -----------------------------------------------------------------------------
// engine
// -----------------------------------------------------------------------------

export const PrimitiveTypes = {
    Points: 'Points',
    Lines: 'Lines',
    LineLoop: 'LineLoop',
    LineStrip: 'LineStrip',
    Triangles: 'Triangles',
    TriangleStrip: 'TriangleStrip',
    TriangleFan: 'TriangleFan',
} as const;

export type PrimitiveType = (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes];

export const UniformTypes = {
    Matrix4: 'Matrix4',
    Matrix4Array: 'Matrix4Array',
    Texture: 'Texture',
    CubeMap: 'CubeMap',
    Vector2: 'Vector2',
    Vector2Array: 'Vector2Array',
    Vector3: 'Vector3',
    Struct: 'Struct',
    Float: 'Float',
    FloatArray: 'FloatArray',
    Int: 'Int',
    Color: 'Color',
    ColorArray: 'ColorArray',
} as const;

export type UniformType = (typeof UniformTypes)[keyof typeof UniformTypes];

export const TextureTypes = {
    RGBA: 'RGBA',
    Depth: 'Depth',
    RGBA16F: 'RGBA16F',
    RGBA32F: 'RGBA32F',
} as const;

export type TextureType = (typeof TextureTypes)[keyof typeof TextureTypes];

export const TextureWrapTypes = {
    Repeat: 'Repeat',
    ClampToEdge: 'ClampToEdge',
} as const;

export type TextureWrapType = (typeof TextureWrapTypes)[keyof typeof TextureWrapTypes];

export const TextureFilterTypes = {
    Nearest: 'Nearest', // min, mag
    Linear: 'Linear', // min, mag
    NearestMipmapNearest: 'NearestMipmapNearest', // only min filter
    NearestMipmapLinear: 'NearestMipmapLinear', // only min filter,
    LinearMipmapNearest: 'LinearMipmapNearest', // only min filter
    LinearMipmapLinear: 'LinearMipmapLinear', // only min filter
} as const;

export type TextureFilterType = (typeof TextureFilterTypes)[keyof typeof TextureFilterTypes];

export const BlendTypes = {
    Opaque: 'Opaque',
    Transparent: 'Transparent',
    Additive: 'Additive',
} as const;

export type BlendType = (typeof BlendTypes)[keyof typeof BlendTypes];

export const RenderQueueType = {
    Skybox: 'Skybox',
    Opaque: 'Opaque',
    AlphaTest: 'AlphaTest',
    Transparent: 'Transparent',
} as const;

export type RenderQueueType = (typeof RenderQueueType)[keyof typeof RenderQueueType];

export const RenderQueues = {
    [RenderQueueType.Skybox]: 1,
    [RenderQueueType.Opaque]: 2,
    [RenderQueueType.AlphaTest]: 3,
    [RenderQueueType.Transparent]: 4,
} as const;

export type RenderQueue = (typeof RenderQueues)[keyof typeof RenderQueues];

export const RenderbufferTypes = {
    Depth: 'Depth',
} as const;

export type RenderbufferType = (typeof RenderbufferTypes)[keyof typeof RenderbufferTypes];

export const ActorTypes = {
    Null: 'Null',
    Mesh: 'Mesh',
    SkinnedMesh: 'SkinnedMesh',
    Light: 'Light',
    Skybox: 'Skybox',
    Camera: 'Camera',
} as const;

export type ActorType = (typeof ActorTypes)[keyof typeof ActorTypes];

export const CameraTypes = {
    Perspective: 'Perspective',
    Orthographic: 'Orthographic',
} as const;

export type CameraType = (typeof CameraTypes)[keyof typeof CameraTypes];

export const CubeMapAxis = {
    PositiveX: 'PositiveX',
    NegativeX: 'NegativeX',
    PositiveY: 'PositiveY',
    NegativeY: 'NegativeY',
    PositiveZ: 'PositiveZ',
    NegativeZ: 'NegativeZ',
} as const;

export type CubeMapAxis = (typeof CubeMapAxis)[keyof typeof CubeMapAxis];

export const FaceSide = {
    Front: 'Front',
    Back: 'Back',
    Double: 'Double',
} as const;

export type FaceSide = (typeof FaceSide)[keyof typeof FaceSide];

// TODO: rename Type"s"
export const AttributeUsageType = {
    StaticDraw: 'StaticDraw',
    DynamicDraw: 'DynamicDraw',
} as const;

export type AttributeUsageType = (typeof AttributeUsageType)[keyof typeof AttributeUsageType];

// export type AttributeUsageType =
// {
//     StaticDraw: "StaticDraw",
//     DynamicDraw: "DynamicDraw"
// }

export const RenderTargetTypes = {
    RGBA: 'RGBA',
    Depth: 'Depth',
    Empty: 'Empty',
} as const;

export type RenderTargetType = (typeof RenderTargetTypes)[keyof typeof RenderTargetTypes];

export const AnimationKeyframeTypes = {
    Vector3: 'Vector3',
    Quaternion: 'Quaternion',
} as const;

export type AnimationKeyframeType = (typeof AnimationKeyframeTypes)[keyof typeof AnimationKeyframeTypes];

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
    InstanceAnimationOffset: 'aInstanceAnimationOffset',
    InstanceVertexColor: 'aInstanceVertexColor',
} as const;

export type AttributeName = (typeof AttributeNames)[keyof typeof AttributeNames];

export const UniformNames = {
    // position
    ViewPosition: 'uViewPosition',
    // matrices
    WorldMatrix: 'uWorldMatrix',
    ViewMatrix: 'uViewMatrix',
    ProjectionMatrix: 'uProjectionMatrix',
    NormalMatrix: 'uNormalMatrix',
    InverseViewProjectionMatrix: 'uInverseViewProjectionMatrix',
    InverseProjectionMatrix: 'uInverseProjectionMatrix',
    TransposeInverseViewMatrix: 'uTransposeInverseViewMatrix',
    // g-buffer
    GBufferBaseColorTexture: 'uBaseColorTexture',
    GBufferNormalTexture: 'uNormalTexture',
    DepthTexture: 'uDepthTexture',
    // skinning
    JointMatrices: 'uJointMatrices',
    JointTexture: 'uJointTexture',
    // shadow map
    ShadowMap: 'uShadowMap',
    ShadowMapProjectionMatrix: 'uShadowMapProjectionMatrix',
    ShadowBias: 'uShadowBias',
    // mainly post process
    SrcTexture: 'uSrcTexture',
    // time
    Time: 'uTime',
    // usualily post process
    TargetWidth: 'uTargetWidth',
    TargetHeight: 'uTargetHeight',
    // camera
    CameraNear: 'uNearClip',
    CameraFar: 'uFarClip',
    // light
    DirectionalLight: "uDirectionalLight",
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
} as const;

type ShaderModifierPragmas = (typeof ShaderModifierPragmas)[keyof typeof ShaderModifierPragmas];

export const VertexShaderModifierPragmas = {
    LOCAL_POSITION_POST_PROCESS: 'LOCAL_POSITION_POST_PROCESS',
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
