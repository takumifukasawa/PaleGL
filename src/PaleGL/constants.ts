export const MAX_SPOT_LIGHT_COUNT = 2;
export const MAX_POINT_LIGHT_COUNT = 1;

export const DEG_TO_RAD = Math.PI / 180;

export const RAD_TO_DEG = 180 / Math.PI;

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
    Never: 0,
    Less: 1,
    Equal: 2,
    Lequal: 3,
    Greater: 4,
    NotEqual: 5,
    Gequal: 6,
    Always: 7,
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
    Opaque: 'o',
    AlphaTest: 'a',
    Skybox: 's',
    Transparent: 't',
    AfterTone: 'at',
    Overlay: 'ol',
} as const;

export type RenderQueueType = (typeof RenderQueueType)[keyof typeof RenderQueueType];

export const RenderQueues = {
    [RenderQueueType.Opaque]: 0,
    [RenderQueueType.AlphaTest]: 1,
    [RenderQueueType.Skybox]: 2,
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
    Point: 2,
} as const;

export type LightType = (typeof LightTypes)[keyof typeof LightTypes];

export const ActorTypes = {
    Null: 0,
    Mesh: 1,
    // UiActor: 2,
    // SkinnedMesh: 2,
    Light: 2,
    Skybox: 3,
    Camera: 4,
    // TextMesh: 5,
    PostProcessVolume: 5,
    // ObjectSpaceRaymarchMesh: 7,
    // ScreenSpaceRaymarchMesh: 8,
} as const;

export type ActorType = (typeof ActorTypes)[keyof typeof ActorTypes];

export const MeshTypes = {
    Default: 0,
    Skinned: 1,
    ObjectSpaceRaymarch: 2,
    ScreenSpaceRaymarch: 3,
    Text: 4,
    // UI: 5,
    SpriteAtlas: 6,
} as const;

export type MeshType = (typeof MeshTypes)[keyof typeof MeshTypes];

export const MaterialTypes = {
    Misc: 0,
    GBuffer: 1,
    ObjectSpaceRaymarch: 2,
    ScreenSpaceRaymarch: 3,
} as const;

export type MaterialTypes = (typeof MaterialTypes)[keyof typeof MaterialTypes];

export const UIQueueTypes = {
    None: 0,
    AfterTone: 1,
    Overlay: 2,
} as const;

export type UIQueueType = (typeof UIQueueTypes)[keyof typeof UIQueueTypes];

export const UIAnchorTypes = {
    Center: 0,
} as const;

export type UIAnchorType = (typeof UIAnchorTypes)[keyof typeof UIAnchorTypes];

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
    MirroredRepeat: 2,
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
    High: 1,
} as const;

export type TextureDepthPrecisionType = (typeof TextureDepthPrecisionType)[keyof typeof TextureDepthPrecisionType];

// -----------------------------------------------------------------------------
// render target types
// -----------------------------------------------------------------------------

export const RenderTargetKinds = {
    Default: 0,
    GBuffer: 1,
    MRT: 2,
    DoubleBuffer: 3,
};

export type RenderTargetKind = (typeof RenderTargetKinds)[keyof typeof RenderTargetKinds];

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
    InstanceEmissiveColor: 'aInstanceEmissiveColor',
    InstanceVelocity: 'aInstanceVelocity',
    InstanceLookDirection: 'aLookDirection',
    InstanceState: 'aInstanceState',
    // trail
    TrailIndex: 'aTrailIndex',
} as const;

export type AttributeName = (typeof AttributeNames)[keyof typeof AttributeNames];

// -----------------------------------------------------------------------------
// post process
// -----------------------------------------------------------------------------

export const PostProcessPassType = {
    Bloom: 0,
    DepthOfField: 1,
    BufferVisualizer: 2,
    ChromaticAberration: 3,
    Glitch: 4,
    GaussianBlur: 5,
    Copy: 6,
    FXAA: 7,
    LightShaft: 8,
    DeferredShading: 9,
    ScreenSpaceShadow: 10,
    SSAO: 11,
    SSR: 12,
    Streak: 13,
    ToneMapping: 14,
    Vignette: 15,
    VolumetricLight: 16,
    Fragment: 17,
    Fog: 18,
    FragmentPass: 19,
} as const;

export type PostProcessPassType = (typeof PostProcessPassType)[keyof typeof PostProcessPassType];

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
    Vector3Array: 7,
    Vector4: 8,
    Vector4Array: 9,
    Struct: 10,
    StructArray: 11,
    Float: 12,
    FloatArray: 13,
    Int: 14,
    Color: 15,
    ColorArray: 16,
    TextureArray: 17,
    Bool: 18,
} as const;

