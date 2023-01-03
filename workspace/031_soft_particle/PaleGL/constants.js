export const PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    LineLoop: "LineLoop",
    LineStrip: "LineStrip",
    Triangles: "Triangles",
    TriangleStrip: "TriangleStrip",
    TriangleFan: "TriangleFan",
};

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
};

export const TextureTypes = {
    RGBA: "RGBA",
    Depth: "Depth",
    RGBA16F: "RGBA16F",
    RGBA32F: "RGBA32F"
};

export const TextureWrapTypes = {
    Repeat: "Repeat",
    ClampToEdge: "ClampToEdge",
};

export const TextureFilterTypes = {
    Nearest: "Nearest", // min, mag
    Linear: "Linear", // min, mag
    NearestMipmapNearest: "NearestMipmapNearest", // only min filter
    NearestMipmapLinear: "NearestMipmapLinear", // only min filter,
    LinearMipmapNearest: "LinearMipmapNearest", // only min filter
    LinearMipmapLinear: "LinearMipmapLinear", // only min filter
};

export const BlendTypes = {
    Opaque: "Opaque",
    Transparent: "Transparent",
    Additive: "Additive",
};

export const RenderQueues = {
    Skybox: 1,
    Opaque: 2,
    AlphaTest: 3,
    Transparent: 4
};

export const RenderbufferTypes = {
    Depth: "Depth",
};

export const ActorTypes = {
    Null: "Null",
    Mesh: "Mesh",
    SkinnedMesh: "SkinnedMesh",
    Light: "Light",
    Skybox: "Skybox",
    Camera: "Camera",
};

export const CubeMapAxis = {
    PositiveX: "PositiveX",
    NegativeX: "NegativeX",
    PositiveY: "PositiveY",
    NegativeY: "NegativeY",
    PositiveZ: "PositiveZ",
    NegativeZ: "NegativeZ",
};

export const FaceSide = {
    Front: "Front",
    Back: "Back",
    Double: "Double"
};

// TODO: rename Type"s"
export const AttributeUsageType = {
    StaticDraw: "StaticDraw",
    DynamicDraw: "DynamicDraw"
};

export const RenderTargetTypes = {
    RGBA: "RGBA",
    Depth: "Depth"
};

export const AnimationKeyframeTypes = {
    Vector3: "Vector3",
    Quaternion: "Quaternion"
};

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
};

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
    SceneTexture: "uSceneTexture"
};