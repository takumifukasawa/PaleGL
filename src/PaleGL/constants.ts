export const MAX_SPOT_LIGHT_COUNT = 2;

export const MAX_POINT_LIGHT_COUNT = 1;

export const DEG_TO_RAD = Math.PI / 180;

export const RAD_TO_DEG = 180 / Math.PI;

// -----------------------------------------------------------------------------
// engine
// TODO: const assertion の連番、自動で作ることはできない？ union型でいい感じにするしかない？
// TODO: ビルド最適化のために一個一個exportする
// -----------------------------------------------------------------------------

export const PRIMITIVE_TYPE_POINTS = 0;
export const PRIMITIVE_TYPE_LINES = 1;
export const PRIMITIVE_TYPE_LINE_LOOP = 2;
export const PRIMITIVE_TYPE_LINE_STRIP = 3;
export const PRIMITIVE_TYPE_TRIANGLES = 4;
export const PRIMITIVE_TYPE_TRIANGLE_STRIP = 5;
export const PRIMITIVE_TYPE_TRIANGLE_FAN = 6;

export type PrimitiveType = typeof PRIMITIVE_TYPE_POINTS | typeof PRIMITIVE_TYPE_LINES | typeof PRIMITIVE_TYPE_LINE_LOOP | typeof PRIMITIVE_TYPE_LINE_STRIP | typeof PRIMITIVE_TYPE_TRIANGLES | typeof PRIMITIVE_TYPE_TRIANGLE_STRIP | typeof PRIMITIVE_TYPE_TRIANGLE_FAN;

export const SHADING_MODEL_ID_LIT = 1;
export const SHADING_MODEL_ID_UNLIT = 2;
export const SHADING_MODEL_ID_SKYBOX = 3;

export type ShadingModelIds = typeof SHADING_MODEL_ID_LIT | typeof SHADING_MODEL_ID_UNLIT | typeof SHADING_MODEL_ID_SKYBOX;

export const DEPTH_FUNC_TYPE_NEVER = 0;
export const DEPTH_FUNC_TYPE_LESS = 1;
export const DEPTH_FUNC_TYPE_EQUAL = 2;
export const DEPTH_FUNC_TYPE_LEQUAL = 3;
export const DEPTH_FUNC_TYPE_GREATER = 4;
export const DEPTH_FUNC_TYPE_NOT_EQUAL = 5;
export const DEPTH_FUNC_TYPE_GEQUAL = 6;
export const DEPTH_FUNC_TYPE_ALWAYS = 7;

export type DepthFuncType = typeof DEPTH_FUNC_TYPE_NEVER | typeof DEPTH_FUNC_TYPE_LESS | typeof DEPTH_FUNC_TYPE_EQUAL | typeof DEPTH_FUNC_TYPE_LEQUAL | typeof DEPTH_FUNC_TYPE_GREATER | typeof DEPTH_FUNC_TYPE_NOT_EQUAL | typeof DEPTH_FUNC_TYPE_GEQUAL | typeof DEPTH_FUNC_TYPE_ALWAYS;

export const BLEND_TYPE_OPAQUE = 0;
export const BLEND_TYPE_TRANSPARENT = 1;
export const BLEND_TYPE_ADDITIVE = 2;

export type BlendType = typeof BLEND_TYPE_OPAQUE | typeof BLEND_TYPE_TRANSPARENT | typeof BLEND_TYPE_ADDITIVE;

// TransformFeedback: 'TransformFeedback',
export const RENDER_QUEUE_TYPE_OPAQUE = 'o';
export const RENDER_QUEUE_TYPE_ALPHA_TEST = 'a';
export const RENDER_QUEUE_TYPE_SKYBOX = 's';
export const RENDER_QUEUE_TYPE_TRANSPARENT = 't';
export const RENDER_QUEUE_TYPE_AFTER_TONE = 'at';
export const RENDER_QUEUE_TYPE_OVERLAY = 'ol';

export type RenderQueueType = typeof RENDER_QUEUE_TYPE_OPAQUE | typeof RENDER_QUEUE_TYPE_ALPHA_TEST | typeof RENDER_QUEUE_TYPE_SKYBOX | typeof RENDER_QUEUE_TYPE_TRANSPARENT | typeof RENDER_QUEUE_TYPE_AFTER_TONE | typeof RENDER_QUEUE_TYPE_OVERLAY;