export type UniformTypes = (typeof UniformTypes)[keyof typeof UniformTypes];

// TODO: Texture -> Map にしたい？
// TODO: objectじゃなくて単体のconst_stringにするべき
export const UniformNames = {
    // transforms
    WorldMatrix: 'uWorldMatrix',
    ViewMatrix: 'uViewMatrix',
    ProjectionMatrix: 'uProjectionMatrix',
    WVPMatrix: 'uWVPMatrix',
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
    CameraAspect: 'uAspect',
    CameraFov: 'uFov',
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
    BaseMap: 'uBaseMap',
    BaseColor: 'uBaseColor',
    BaseMapTiling: 'uBaseMapTiling',
    Metallic: 'uMetallic',
    MetallicMap: 'uMetallicMap',
    MetallicMapTiling: 'uMetallicMapTiling',
    Roughness: 'uRoughness',
    RoughnessMap: 'uRoughnessMap',
    RoughnessMapTiling: 'uRoughnessMapTiling',
    EmissiveColor: 'uEmissiveColor',
    EmissiveMap: 'uEmissiveMap',
    EmissiveMapTiling: 'uEmissiveMapTiling',
    NormalMap: 'uNormalMap',
    NormalMapTiling: 'uNormalMapTiling',
    HeightMap: 'uHeightMap',
    HeightMapTiling: 'uHeightMapTiling',
    HeightScale: 'uHeightScale',
    // ao
    // AmbientOcclusionTexture: "uAmbientOcclusionTexture",
    // skinning
    JointMatrices: 'uJointMatrices',
    JointTexture: 'uJointTexture',
    BoneCount: 'uBoneCount',
    JointTextureColNum: 'uJointTextureColNum',
    TotalFrameCount: 'uTotalFrameCount', // TODO: 名前変えたい
    // vat
    PositionMap: 'uPositionMap',
    VelocityMap: 'uVelocityMap',
    UpMap: 'uUpMap',
    // VATWidth: 'uVATWidth',
    // VATHeight: 'uVATWidth',
    VATResolution: 'uVATResolution',
    // shadow map
    // ShadowBias: 'uShadowBias',
    // LightViewProjectionMatrix: 'uLightViewProjectionMatrix',
    // time
    Time: 'uTime',
    DeltaTime: 'uDeltaTime',
    // timeline time
    TimelineTime: 'uTimelineTime',
    TimelineDeltaTime: 'uTimelineDeltaTime',
    // viewport
    Viewport: 'uViewport',
    // usualy post process
    TargetWidth: 'uTargetWidth',
    TargetHeight: 'uTargetHeight',
    Aspect: 'uAspect',
    TexelSize: 'uTexelSize',
    // cameras
    CameraNear: 'uNearClip',
    CameraFar: 'uFarClip',
    // cubemap
    CubeTexture: 'uCubeTexture',
    // light
    DirectionalLight: 'uDirectionalLight',
    SpotLight: 'uSpotLight',
    PointLight: 'uPointLight',
    LightDirection: 'direction',
    LightIntensity: 'intensity',
    LightColor: 'color',
    ShadowMap: 'shadowMap',
    // LightViewProjectionMatrix: 'lightViewProjectionMatrix',
    ShadowMapProjectionMatrix: 'shadowMapProjectionMatrix',
    ShadowBias: 'shadowBias',
    DirectionalLightShadowMap: 'uDirectionalLightShadowMap',
    SpotLightShadowMap: 'uSpotLightShadowMap',
    // spot light
    LightPosition: 'position',
    LightDistance: 'distance',
    LightAttenuation: 'attenuation',
    LightConeCos: 'coneCos',
    LightPenumbraCos: 'penumbraCos',
    SpotLightColor: 'uSpotLightColor',
    SpotLightIntensity: 'uSpotLightIntensity',
    // renderer
    SceneTexture: 'uSceneTexture',
    // ui
    // UICanvas: 'uUICanvas',
    UICharRect: 'uUICharRect',
    UIFontSize: 'uUIFontSize',
    UIAnchor: 'uUIAnchor',
    // post process
    SrcTexture: 'uSrcTexture',
    BlendRate: 'uBlendRate',
    // font
    FontMap: 'uFontMap',
    FontTiling: 'uFontTiling',
    // skybox
    Skybox: 'uSkybox',
    RotationOffset: 'uRotationOffset', // TODO: 名前変えたい
    // raymarch
    ObjectSpaceRaymarchBoundsScale: 'uBoundsScale',
    // misc
} as const;

