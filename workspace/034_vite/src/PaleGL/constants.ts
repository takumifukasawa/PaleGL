export const PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    LineLoop: "LineLoop",
    LineStrip: "LineStrip",
    Triangles: "Triangles",
    TriangleStrip: "TriangleStrip",
    TriangleFan: "TriangleFan",
} as const;

export type PrimitiveType = typeof PrimitiveTypes[keyof typeof PrimitiveTypes];

export const UniformTypes = {
    Matrix4: "Matrix4",
    Matrix4Array: "Matrix4Array",
    Texture: "Texture",
    CubeMap: "CubeMap",
    Vector2: "Vector2",
    Vector2Array: "Vector2Array",
    Vector3: "Vector3",
    Struct: "Struct",
    Float: "Float",
    FloatArray: "FloatArray",
    Int: "Int",
    Color: "Color",
    ColorArray: "ColorArray",
} as const;

export type UniformType = typeof UniformTypes[keyof typeof UniformTypes];

export const TextureTypes = {
    RGBA: "RGBA",
    Depth: "Depth",
    RGBA16F: "RGBA16F",
    RGBA32F: "RGBA32F"
} as const;

export type TextureType = typeof TextureTypes[keyof typeof TextureTypes];

export const TextureWrapTypes = {
    Repeat: "Repeat",
    ClampToEdge: "ClampToEdge",
} as const;

export type TextureWrapType = typeof TextureWrapTypes[keyof typeof TextureWrapTypes];

export const TextureFilterTypes = {
    Nearest: "Nearest", // min, mag
    Linear: "Linear", // min, mag
    NearestMipmapNearest: "NearestMipmapNearest", // only min filter
    NearestMipmapLinear: "NearestMipmapLinear", // only min filter,
    LinearMipmapNearest: "LinearMipmapNearest", // only min filter
    LinearMipmapLinear: "LinearMipmapLinear", // only min filter
} as const;

export type TextureFilterType = typeof TextureFilterTypes[keyof typeof TextureFilterTypes];

export const BlendTypes = {
    Opaque: "Opaque",
    Transparent: "Transparent",
    Additive: "Additive",
} as const;

export type BlendType = typeof BlendTypes[keyof typeof BlendTypes];

export const RenderQueues = {
    Skybox: 1,
    Opaque: 2,
    AlphaTest: 3,
    Transparent: 4
} as const;

export type RenderQueue = typeof RenderQueues[keyof typeof RenderQueues];

export const RenderbufferTypes = {
    Depth: "Depth",
} as const;

export type RenderbufferType = typeof RenderbufferTypes[keyof typeof RenderbufferTypes];

export const ActorTypes = {
    Null: "Null",
    Mesh: "Mesh",
    SkinnedMesh: "SkinnedMesh",
    Light: "Light",
    Skybox: "Skybox",
    Camera: "Camera",
} as const;

export type ActorType = typeof ActorTypes[keyof typeof ActorTypes];

export const CubeMapAxis = {
    PositiveX: "PositiveX",
    NegativeX: "NegativeX",
    PositiveY: "PositiveY",
    NegativeY: "NegativeY",
    PositiveZ: "PositiveZ",
    NegativeZ: "NegativeZ",
} as const;

export type CubeMapAxis = typeof CubeMapAxis[keyof typeof CubeMapAxis];

export const FaceSide = {
    Front: "Front",
    Back: "Back",
    Double: "Double"
} as const;

export type FaceSide = typeof FaceSide[keyof typeof FaceSide];

// TODO: rename Type"s"
export const AttributeUsageType = {
    StaticDraw: "StaticDraw",
    DynamicDraw: "DynamicDraw"
} as const;

export type AttributeUsageType = typeof AttributeUsageType[keyof typeof AttributeUsageType];

// export type AttributeUsageType =
// {
//     StaticDraw: "StaticDraw",
//     DynamicDraw: "DynamicDraw"
// }

export const RenderTargetTypes = {
    RGBA: "RGBA",
    Depth: "Depth",
    Empty: "Empty",
} as const;

export type RenderTargetType = typeof RenderTargetTypes[keyof typeof RenderTargetTypes];

export const AnimationKeyframeTypes = {
    Vector3: "Vector3",
    Quaternion: "Quaternion"
} as const;

export type AnimationKeyframeType = typeof AnimationKeyframeTypes[keyof typeof AnimationKeyframeTypes];

export const AttributeNames = {
    Position: "aPosition",
    Color: "aColor",
    Uv: "aUv",
    Normal: "aNormal",
    Tangent: "aTangent",
    Binormal: "aBinormal",
    // skinning
    BoneIndices: "aBoneIndices",
    BoneWeights: "aBoneWeighs",
    // instancing
    InstancePosition: "aInstancePosition",
    InstanceScale: "aInstanceScale",
    InstanceAnimationOffset: "aInstanceAnimationOffset",
    InstanceVertexColor: "aInstanceVertexColor"
} as const;

export type AttributeName = typeof AttributeNames[keyof typeof AttributeNames];

export const UniformNames = {
    // base
    WorldMatrix: "uWorldMatrix",
    ViewMatrix: "uViewMatrix",
    ProjectionMatrix: "uProjectionMatrix",
    NormalMatrix: "uNormalMatrix",
    ViewPosition: "uViewPosition",
    // skinning
    JointMatrices: "uJointMatrices",
    JointTexture: "uJointTexture",
    // shadow map
    ShadowMap: "uShadowMap",
    ShadowMapProjectionMatrix: "uShadowMapProjectionMatrix",
    ShadowBias: "uShadowBias",
    // post process
    SceneTexture: "uSceneTexture",
    // time
    Time: "uTime"
} as const;

export type UniformName = typeof UniformNames[keyof typeof UniformNames];