export const RENDER_QUEUE_OPAQUE = 0;
export const RENDER_QUEUE_ALPHA_TEST = 1;
export const RENDER_QUEUE_SKYBOX = 2;
export const RENDER_QUEUE_TRANSPARENT = 3;

export type RenderQueue = typeof RENDER_QUEUE_OPAQUE | typeof RENDER_QUEUE_ALPHA_TEST | typeof RENDER_QUEUE_SKYBOX | typeof RENDER_QUEUE_TRANSPARENT;

export const RENDERBUFFER_TYPE_DEPTH = 0;

export type RenderbufferType = typeof RENDERBUFFER_TYPE_DEPTH;

export const LIGHT_TYPE_DIRECTIONAL = 0;
export const LIGHT_TYPE_SPOT = 1;
export const LIGHT_TYPE_POINT = 2;

export type LightType = typeof LIGHT_TYPE_DIRECTIONAL | typeof LIGHT_TYPE_SPOT | typeof LIGHT_TYPE_POINT;

export const ACTOR_TYPE_NULL = 0;
export const ACTOR_TYPE_MESH = 1;
// UiActor: 2,
// SkinnedMesh: 2,
export const ACTOR_TYPE_LIGHT = 2;
export const ACTOR_TYPE_SKYBOX = 3;
export const ACTOR_TYPE_CAMERA = 4;
// TextMesh: 5,
export const ACTOR_TYPE_POST_PROCESS_VOLUME = 5;
// ObjectSpaceRaymarchMesh: 7,
// ScreenSpaceRaymarchMesh: 8,

export type ActorType = typeof ACTOR_TYPE_NULL | typeof ACTOR_TYPE_MESH | typeof ACTOR_TYPE_LIGHT | typeof ACTOR_TYPE_SKYBOX | typeof ACTOR_TYPE_CAMERA | typeof ACTOR_TYPE_POST_PROCESS_VOLUME;

export const MESH_TYPE_DEFAULT = 0;
export const MESH_TYPE_SKINNED = 1;
export const MESH_TYPE_OBJECT_SPACE_RAYMARCH = 2;
export const MESH_TYPE_SCREEN_SPACE_RAYMARCH = 3;
export const MESH_TYPE_TEXT = 4;
// UI: 5,
export const MESH_TYPE_SPRITE_ATLAS = 6;

export type MeshType = typeof MESH_TYPE_DEFAULT | typeof MESH_TYPE_SKINNED | typeof MESH_TYPE_OBJECT_SPACE_RAYMARCH | typeof MESH_TYPE_SCREEN_SPACE_RAYMARCH | typeof MESH_TYPE_TEXT | typeof MESH_TYPE_SPRITE_ATLAS;

export const MATERIAL_TYPE_MISC = 0;
export const MATERIAL_TYPE_G_BUFFER = 1;
export const MATERIAL_TYPE_UNLIT = 2;
export const MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH = 3;
export const MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH = 4;

export type MaterialType = typeof MATERIAL_TYPE_MISC | typeof MATERIAL_TYPE_G_BUFFER | typeof MATERIAL_TYPE_UNLIT | typeof MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH | typeof MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH;

export const UI_QUEUE_TYPE_NONE = 0;
export const UI_QUEUE_TYPE_AFTER_TONE = 1;
export const UI_QUEUE_TYPE_OVERLAY = 2;

export type UIQueueType = typeof UI_QUEUE_TYPE_NONE | typeof UI_QUEUE_TYPE_AFTER_TONE | typeof UI_QUEUE_TYPE_OVERLAY;

export const UI_ANCHOR_TYPE_CENTER = 0;

export type UIAnchorType = typeof UI_ANCHOR_TYPE_CENTER;

export const CAMERA_TYPE_PERSPECTIVE = 0;
export const CAMERA_TYPE_ORTHOGRAPHIC = 1;

export type CameraType = typeof CAMERA_TYPE_PERSPECTIVE | typeof CAMERA_TYPE_ORTHOGRAPHIC;

export const CUBE_MAP_AXIS_POSITIVE_X = 0;
export const CUBE_MAP_AXIS_NEGATIVE_X = 1;
export const CUBE_MAP_AXIS_POSITIVE_Y = 2;
export const CUBE_MAP_AXIS_NEGATIVE_Y = 3;
export const CUBE_MAP_AXIS_POSITIVE_Z = 4;
export const CUBE_MAP_AXIS_NEGATIVE_Z = 5;