export type UniformName = (typeof UniformNames)[keyof typeof UniformNames];

export const UniformBlockNames = {
    Common: 'ubCommon',
    Transformations: 'ubTransformations',
    Camera: 'ubCamera',
    DirectionalLight: 'ubDirectionalLight',
    SpotLight: 'ubSpotLight',
    PointLight: 'ubPointLight',
    Timeline: 'ubTimeline',
} as const;

export type UniformBlockName = (typeof UniformBlockNames)[keyof typeof UniformBlockNames];

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
    APPEND_INCLUDE: 'APPEND_INCLUDE',
    APPEND_VARYINGS: 'APPEND_VARYINGS',
    BEGIN_MAIN: 'BEGIN_MAIN',
    END_MAIN: 'END_MAIN',
    APPEND_ATTRIBUTES: 'APPEND_ATTRIBUTES',
    APPEND_UNIFORMS: 'APPEND_UNIFORMS',
    RAYMARCH_SCENE: 'RAYMARCH_SCENE',
} as const;

type ShaderModifierPragmas = (typeof ShaderModifierPragmas)[keyof typeof ShaderModifierPragmas];

export const VertexShaderModifierPragmas = {
    LOCAL_POSITION_POST_PROCESS: 'LOCAL_POSITION_POST_PROCESS',
    VERTEX_COLOR_POST_PROCESS: 'VERTEX_COLOR_POST_PROCESS',
    INSTANCE_TRANSFORM_PRE_PROCESS: 'INSTANCE_TRANSFORM_PRE_PROCESS',
    WORLD_POSITION_POST_PROCESS: 'WORLD_POSITION_POST_PROCESS',
    VIEW_POSITION_POST_PROCESS: 'VIEW_POSITION_POST_PROCESS',
    OUT_CLIP_POSITION_PRE_PROCESS: 'OUT_CLIP_POSITION_PRE_PROCESS',
    ...ShaderModifierPragmas,
} as const;

export type VertexShaderModifierPragmas =
    (typeof VertexShaderModifierPragmas)[keyof typeof VertexShaderModifierPragmas];

export const FragmentShaderModifierPragmas = {
    BLOCK_BEFORE_RAYMARCH_CONTENT: 'BLOCK_BEFORE_RAYMARCH_CONTENT',
    BEFORE_OUT: 'BEFORE_OUT',
    AFTER_OUT: 'AFTER_OUT',
    ...ShaderModifierPragmas,
} as const;
export type FragmentShaderModifierPragmas =
    (typeof FragmentShaderModifierPragmas)[keyof typeof FragmentShaderModifierPragmas];

// TODO: key to type
export type VertexShaderModifiers = { pragma: VertexShaderModifierPragmas; value: string }[];

export type FragmentShaderModifiers = { pragma: FragmentShaderModifierPragmas; value: string }[];

export type DepthFragmentShaderModifiers = { pragma: FragmentShaderModifierPragmas; value: string }[];