export type CubeMapAxis = typeof CUBE_MAP_AXIS_POSITIVE_X | typeof CUBE_MAP_AXIS_NEGATIVE_X | typeof CUBE_MAP_AXIS_POSITIVE_Y | typeof CUBE_MAP_AXIS_NEGATIVE_Y | typeof CUBE_MAP_AXIS_POSITIVE_Z | typeof CUBE_MAP_AXIS_NEGATIVE_Z;

export const FACE_SIDE_FRONT = 0;
export const FACE_SIDE_BACK = 1;
export const FACE_SIDE_DOUBLE = 2;

export type FaceSide = typeof FACE_SIDE_FRONT | typeof FACE_SIDE_BACK | typeof FACE_SIDE_DOUBLE;

// export type AttributeUsageType =
// {
//     StaticDraw: "StaticDraw",
//     DynamicDraw: "DynamicDraw"
// }

// -----------------------------------------------------------------------------
// texture
// -----------------------------------------------------------------------------

export const TEXTURE_TYPE_RGBA = 0;
export const TEXTURE_TYPE_DEPTH = 1;
export const TEXTURE_TYPE_RGBA16F = 2;
export const TEXTURE_TYPE_RGBA32F = 3;
export const TEXTURE_TYPE_R11F_G11F_B10F = 4;
export const TEXTURE_TYPE_R16F = 5;

export type TextureType = typeof TEXTURE_TYPE_RGBA | typeof TEXTURE_TYPE_DEPTH | typeof TEXTURE_TYPE_RGBA16F | typeof TEXTURE_TYPE_RGBA32F | typeof TEXTURE_TYPE_R11F_G11F_B10F | typeof TEXTURE_TYPE_R16F;

export const TEXTURE_WRAP_TYPE_REPEAT = 0;
export const TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE = 1;
export const TEXTURE_WRAP_TYPE_MIRRORED_REPEAT = 2;

export type TextureWrapType = typeof TEXTURE_WRAP_TYPE_REPEAT | typeof TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE | typeof TEXTURE_WRAP_TYPE_MIRRORED_REPEAT;

export const TEXTURE_FILTER_TYPE_NEAREST = 0; // min, mag
export const TEXTURE_FILTER_TYPE_LINEAR = 1; // min, mag
export const TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_NEAREST = 2; // only min filter
export const TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_LINEAR = 3; // only min filter,
export const TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_NEAREST = 4; // only min filter
export const TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_LINEAR = 5; // only min filter

export type TextureFilterType = typeof TEXTURE_FILTER_TYPE_NEAREST | typeof TEXTURE_FILTER_TYPE_LINEAR | typeof TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_NEAREST | typeof TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_LINEAR | typeof TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_NEAREST | typeof TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_LINEAR;

export const TEXTURE_DEPTH_PRECISION_TYPE_MEDIUM = 0;
export const TEXTURE_DEPTH_PRECISION_TYPE_HIGH = 1;

export type TextureDepthPrecisionType = typeof TEXTURE_DEPTH_PRECISION_TYPE_MEDIUM | typeof TEXTURE_DEPTH_PRECISION_TYPE_HIGH;

// -----------------------------------------------------------------------------
// render target types
// -----------------------------------------------------------------------------

export const RENDER_TARGET_KIND_DEFAULT = 0;
export const RENDER_TARGET_KIND_G_BUFFER = 1;
export const RENDER_TARGET_KIND_MRT = 2;
export const RENDER_TARGET_KIND_DOUBLE_BUFFER = 3;

export type RenderTargetKind = typeof RENDER_TARGET_KIND_DEFAULT | typeof RENDER_TARGET_KIND_G_BUFFER | typeof RENDER_TARGET_KIND_MRT | typeof RENDER_TARGET_KIND_DOUBLE_BUFFER;

export const RENDER_TARGET_TYPE_RGBA = 0;
export const RENDER_TARGET_TYPE_DEPTH = 1;
export const RENDER_TARGET_TYPE_EMPTY = 2;
export const RENDER_TARGET_TYPE_RGBA16F = 3;
export const RENDER_TARGET_TYPE_R11F_G11F_B10F = 4;
export const RENDER_TARGET_TYPE_R16F = 5;

export type RenderTargetType = typeof RENDER_TARGET_TYPE_RGBA | typeof RENDER_TARGET_TYPE_DEPTH | typeof RENDER_TARGET_TYPE_EMPTY | typeof RENDER_TARGET_TYPE_RGBA16F | typeof RENDER_TARGET_TYPE_R11F_G11F_B10F | typeof RENDER_TARGET_TYPE_R16F;

// -----------------------------------------------------------------------------
// animation keyframes
// -----------------------------------------------------------------------------

export const ANIMATION_KEYFRAME_TYPE_VECTOR3 = 0;
export const ANIMATION_KEYFRAME_TYPE_QUATERNION = 1;

export type AnimationKeyframeType = typeof ANIMATION_KEYFRAME_TYPE_VECTOR3 | typeof ANIMATION_KEYFRAME_TYPE_QUATERNION;

// -----------------------------------------------------------------------------
// geometry attributes
// -----------------------------------------------------------------------------

export const ATTRIBUTE_USAGE_TYPE_STATIC_DRAW = 0;
export const ATTRIBUTE_USAGE_TYPE_DYNAMIC_DRAW = 1;
export const ATTRIBUTE_USAGE_TYPE_DYNAMIC_COPY = 2;

export type AttributeUsageType = typeof ATTRIBUTE_USAGE_TYPE_STATIC_DRAW | typeof ATTRIBUTE_USAGE_TYPE_DYNAMIC_DRAW | typeof ATTRIBUTE_USAGE_TYPE_DYNAMIC_COPY;

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

export const UNIFORM_TYPE_MATRIX4 = 0;
export const UNIFORM_TYPE_MATRIX4_ARRAY = 1;
export const UNIFORM_TYPE_TEXTURE = 2;
export const UNIFORM_TYPE_CUBE_MAP = 3;
export const UNIFORM_TYPE_VECTOR2 = 4;
export const UNIFORM_TYPE_VECTOR2_ARRAY = 5;
export const UNIFORM_TYPE_VECTOR3 = 6;
export const UNIFORM_TYPE_VECTOR3_ARRAY = 7;
export const UNIFORM_TYPE_VECTOR4 = 8;
export const UNIFORM_TYPE_VECTOR4_ARRAY = 9;
export const UNIFORM_TYPE_STRUCT = 10;
export const UNIFORM_TYPE_STRUCT_ARRAY = 11;
export const UNIFORM_TYPE_FLOAT = 12;
export const UNIFORM_TYPE_FLOAT_ARRAY = 13;
export const UNIFORM_TYPE_INT = 14;
export const UNIFORM_TYPE_COLOR = 15;
export const UNIFORM_TYPE_COLOR_ARRAY = 16;
export const UNIFORM_TYPE_TEXTURE_ARRAY = 17;
export const UNIFORM_TYPE_BOOL = 18;

export type UniformTypes =
    | typeof UNIFORM_TYPE_MATRIX4
    | typeof UNIFORM_TYPE_MATRIX4_ARRAY
    | typeof UNIFORM_TYPE_TEXTURE
    | typeof UNIFORM_TYPE_CUBE_MAP
    | typeof UNIFORM_TYPE_VECTOR2
    | typeof UNIFORM_TYPE_VECTOR2_ARRAY
    | typeof UNIFORM_TYPE_VECTOR3
    | typeof UNIFORM_TYPE_VECTOR3_ARRAY
    | typeof UNIFORM_TYPE_VECTOR4
    | typeof UNIFORM_TYPE_VECTOR4_ARRAY
    | typeof UNIFORM_TYPE_STRUCT
    | typeof UNIFORM_TYPE_STRUCT_ARRAY
    | typeof UNIFORM_TYPE_FLOAT
    | typeof UNIFORM_TYPE_FLOAT_ARRAY
    | typeof UNIFORM_TYPE_INT
    | typeof UNIFORM_TYPE_COLOR
    | typeof UNIFORM_TYPE_COLOR_ARRAY
    | typeof UNIFORM_TYPE_TEXTURE_ARRAY
    | typeof UNIFORM_TYPE_BOOL;

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
    // effect texture
    GridSize: 'uGridSize',
    Octaves: 'uOctaves',
    Amplitude: 'uAmplitude',
    Frequency: 'uFrequency',
    Factor: 'uFactor'
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