export const ShaderPartialPragmas = {
    // ENGINE_UNIFORMS: 'ENGINE_UNIFORMS',
    // TRANSFORM_VERTEX_UNIFORMS: 'TRANSFORM_VERTEX_UNIFORMS',
    // CAMERA_UNIFORMS: 'CAMERA_UNIFORMS',
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

// export const GLColorAttachment = {
//     COLOR_ATTACHMENT0: 36064, // gl.COLOR_ATTACHMENT0 + 0
//     COLOR_ATTACHMENT1: 36065, // gl.COLOR_ATTACHMENT0 + 1
//     COLOR_ATTACHMENT2: 36066, // gl.COLOR_ATTACHMENT0 + 2
//     COLOR_ATTACHMENT3: 36067, // gl.COLOR_ATTACHMENT0 + 3
//     COLOR_ATTACHMENT4: 36068, // gl.COLOR_ATTACHMENT0 + 4
//     COLOR_ATTACHMENT5: 36069, // gl.COLOR_ATTACHMENT0 + 5
//     COLOR_ATTACHMENT6: 36070, // gl.COLOR_ATTACHMENT0 + 6
//     COLOR_ATTACHMENT7: 36071, // gl.COLOR_ATTACHMENT0 + 7
// } as const;
//
// export type GLColorAttachment =
//     | 36064 // gl.COLOR_ATTACHMENT0 + 0
//     | 36065 // gl.COLOR_ATTACHMENT0 + 1
//     | 36066 // gl.COLOR_ATTACHMENT0 + 2
//     | 36067 // gl.COLOR_ATTACHMENT0 + 3
//     | 36068 // gl.COLOR_ATTACHMENT0 + 4
//     | 36069 // gl.COLOR_ATTACHMENT0 + 5
//     | 36070 // gl.COLOR_ATTACHMENT0 + 6
//     | 36071; // gl.COLOR_ATTACHMENT0 + 7
//
// export const GLFrameBufferStatus = {
//     FRAMEBUFFER_COMPLETE: 36053,
//     FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
//     FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
//     FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
//     FRAMEBUFFER_UNSUPPORTED: 36061,
// } as const;
//
// export const GLExtensionName = {
//     ColorBufferFloat: 'EXT_color_buffer_float',
// } as const;
//
// export const GL = {
//     TEXTURE_2D: 3553,
// } as const;
//
// export type GL = (typeof GL)[keyof typeof GL];
//
// export const GLTextureFilterType = {
//     TEXTURE_MIN_FILTER: 10241,
//     TEXTURE_MAG_FILTER: 10240
// } as const;
//
// export type GLTextureFilterType = (typeof GLTextureFilterType)[keyof typeof GLTextureFilterType];
//
// export const GLTextureFilter = {
//     NEAREST: 9728,
//     LINEAR: 9729,
//     NEAREST_MIPMAP_NEAREST: 9984,
//     NEAREST_MIPMAP_LINEAR: 9986,
//     LINEAR_MIPMAP_NEAREST: 9985,
//     LINEAR_MIPMAP_LINEAR: 9987,
// } as const;
//
// export type GLTextureFilter = (typeof GLTextureFilter)[keyof typeof GLTextureFilter];
//
// export const GLTextureWrap = {
//     REPEAT: 10497,
//     CLAMP_TO_EDGE: 33071,
//     MIRRORED_REPEAT: 33648,
// } as const;
//
// export type GLTextureWrap = (typeof GLTextureWrap)[keyof typeof GLTextureWrap];

// ---

export const GL_EXT_color_buffer_float = 'EXT_color_buffer_float';

export const GL_TEXTURE_2D = 3553;
export const GL_TEXTURE_CUBE_MAP = 34067;

export const GL_TEXTURE0 = 33984;

export const GL_FRAMEBUFFER = 36160;

export const GL_DEPTH_BUFFER_BIT = 256;

export const GL_COLOR_BUFFER_BIT = 16384;

export const GL_POINTS = 0;
export const GL_LINES = 1;
export const GL_LINE_LOOP = 2;
export const GL_LINE_STRIP = 3;
export const GL_TRIANGLES = 4;

export const GL_RASTERIZER_DISCARD = 35977;

export const GL_TRANSFORM_FEEDBACK = 36386;
export const GL_TRANSFORM_FEEDBACK_BUFFER = 35982;

export const GL_CULL_FACE = 2884;
export const GL_BACK = 1029;
export const GL_CCW = 2305;
export const GL_FRONT = 1028;
export const GL_NEVER = 512;
export const GL_LESS = 513;
export const GL_EQUAL = 514;
export const GL_LEQUAL = 515;
export const GL_GREATER = 516;
export const GL_NOTEQUAL = 517;
export const GL_GEQUAL = 518;
export const GL_ALWAYS = 519;
export const GL_DEPTH_TEST = 2929;

export const GL_BLEND = 3042;
export const GL_SRC_ALPHA = 770;
export const GL_ONE_MINUS_SRC_ALPHA = 771;
export const GL_ONE = 1;

export const GL_UNSIGNED_SHORT = 5123;

export const GL_UNIFORM_OFFSET = 35387;

export const GL_STATIC_DRAW = 35044;
export const GL_DYNAMIC_DRAW = 35048;
export const GL_DYNAMIC_COPY = 35050;

export const GL_UNIFORM_BLOCK_DATA_SIZE = 35392;

export const GL_ARRAY_BUFFER = 34962;

export const GL_FLOAT = 5126;

export const GL_RGBA = 6408;

export const GL_RGBA32F = 34836;

export const GL_RED = 6403;

export const GL_R16F = 33325;

export const GL_R11F_G11F_B10F = 35898;

export const GL_RGB = 6407;

export const GL_RGBA16F = 34842;

export const GL_DEPTH_COMPONENT = 6402;

export const GL_DEPTH_COMPONENT32F = 36012;
export const GL_DEPTH_COMPONENT16 = 33189;

export const GL_UNSIGNED_BYTE = 5121;

export const GL_UNPACK_FLIP_Y_WEBGL = 37440;

export const GL_DEPTH_ATTACHMENT = 36096;

export const GL_RENDERBUFFER = 36161;

export const GL_READ_FRAMEBUFFER = 36008;
export const GL_DRAW_FRAMEBUFFER = 36009;

export const GL_ELEMENT_ARRAY_BUFFER = 34963;

export const GL_UNIFORM_BUFFER = 35345;

export const GL_VERTEX_SHADER = 35633;
export const GL_FRAGMENT_SHADER = 35632;
export const GL_SEPARATE_ATTRIBS = 35981;

export const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;

// filter -----------------------------------

export const GL_TEXTURE_MIN_FILTER = 10241;
export const GL_TEXTURE_MAG_FILTER = 10240;

// export const GL_NEAREST = 9728;
// export const GL_LINEAR = 9729;
// export const GL_NEAREST_MIPMAP_NEAREST = 9984;
// export const GL_NEAREST_MIPMAP_LINEAR = 9986;
// export const GL_LINEAR_MIPMAP_NEAREST = 9985;
// export const GL_LINEAR_MIPMAP_LINEAR = 9987;

export const GLTextureFilter = {
    NEAREST: 9728,
    LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984,
    NEAREST_MIPMAP_LINEAR: 9986,
    LINEAR_MIPMAP_NEAREST: 9985,
    LINEAR_MIPMAP_LINEAR: 9987,
} as const;
export type GLTextureFilter = (typeof GLTextureFilter)[keyof typeof GLTextureFilter];

// wrap -----------------------------------

export const GL_TEXTURE_WRAP_S = 10242;
export const GL_TEXTURE_WRAP_T = 10243;
// export const GL_REPEAT = 10497;
// export const GL_CLAMP_TO_EDGE = 33071;
// export const GL_MIRRORED_REPEAT = 33648;

export const GLTextureWrap = {
    REPEAT: 10497,
    CLAMP_TO_EDGE: 33071,
    MIRRORED_REPEAT: 33648,
} as const;
export type GLTextureWrap = (typeof GLTextureWrap)[keyof typeof GLTextureWrap];

// framebuffer -----------------------------------

export const GL_FRAMEBUFFER_COMPLETE = 36053;
export const GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
export const GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
export const GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
export const GL_FRAMEBUFFER_UNSUPPORTED = 36061;

// export const GL_COLOR_ATTACHMENT0 = 36064;
// export const GL_COLOR_ATTACHMENT1 = 36065;
// export const GL_COLOR_ATTACHMENT2 = 36066;
// export const GL_COLOR_ATTACHMENT3 = 36067;
// export const GL_COLOR_ATTACHMENT4 = 36068;
// export const GL_COLOR_ATTACHMENT5 = 36069;
// export const GL_COLOR_ATTACHMENT6 = 36070;
// export const GL_COLOR_ATTACHMENT7 = 36071;

export const GLColorAttachment = {
    COLOR_ATTACHMENT0: 36064,
    COLOR_ATTACHMENT1: 36065,
    COLOR_ATTACHMENT2: 36066,
    COLOR_ATTACHMENT3: 36067,
    COLOR_ATTACHMENT4: 36068,
    COLOR_ATTACHMENT5: 36069,
    COLOR_ATTACHMENT6: 36070,
    COLOR_ATTACHMENT7: 36071,
} as const;
export type GLColorAttachment = (typeof GLColorAttachment)[keyof typeof GLColorAttachment];

export const GLColorAttachments = [
    GLColorAttachment.COLOR_ATTACHMENT0,
    GLColorAttachment.COLOR_ATTACHMENT1,
    GLColorAttachment.COLOR_ATTACHMENT2,
    GLColorAttachment.COLOR_ATTACHMENT3,
    GLColorAttachment.COLOR_ATTACHMENT4,
    GLColorAttachment.COLOR_ATTACHMENT5,
    GLColorAttachment.COLOR_ATTACHMENT6,
    GLColorAttachment.COLOR_ATTACHMENT7,
];

// --

// export const PRAGMA_RAYMARCH_SCENE = '#pragma RAYMARCH_SCENE';
export const PRAGMA_RAYMARCH_SCENE = 'RAYMARCH_SCENE';
