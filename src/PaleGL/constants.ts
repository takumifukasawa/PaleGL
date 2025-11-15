export const MAX_SPOT_LIGHT_COUNT = 4;

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

export type PrimitiveType =
    | typeof PRIMITIVE_TYPE_POINTS
    | typeof PRIMITIVE_TYPE_LINES
    | typeof PRIMITIVE_TYPE_LINE_LOOP
    | typeof PRIMITIVE_TYPE_LINE_STRIP
    | typeof PRIMITIVE_TYPE_TRIANGLES
    | typeof PRIMITIVE_TYPE_TRIANGLE_STRIP
    | typeof PRIMITIVE_TYPE_TRIANGLE_FAN;

export const SHADING_MODEL_ID_LIT = 1;
export const SHADING_MODEL_ID_UNLIT = 2;
export const SHADING_MODEL_ID_SKYBOX = 3;
// 4以上はカスタム
// 実際に使う数をgbuffer.partial.glslのSHADING_MODEL_NUMを書き換える

export type ShadingModelIds =
    | typeof SHADING_MODEL_ID_LIT
    | typeof SHADING_MODEL_ID_UNLIT
    | typeof SHADING_MODEL_ID_SKYBOX;

export const DEPTH_FUNC_TYPE_NEVER = 0;
export const DEPTH_FUNC_TYPE_LESS = 1;
export const DEPTH_FUNC_TYPE_EQUAL = 2;
export const DEPTH_FUNC_TYPE_LEQUAL = 3;
export const DEPTH_FUNC_TYPE_GREATER = 4;
export const DEPTH_FUNC_TYPE_NOT_EQUAL = 5;
export const DEPTH_FUNC_TYPE_GEQUAL = 6;
export const DEPTH_FUNC_TYPE_ALWAYS = 7;

export type DepthFuncType =
    | typeof DEPTH_FUNC_TYPE_NEVER
    | typeof DEPTH_FUNC_TYPE_LESS
    | typeof DEPTH_FUNC_TYPE_EQUAL
    | typeof DEPTH_FUNC_TYPE_LEQUAL
    | typeof DEPTH_FUNC_TYPE_GREATER
    | typeof DEPTH_FUNC_TYPE_NOT_EQUAL
    | typeof DEPTH_FUNC_TYPE_GEQUAL
    | typeof DEPTH_FUNC_TYPE_ALWAYS;

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

export type RenderQueueType =
    | typeof RENDER_QUEUE_TYPE_OPAQUE
    | typeof RENDER_QUEUE_TYPE_ALPHA_TEST
    | typeof RENDER_QUEUE_TYPE_SKYBOX
    | typeof RENDER_QUEUE_TYPE_TRANSPARENT
    | typeof RENDER_QUEUE_TYPE_AFTER_TONE
    | typeof RENDER_QUEUE_TYPE_OVERLAY;

export const RENDER_QUEUE_OPAQUE = 0;
export const RENDER_QUEUE_ALPHA_TEST = 1;
export const RENDER_QUEUE_SKYBOX = 2;
export const RENDER_QUEUE_TRANSPARENT = 3;

export type RenderQueue =
    | typeof RENDER_QUEUE_OPAQUE
    | typeof RENDER_QUEUE_ALPHA_TEST
    | typeof RENDER_QUEUE_SKYBOX
    | typeof RENDER_QUEUE_TRANSPARENT;

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
// export const ACTOR_TYPE_GPU_PARTICLE = 6;
// export const ACTOR_TYPE_GPU_TRAIL_PARTICLE = 7;
// export const ACTOR_TYPE_INSTANCING_PARTICLE = 8;
// ObjectSpaceRaymarchMesh: 8,
// ScreenSpaceRaymarchMesh: 9,

export type ActorType =
    | typeof ACTOR_TYPE_NULL
    | typeof ACTOR_TYPE_MESH
    | typeof ACTOR_TYPE_LIGHT
    | typeof ACTOR_TYPE_SKYBOX
    | typeof ACTOR_TYPE_CAMERA
    | typeof ACTOR_TYPE_POST_PROCESS_VOLUME;
    // | typeof ACTOR_TYPE_GPU_PARTICLE
    // | typeof ACTOR_TYPE_GPU_TRAIL_PARTICLE
    // | typeof ACTOR_TYPE_INSTANCING_PARTICLE;

export const MESH_TYPE_DEFAULT = 0;
export const MESH_TYPE_SKINNED = 1;
export const MESH_TYPE_OBJECT_SPACE_RAYMARCH = 2;
export const MESH_TYPE_SCREEN_SPACE_RAYMARCH = 3;
export const MESH_TYPE_TEXT = 4;
// UI: 5,
export const MESH_TYPE_SPRITE_ATLAS = 6;
export const MESH_TYPE_SPLINE = 7;
export const MESH_TYPE_SPLINE_INSTANCING = 8;
export const MESH_TYPE_GPU_PARTICLE = 9;
export const MESH_TYPE_GPU_TRAIL_PARTICLE = 10;
export const MESH_TYPE_INSTANCING_PARTICLE = 11;

export type MeshType =
    | typeof MESH_TYPE_DEFAULT
    | typeof MESH_TYPE_SKINNED
    | typeof MESH_TYPE_OBJECT_SPACE_RAYMARCH
    | typeof MESH_TYPE_SCREEN_SPACE_RAYMARCH
    | typeof MESH_TYPE_TEXT
    | typeof MESH_TYPE_SPRITE_ATLAS
    | typeof MESH_TYPE_SPLINE
    | typeof MESH_TYPE_SPLINE_INSTANCING
    | typeof MESH_TYPE_GPU_PARTICLE
    | typeof MESH_TYPE_GPU_TRAIL_PARTICLE
    | typeof MESH_TYPE_INSTANCING_PARTICLE;

export const MATERIAL_TYPE_MISC = 0;
export const MATERIAL_TYPE_G_BUFFER = 1;
export const MATERIAL_TYPE_UNLIT = 2;
export const MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH = 3;
export const MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH = 4;
// export const MATERIAL_TYPE_TRANSPARENT = 5;

export type MaterialType =
    | typeof MATERIAL_TYPE_MISC
    | typeof MATERIAL_TYPE_G_BUFFER
    | typeof MATERIAL_TYPE_UNLIT
    | typeof MATERIAL_TYPE_OBJECT_SPACE_RAYMARCH
    | typeof MATERIAL_TYPE_SCREEN_SPACE_RAYMARCH;
// | typeof MATERIAL_TYPE_TRANSPARENT;

export const UI_QUEUE_TYPE_NONE = 0;
export const UI_QUEUE_TYPE_AFTER_TONE = 1;
export const UI_QUEUE_TYPE_OVERLAY = 2;

export type UIQueueType = typeof UI_QUEUE_TYPE_NONE | typeof UI_QUEUE_TYPE_AFTER_TONE | typeof UI_QUEUE_TYPE_OVERLAY;

export const UI_ANCHOR_TYPE_CENTER = 0;

export type UIAnchorType = typeof UI_ANCHOR_TYPE_CENTER;

export const COMPONENT_TYPE_DEFAULT = 0;
export const COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT = 1;
export const COMPONENT_TYPE_MATERIAL_SWITCH = 2;
export const COMPONENT_TYPE_GPU_PARTICLE_CONTROLLER = 3;
export const COMPONENT_TYPE_ANIMATION_CLIP_CONTROLLER = 4;
export const COMPONENT_TYPE_UI_TEXT_CONTROLLER = 5;
export const COMPONENT_TYPE_CUSTOM = 100;

export type ComponentType =
    | typeof COMPONENT_TYPE_DEFAULT
    | typeof COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT
    | typeof COMPONENT_TYPE_MATERIAL_SWITCH
    | typeof COMPONENT_TYPE_GPU_PARTICLE_CONTROLLER
    | typeof COMPONENT_TYPE_ANIMATION_CLIP_CONTROLLER
    | typeof COMPONENT_TYPE_UI_TEXT_CONTROLLER
    | typeof COMPONENT_TYPE_CUSTOM;

export const CAMERA_TYPE_PERSPECTIVE = 0;
export const CAMERA_TYPE_ORTHOGRAPHIC = 1;

export type CameraType = typeof CAMERA_TYPE_PERSPECTIVE | typeof CAMERA_TYPE_ORTHOGRAPHIC;

export const CUBE_MAP_AXIS_POSITIVE_X = 0;
export const CUBE_MAP_AXIS_NEGATIVE_X = 1;
export const CUBE_MAP_AXIS_POSITIVE_Y = 2;
export const CUBE_MAP_AXIS_NEGATIVE_Y = 3;
export const CUBE_MAP_AXIS_POSITIVE_Z = 4;
export const CUBE_MAP_AXIS_NEGATIVE_Z = 5;

export type CubeMapAxis =
    | typeof CUBE_MAP_AXIS_POSITIVE_X
    | typeof CUBE_MAP_AXIS_NEGATIVE_X
    | typeof CUBE_MAP_AXIS_POSITIVE_Y
    | typeof CUBE_MAP_AXIS_NEGATIVE_Y
    | typeof CUBE_MAP_AXIS_POSITIVE_Z
    | typeof CUBE_MAP_AXIS_NEGATIVE_Z;

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

export type TextureType =
    | typeof TEXTURE_TYPE_RGBA
    | typeof TEXTURE_TYPE_DEPTH
    | typeof TEXTURE_TYPE_RGBA16F
    | typeof TEXTURE_TYPE_RGBA32F
    | typeof TEXTURE_TYPE_R11F_G11F_B10F
    | typeof TEXTURE_TYPE_R16F;

export const TEXTURE_WRAP_TYPE_REPEAT = 0;
export const TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE = 1;
export const TEXTURE_WRAP_TYPE_MIRRORED_REPEAT = 2;

export type TextureWrapType =
    | typeof TEXTURE_WRAP_TYPE_REPEAT
    | typeof TEXTURE_WRAP_TYPE_CLAMP_TO_EDGE
    | typeof TEXTURE_WRAP_TYPE_MIRRORED_REPEAT;

export const TEXTURE_FILTER_TYPE_NEAREST = 0; // min, mag
export const TEXTURE_FILTER_TYPE_LINEAR = 1; // min, mag
export const TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_NEAREST = 2; // only min filter
export const TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_LINEAR = 3; // only min filter,
export const TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_NEAREST = 4; // only min filter
export const TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_LINEAR = 5; // only min filter

export type TextureFilterType =
    | typeof TEXTURE_FILTER_TYPE_NEAREST
    | typeof TEXTURE_FILTER_TYPE_LINEAR
    | typeof TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_NEAREST
    | typeof TEXTURE_FILTER_TYPE_NEAREST_MIPMAP_LINEAR
    | typeof TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_NEAREST
    | typeof TEXTURE_FILTER_TYPE_LINEAR_MIPMAP_LINEAR;

export const TEXTURE_DEPTH_PRECISION_TYPE_MEDIUM = 0;
export const TEXTURE_DEPTH_PRECISION_TYPE_HIGH = 1;

export type TextureDepthPrecisionType =
    | typeof TEXTURE_DEPTH_PRECISION_TYPE_MEDIUM
    | typeof TEXTURE_DEPTH_PRECISION_TYPE_HIGH;

// -----------------------------------------------------------------------------
// render target types
// -----------------------------------------------------------------------------

export const RENDER_TARGET_KIND_DEFAULT = 0;
export const RENDER_TARGET_KIND_G_BUFFER = 1;
export const RENDER_TARGET_KIND_MRT = 2;
export const RENDER_TARGET_KIND_DOUBLE_BUFFER = 3;

export type RenderTargetKind =
    | typeof RENDER_TARGET_KIND_DEFAULT
    | typeof RENDER_TARGET_KIND_G_BUFFER
    | typeof RENDER_TARGET_KIND_MRT
    | typeof RENDER_TARGET_KIND_DOUBLE_BUFFER;

export const RENDER_TARGET_TYPE_RGBA = 0;
export const RENDER_TARGET_TYPE_DEPTH = 1;
export const RENDER_TARGET_TYPE_EMPTY = 2;
export const RENDER_TARGET_TYPE_RGBA16F = 3;
export const RENDER_TARGET_TYPE_R11F_G11F_B10F = 4;
export const RENDER_TARGET_TYPE_R16F = 5;

export type RenderTargetType =
    | typeof RENDER_TARGET_TYPE_RGBA
    | typeof RENDER_TARGET_TYPE_DEPTH
    | typeof RENDER_TARGET_TYPE_EMPTY
    | typeof RENDER_TARGET_TYPE_RGBA16F
    | typeof RENDER_TARGET_TYPE_R11F_G11F_B10F
    | typeof RENDER_TARGET_TYPE_R16F;

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

export type AttributeUsageType =
    | typeof ATTRIBUTE_USAGE_TYPE_STATIC_DRAW
    | typeof ATTRIBUTE_USAGE_TYPE_DYNAMIC_DRAW
    | typeof ATTRIBUTE_USAGE_TYPE_DYNAMIC_COPY;

export const ATTRIBUTE_NAME_POSITION = 'aPosition';
export const ATTRIBUTE_NAME_COLOR = 'aColor';
export const ATTRIBUTE_NAME_UV = 'aUv';
export const ATTRIBUTE_NAME_NORMAL = 'aNormal';
export const ATTRIBUTE_NAME_TANGENT = 'aTangent';
export const ATTRIBUTE_NAME_BINORMAL = 'aBinormal';
// skinning
export const ATTRIBUTE_NAME_BONE_INDICES = 'aBoneIndices';
export const ATTRIBUTE_NAME_BONE_WEIGHTS = 'aBoneWeighs';
// instancing
export const ATTRIBUTE_NAME_INSTANCE_POSITION = 'aInstancePosition';
export const ATTRIBUTE_NAME_INSTANCE_SCALE = 'aInstanceScale';
export const ATTRIBUTE_NAME_INSTANCE_ROTATION = 'aInstanceRotation';
export const ATTRIBUTE_NAME_INSTANCE_ANIMATION_OFFSET = 'aInstanceAnimationOffset';
export const ATTRIBUTE_NAME_INSTANCE_VERTEX_COLOR = 'aInstanceVertexColor';
export const ATTRIBUTE_NAME_INSTANCE_EMISSIVE_COLOR = 'aInstanceEmissiveColor';
export const ATTRIBUTE_NAME_INSTANCE_VELOCITY = 'aInstanceVelocity';
export const ATTRIBUTE_NAME_INSTANCE_LOOK_DIRECTION = 'aLookDirection';
export const ATTRIBUTE_NAME_INSTANCE_STATE = 'aInstanceState';
// trail
export const ATTRIBUTE_NAME_TRAIL_INDEX = 'aTrailIndex';

export type AttributeName =
    | typeof ATTRIBUTE_NAME_POSITION
    | typeof ATTRIBUTE_NAME_COLOR
    | typeof ATTRIBUTE_NAME_UV
    | typeof ATTRIBUTE_NAME_NORMAL
    | typeof ATTRIBUTE_NAME_TANGENT
    | typeof ATTRIBUTE_NAME_BINORMAL
    | typeof ATTRIBUTE_NAME_BONE_INDICES
    | typeof ATTRIBUTE_NAME_BONE_WEIGHTS
    | typeof ATTRIBUTE_NAME_INSTANCE_POSITION
    | typeof ATTRIBUTE_NAME_INSTANCE_SCALE
    | typeof ATTRIBUTE_NAME_INSTANCE_ROTATION
    | typeof ATTRIBUTE_NAME_INSTANCE_ANIMATION_OFFSET
    | typeof ATTRIBUTE_NAME_INSTANCE_VERTEX_COLOR
    | typeof ATTRIBUTE_NAME_INSTANCE_EMISSIVE_COLOR
    | typeof ATTRIBUTE_NAME_INSTANCE_VELOCITY
    | typeof ATTRIBUTE_NAME_INSTANCE_LOOK_DIRECTION
    | typeof ATTRIBUTE_NAME_INSTANCE_STATE
    | typeof ATTRIBUTE_NAME_TRAIL_INDEX;

// -----------------------------------------------------------------------------
// post process
// -----------------------------------------------------------------------------

export const POST_PROCESS_PASS_TYPE_BLOOM = 0;
export const POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD = 1;
export const POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER = 2;
export const POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION = 3;
export const POST_PROCESS_PASS_TYPE_GLITCH = 4;
export const POST_PROCESS_PASS_TYPE_GAUSSIAN_BLUR = 5;
export const POST_PROCESS_PASS_TYPE_COPY = 6;
export const POST_PROCESS_PASS_TYPE_FXAA = 7;
export const POST_PROCESS_PASS_TYPE_LIGHT_SHAFT = 8;
export const POST_PROCESS_PASS_TYPE_DEFERRED_SHADING = 9;
export const POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW = 10;
export const POST_PROCESS_PASS_TYPE_SSAO = 11;
export const POST_PROCESS_PASS_TYPE_SSR = 12;
export const POST_PROCESS_PASS_TYPE_STREAK = 13;
export const POST_PROCESS_PASS_TYPE_TONE_MAPPING = 14;
export const POST_PROCESS_PASS_TYPE_VIGNETTE = 15;
export const POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT = 16;
export const POST_PROCESS_PASS_TYPE_FRAGMENT = 17;
export const POST_PROCESS_PASS_TYPE_FOG = 18;
export const POST_PROCESS_PASS_TYPE_FRAGMENT_PASS = 19;
export const POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS = 20;
export const POST_PROCESS_PASS_TYPE_MOTION_BLUR = 21;

export type PostProcessPassType =
    | typeof POST_PROCESS_PASS_TYPE_BLOOM
    | typeof POST_PROCESS_PASS_TYPE_DEPTH_OF_FIELD
    | typeof POST_PROCESS_PASS_TYPE_BUFFER_VISUALIZER
    | typeof POST_PROCESS_PASS_TYPE_CHROMATIC_ABERRATION
    | typeof POST_PROCESS_PASS_TYPE_GLITCH
    | typeof POST_PROCESS_PASS_TYPE_GAUSSIAN_BLUR
    | typeof POST_PROCESS_PASS_TYPE_COPY
    | typeof POST_PROCESS_PASS_TYPE_FXAA
    | typeof POST_PROCESS_PASS_TYPE_LIGHT_SHAFT
    | typeof POST_PROCESS_PASS_TYPE_DEFERRED_SHADING
    | typeof POST_PROCESS_PASS_TYPE_SCREEN_SPACE_SHADOW
    | typeof POST_PROCESS_PASS_TYPE_SSAO
    | typeof POST_PROCESS_PASS_TYPE_SSR
    | typeof POST_PROCESS_PASS_TYPE_STREAK
    | typeof POST_PROCESS_PASS_TYPE_TONE_MAPPING
    | typeof POST_PROCESS_PASS_TYPE_VIGNETTE
    | typeof POST_PROCESS_PASS_TYPE_VOLUMETRIC_LIGHT
    | typeof POST_PROCESS_PASS_TYPE_FRAGMENT
    | typeof POST_PROCESS_PASS_TYPE_FOG
    | typeof POST_PROCESS_PASS_TYPE_FRAGMENT_PASS
    | typeof POST_PROCESS_PASS_TYPE_BLACK_CURTAIN_PASS
    | typeof POST_PROCESS_PASS_TYPE_MOTION_BLUR;

// -----------------------------------------------------------------------------
// uniforms
// -----------------------------------------------------------------------------

// UniformData array indices (for array-based UniformData optimization)
export const UNIFORM_INDEX_NAME = 0;
export const UNIFORM_INDEX_TYPE = 1;
export const UNIFORM_INDEX_VALUE = 2;

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

// Individual uniform name constants
export const UNIFORM_NAME_WORLD_MATRIX = 'uWorldMatrix';
export const UNIFORM_NAME_VIEW_MATRIX = 'uViewMatrix';
export const UNIFORM_NAME_PROJECTION_MATRIX = 'uProjectionMatrix';
export const UNIFORM_NAME_WVP_MATRIX = 'uWVPMatrix';
export const UNIFORM_NAME_VIEW_PROJECTION_MATRIX = 'uViewProjectionMatrix';
export const UNIFORM_NAME_PREV_VIEW_PROJECTION_MATRIX = 'uPrevViewProjectionMatrix';
export const UNIFORM_NAME_NORMAL_MATRIX = 'uNormalMatrix';
export const UNIFORM_NAME_INVERSE_WORLD_MATRIX = 'uInverseWorldMatrix';
export const UNIFORM_NAME_INVERSE_VIEW_MATRIX = 'uInverseViewMatrix';
export const UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX = 'uInverseViewProjectionMatrix';
export const UNIFORM_NAME_INVERSE_PROJECTION_MATRIX = 'uInverseProjectionMatrix';
export const UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX = 'uTransposeInverseViewMatrix';
export const UNIFORM_NAME_VIEW_DIRECTION_PROJECTION_INVERSE = 'uViewDirectionProjectionInverse';
export const UNIFORM_NAME_VIEW_POSITION = 'uViewPosition';
export const UNIFORM_NAME_VIEW_DIRECTION = 'uViewDirection';
export const UNIFORM_NAME_CAMERA_ASPECT = 'uAspect';
export const UNIFORM_NAME_CAMERA_FOV = 'uFov';
export const UNIFORM_NAME_GBUFFER_A_TEXTURE = 'uGBufferATexture';
export const UNIFORM_NAME_GBUFFER_B_TEXTURE = 'uGBufferBTexture';
export const UNIFORM_NAME_GBUFFER_C_TEXTURE = 'uGBufferCTexture';
export const UNIFORM_NAME_GBUFFER_D_TEXTURE = 'uGBufferDTexture';
export const UNIFORM_NAME_SHADING_MODEL_ID = 'uShadingModelId';
export const UNIFORM_NAME_DEPTH_TEXTURE = 'uDepthTexture';
export const UNIFORM_NAME_BASE_MAP = 'uBaseMap';
export const UNIFORM_NAME_BASE_COLOR = 'uBaseColor';
export const UNIFORM_NAME_BASE_MAP_TILING = 'uBaseMapTiling';
export const UNIFORM_NAME_METALLIC = 'uMetallic';
export const UNIFORM_NAME_METALLIC_MAP = 'uMetallicMap';
export const UNIFORM_NAME_METALLIC_MAP_TILING = 'uMetallicMapTiling';
export const UNIFORM_NAME_ROUGHNESS = 'uRoughness';
export const UNIFORM_NAME_ROUGHNESS_MAP = 'uRoughnessMap';
export const UNIFORM_NAME_ROUGHNESS_MAP_TILING = 'uRoughnessMapTiling';
export const UNIFORM_NAME_EMISSIVE_COLOR = 'uEmissiveColor';
export const UNIFORM_NAME_EMISSIVE_MAP = 'uEmissiveMap';
export const UNIFORM_NAME_EMISSIVE_MAP_TILING = 'uEmissiveMapTiling';
export const UNIFORM_NAME_NORMAL_MAP = 'uNormalMap';
export const UNIFORM_NAME_NORMAL_MAP_TILING = 'uNormalMapTiling';
export const UNIFORM_NAME_HEIGHT_MAP = 'uHeightMap';
export const UNIFORM_NAME_HEIGHT_MAP_TILING = 'uHeightMapTiling';
export const UNIFORM_NAME_HEIGHT_SCALE = 'uHeightScale';
export const UNIFORM_NAME_JOINT_MATRICES = 'uJointMatrices';
export const UNIFORM_NAME_JOINT_TEXTURE = 'uJointTexture';
export const UNIFORM_NAME_BONE_COUNT = 'uBoneCount';
export const UNIFORM_NAME_JOINT_TEXTURE_COL_NUM = 'uJointTextureColNum';
export const UNIFORM_NAME_TOTAL_FRAME_COUNT = 'uTotalFrameCount';
export const UNIFORM_NAME_POSITION_MAP = 'uPositionMap';
export const UNIFORM_NAME_VELOCITY_MAP = 'uVelocityMap';
export const UNIFORM_NAME_UP_MAP = 'uUpMap';
export const UNIFORM_NAME_VAT_RESOLUTION = 'uVATResolution';
export const UNIFORM_NAME_TIME = 'uTime';
export const UNIFORM_NAME_DELTA_TIME = 'uDeltaTime';
export const UNIFORM_NAME_TIMELINE_TIME = 'uTimelineTime';
export const UNIFORM_NAME_TIMELINE_DELTA_TIME = 'uTimelineDeltaTime';
export const UNIFORM_NAME_VIEWPORT = 'uViewport';
export const UNIFORM_NAME_TARGET_WIDTH = 'uTargetWidth';
export const UNIFORM_NAME_TARGET_HEIGHT = 'uTargetHeight';
export const UNIFORM_NAME_ASPECT = 'uAspect';
export const UNIFORM_NAME_TEXEL_SIZE = 'uTexelSize';
export const UNIFORM_NAME_CAMERA_NEAR = 'uNearClip';
export const UNIFORM_NAME_CAMERA_FAR = 'uFarClip';
export const UNIFORM_NAME_CUBE_TEXTURE = 'uCubeTexture';
export const UNIFORM_NAME_DIRECTIONAL_LIGHT = 'uDirectionalLight';
export const UNIFORM_NAME_SPOT_LIGHT = 'uSpotLight';
export const UNIFORM_NAME_POINT_LIGHT = 'uPointLight';
export const UNIFORM_NAME_STRUCT_MEMBER_DIRECTION = 'smDirection';
export const UNIFORM_NAME_STRUCT_MEMBER_INTENSITY = 'smIntensity';
export const UNIFORM_NAME_STRUCT_MEMBER_COLOR = 'smColor';
export const UNIFORM_NAME_SHADOW_MAP = 'shadowMap';
export const UNIFORM_NAME_STRUCT_MEMBER_SHADOW_MAP_PROJECTION_MATRIX = 'smShadowMapProjectionMatrix';
export const UNIFORM_NAME_SHADOW_BIAS = 'shadowBias';
export const UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP = 'uDirectionalLightShadowMap';
export const UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP = 'uSpotLightShadowMap';
export const UNIFORM_NAME_STRUCT_MEMBER_POSITION = 'smPosition';
export const UNIFORM_NAME_STRUCT_MEMBER_DISTANCE = 'smDistance';
export const UNIFORM_NAME_STRUCT_MEMBER_ATTENUATION = 'smAttenuation';
export const UNIFORM_NAME_STRUCT_MEMBER_CONE_COS = 'smConeCos';
export const UNIFORM_NAME_STRUCT_MEMBER_PENUMBRA_COS = 'smPenumbraCos';
export const UNIFORM_NAME_STRUCT_MEMBER_CUBE_MAP = 'smCubeMap';
export const UNIFORM_NAME_STRUCT_MEMBER_DIFFUSE_INTENSITY = 'smDiffuseIntensity';
export const UNIFORM_NAME_STRUCT_MEMBER_SPECULAR_INTENSITY = 'smSpecularIntensity';
export const UNIFORM_NAME_STRUCT_MEMBER_ROTATION_OFFSET = 'smRotationOffset';
export const UNIFORM_NAME_STRUCT_MEMBER_MAX_LOD_LEVEL = 'smMaxLodLevel';
export const UNIFORM_NAME_SPOT_LIGHT_COLOR = 'uSpotLightColor';
export const UNIFORM_NAME_SPOT_LIGHT_INTENSITY = 'uSpotLightIntensity';
export const UNIFORM_NAME_SCENE_TEXTURE = 'uSceneTexture';
export const UNIFORM_NAME_UI_CHAR_RECT = 'uUICharRect';
export const UNIFORM_NAME_UI_FONT_SIZE = 'uUIFontSize';
export const UNIFORM_NAME_UI_ANCHOR = 'uUIAnchor';
export const UNIFORM_NAME_SRC_TEXTURE = 'uSrcTexture';
export const UNIFORM_NAME_BLEND_RATE = 'uBlendRate';
export const UNIFORM_NAME_FONT_MAP = 'uFontMap';
export const UNIFORM_NAME_FONT_TILING = 'uFontTiling';
export const UNIFORM_NAME_SKYBOX = 'uSkybox';
export const UNIFORM_NAME_ROTATION_OFFSET = 'uRotationOffset';
export const UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE = 'uBoundsScale';
export const UNIFORM_NAME_GRID_SIZE = 'uGridSize';
export const UNIFORM_NAME_OCTAVES = 'uOctaves';
export const UNIFORM_NAME_AMPLITUDE = 'uAmplitude';
export const UNIFORM_NAME_FREQUENCY = 'uFrequency';
export const UNIFORM_NAME_FACTOR = 'uFactor';
export const UNIFORM_NAME_SPEED = 'uSpeed';
export const UNIFORM_NAME_SCREEN_SPACE_SHADOW_TEXTURE = 'uScreenSpaceShadowTexture';
export const UNIFORM_NAME_AMBIENT_OCCLUSION_TEXTURE = 'uAmbientOcclusionTexture';
export const UNIFORM_NAME_LIGHT_SHAFT_TEXTURE = 'uLightShaftTexture';

export type UniformName =
    | typeof UNIFORM_NAME_WORLD_MATRIX
    | typeof UNIFORM_NAME_VIEW_MATRIX
    | typeof UNIFORM_NAME_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_WVP_MATRIX
    | typeof UNIFORM_NAME_VIEW_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_PREV_VIEW_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_NORMAL_MATRIX
    | typeof UNIFORM_NAME_INVERSE_WORLD_MATRIX
    | typeof UNIFORM_NAME_INVERSE_VIEW_MATRIX
    | typeof UNIFORM_NAME_INVERSE_VIEW_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_INVERSE_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_TRANSPOSE_INVERSE_VIEW_MATRIX
    | typeof UNIFORM_NAME_VIEW_DIRECTION_PROJECTION_INVERSE
    | typeof UNIFORM_NAME_VIEW_POSITION
    | typeof UNIFORM_NAME_VIEW_DIRECTION
    | typeof UNIFORM_NAME_CAMERA_ASPECT
    | typeof UNIFORM_NAME_CAMERA_FOV
    | typeof UNIFORM_NAME_GBUFFER_A_TEXTURE
    | typeof UNIFORM_NAME_GBUFFER_B_TEXTURE
    | typeof UNIFORM_NAME_GBUFFER_C_TEXTURE
    | typeof UNIFORM_NAME_GBUFFER_D_TEXTURE
    | typeof UNIFORM_NAME_SHADING_MODEL_ID
    | typeof UNIFORM_NAME_DEPTH_TEXTURE
    | typeof UNIFORM_NAME_BASE_MAP
    | typeof UNIFORM_NAME_BASE_COLOR
    | typeof UNIFORM_NAME_BASE_MAP_TILING
    | typeof UNIFORM_NAME_METALLIC
    | typeof UNIFORM_NAME_METALLIC_MAP
    | typeof UNIFORM_NAME_METALLIC_MAP_TILING
    | typeof UNIFORM_NAME_ROUGHNESS
    | typeof UNIFORM_NAME_ROUGHNESS_MAP
    | typeof UNIFORM_NAME_ROUGHNESS_MAP_TILING
    | typeof UNIFORM_NAME_EMISSIVE_COLOR
    | typeof UNIFORM_NAME_EMISSIVE_MAP
    | typeof UNIFORM_NAME_EMISSIVE_MAP_TILING
    | typeof UNIFORM_NAME_NORMAL_MAP
    | typeof UNIFORM_NAME_NORMAL_MAP_TILING
    | typeof UNIFORM_NAME_HEIGHT_MAP
    | typeof UNIFORM_NAME_HEIGHT_MAP_TILING
    | typeof UNIFORM_NAME_HEIGHT_SCALE
    | typeof UNIFORM_NAME_JOINT_MATRICES
    | typeof UNIFORM_NAME_JOINT_TEXTURE
    | typeof UNIFORM_NAME_BONE_COUNT
    | typeof UNIFORM_NAME_JOINT_TEXTURE_COL_NUM
    | typeof UNIFORM_NAME_TOTAL_FRAME_COUNT
    | typeof UNIFORM_NAME_POSITION_MAP
    | typeof UNIFORM_NAME_VELOCITY_MAP
    | typeof UNIFORM_NAME_UP_MAP
    | typeof UNIFORM_NAME_VAT_RESOLUTION
    | typeof UNIFORM_NAME_TIME
    | typeof UNIFORM_NAME_DELTA_TIME
    | typeof UNIFORM_NAME_TIMELINE_TIME
    | typeof UNIFORM_NAME_TIMELINE_DELTA_TIME
    | typeof UNIFORM_NAME_VIEWPORT
    | typeof UNIFORM_NAME_TARGET_WIDTH
    | typeof UNIFORM_NAME_TARGET_HEIGHT
    | typeof UNIFORM_NAME_ASPECT
    | typeof UNIFORM_NAME_TEXEL_SIZE
    | typeof UNIFORM_NAME_CAMERA_NEAR
    | typeof UNIFORM_NAME_CAMERA_FAR
    | typeof UNIFORM_NAME_CUBE_TEXTURE
    | typeof UNIFORM_NAME_DIRECTIONAL_LIGHT
    | typeof UNIFORM_NAME_SPOT_LIGHT
    | typeof UNIFORM_NAME_POINT_LIGHT
    | typeof UNIFORM_NAME_STRUCT_MEMBER_DIRECTION
    | typeof UNIFORM_NAME_STRUCT_MEMBER_INTENSITY
    | typeof UNIFORM_NAME_STRUCT_MEMBER_COLOR
    | typeof UNIFORM_NAME_SHADOW_MAP
    | typeof UNIFORM_NAME_STRUCT_MEMBER_SHADOW_MAP_PROJECTION_MATRIX
    | typeof UNIFORM_NAME_SHADOW_BIAS
    | typeof UNIFORM_NAME_DIRECTIONAL_LIGHT_SHADOW_MAP
    | typeof UNIFORM_NAME_SPOT_LIGHT_SHADOW_MAP
    | typeof UNIFORM_NAME_STRUCT_MEMBER_POSITION
    | typeof UNIFORM_NAME_STRUCT_MEMBER_DISTANCE
    | typeof UNIFORM_NAME_STRUCT_MEMBER_ATTENUATION
    | typeof UNIFORM_NAME_STRUCT_MEMBER_CONE_COS
    | typeof UNIFORM_NAME_STRUCT_MEMBER_PENUMBRA_COS
    | typeof UNIFORM_NAME_STRUCT_MEMBER_CUBE_MAP
    | typeof UNIFORM_NAME_STRUCT_MEMBER_DIFFUSE_INTENSITY
    | typeof UNIFORM_NAME_STRUCT_MEMBER_SPECULAR_INTENSITY
    | typeof UNIFORM_NAME_STRUCT_MEMBER_ROTATION_OFFSET
    | typeof UNIFORM_NAME_STRUCT_MEMBER_MAX_LOD_LEVEL
    | typeof UNIFORM_NAME_SPOT_LIGHT_COLOR
    | typeof UNIFORM_NAME_SPOT_LIGHT_INTENSITY
    | typeof UNIFORM_NAME_SCENE_TEXTURE
    | typeof UNIFORM_NAME_UI_CHAR_RECT
    | typeof UNIFORM_NAME_UI_FONT_SIZE
    | typeof UNIFORM_NAME_UI_ANCHOR
    | typeof UNIFORM_NAME_SRC_TEXTURE
    | typeof UNIFORM_NAME_BLEND_RATE
    | typeof UNIFORM_NAME_FONT_MAP
    | typeof UNIFORM_NAME_FONT_TILING
    | typeof UNIFORM_NAME_SKYBOX
    | typeof UNIFORM_NAME_ROTATION_OFFSET
    | typeof UNIFORM_NAME_OBJECT_SPACE_RAYMARCH_BOUNDS_SCALE
    | typeof UNIFORM_NAME_GRID_SIZE
    | typeof UNIFORM_NAME_OCTAVES
    | typeof UNIFORM_NAME_AMPLITUDE
    | typeof UNIFORM_NAME_FREQUENCY
    | typeof UNIFORM_NAME_FACTOR
    | typeof UNIFORM_NAME_SCREEN_SPACE_SHADOW_TEXTURE
    | typeof UNIFORM_NAME_AMBIENT_OCCLUSION_TEXTURE
    | typeof UNIFORM_NAME_LIGHT_SHAFT_TEXTURE;

export const UNIFORM_BLOCK_NAME_COMMON = 'ubCommon';
export const UNIFORM_BLOCK_NAME_TRANSFORMATIONS = 'ubTransformations';
export const UNIFORM_BLOCK_NAME_CAMERA = 'ubCamera';
export const UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT = 'ubDirectionalLight';
export const UNIFORM_BLOCK_NAME_SPOT_LIGHT = 'ubSpotLight';
export const UNIFORM_BLOCK_NAME_POINT_LIGHT = 'ubPointLight';
export const UNIFORM_BLOCK_NAME_TIMELINE = 'ubTimeline';

export type UniformBlockName =
    | typeof UNIFORM_BLOCK_NAME_COMMON
    | typeof UNIFORM_BLOCK_NAME_TRANSFORMATIONS
    | typeof UNIFORM_BLOCK_NAME_CAMERA
    | typeof UNIFORM_BLOCK_NAME_DIRECTIONAL_LIGHT
    | typeof UNIFORM_BLOCK_NAME_SPOT_LIGHT
    | typeof UNIFORM_BLOCK_NAME_POINT_LIGHT
    | typeof UNIFORM_BLOCK_NAME_TIMELINE;

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

// ShaderModifierPragmas - 共通定数（内部使用）
const SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE = 'APPEND_INCLUDE';
const SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS = 'APPEND_VARYINGS';
const SHADER_MODIFIER_PRAGMA_BEGIN_MAIN = 'BEGIN_MAIN';
const SHADER_MODIFIER_PRAGMA_END_MAIN = 'END_MAIN';
const SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES = 'APPEND_ATTRIBUTES';
const SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS = 'APPEND_UNIFORMS';
const SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE = 'RAYMARCH_SCENE';

// VertexShaderModifierPragmas - 13定数（6独自 + 7共通）
export const VERTEX_SHADER_MODIFIER_PRAGMA_LOCAL_POSITION_POST_PROCESS = 'LOCAL_POSITION_POST_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_VERTEX_COLOR_POST_PROCESS = 'VERTEX_COLOR_POST_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_INSTANCE_TRANSFORM_PRE_PROCESS = 'INSTANCE_TRANSFORM_PRE_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_WORLD_POSITION_POST_PROCESS = 'WORLD_POSITION_POST_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_VIEW_POSITION_POST_PROCESS = 'VIEW_POSITION_POST_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_OUT_CLIP_POSITION_PRE_PROCESS = 'OUT_CLIP_POSITION_PRE_PROCESS';
export const VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE = SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE;
export const VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS = SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS;
export const VERTEX_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN = SHADER_MODIFIER_PRAGMA_BEGIN_MAIN;
export const VERTEX_SHADER_MODIFIER_PRAGMA_END_MAIN = SHADER_MODIFIER_PRAGMA_END_MAIN;
export const VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES = SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES;
export const VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS = SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS;
export const VERTEX_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE = SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE;

export type VertexShaderModifierPragmas =
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_LOCAL_POSITION_POST_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_VERTEX_COLOR_POST_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_INSTANCE_TRANSFORM_PRE_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_WORLD_POSITION_POST_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_VIEW_POSITION_POST_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_OUT_CLIP_POSITION_PRE_PROCESS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_END_MAIN
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS
    | typeof VERTEX_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE;

// FragmentShaderModifierPragmas - 10定数（3独自 + 7共通）
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_BLOCK_BEFORE_RAYMARCH_CONTENT = 'BLOCK_BEFORE_RAYMARCH_CONTENT';
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_BEFORE_OUT = 'BEFORE_OUT';
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_AFTER_OUT = 'AFTER_OUT';
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE = SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS = SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN = SHADER_MODIFIER_PRAGMA_BEGIN_MAIN;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_END_MAIN = SHADER_MODIFIER_PRAGMA_END_MAIN;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES = SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS = SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE = SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE;
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_INITIALIZE = 'GPU_PARTICLE_MODIFY_INITIALIZE';
export const FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_UPDATE = 'GPU_PARTICLE_MODIFY_UPDATE';

export type FragmentShaderModifierPragmas =
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_BLOCK_BEFORE_RAYMARCH_CONTENT
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_BEFORE_OUT
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_AFTER_OUT
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_BEGIN_MAIN
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_END_MAIN
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_INITIALIZE
    | typeof FRAGMENT_SHADER_MODIFIER_PRAGMA_GPU_PARTICLE_MODIFY_UPDATE;

// Tuple-based shader modifiers (optimized for size)
export type VertexShaderModifier = [VertexShaderModifierPragmas, string];
export type VertexShaderModifiers = VertexShaderModifier[];

export type FragmentShaderModifier = [FragmentShaderModifierPragmas, string];
export type FragmentShaderModifiers = FragmentShaderModifier[];

export type DepthFragmentShaderModifier = [FragmentShaderModifierPragmas, string];
export type DepthFragmentShaderModifiers = DepthFragmentShaderModifier[];

// ShaderPartialPragmas - 現在は空（将来の拡張用）
// export const SHADER_PARTIAL_PRAGMA_ENGINE_UNIFORMS = 'ENGINE_UNIFORMS';
// export const SHADER_PARTIAL_PRAGMA_TRANSFORM_VERTEX_UNIFORMS = 'TRANSFORM_VERTEX_UNIFORMS';
// export const SHADER_PARTIAL_PRAGMA_CAMERA_UNIFORMS = 'CAMERA_UNIFORMS';

export type ShaderPartialPragmas = never;

// ShaderPragmas - 9定数（2独自 + 7共通）
export const SHADER_PRAGMA_DEFINES = 'DEFINES';
export const SHADER_PRAGMA_ATTRIBUTES = 'ATTRIBUTES';
export const SHADER_PRAGMA_APPEND_INCLUDE = SHADER_MODIFIER_PRAGMA_APPEND_INCLUDE;
export const SHADER_PRAGMA_APPEND_VARYINGS = SHADER_MODIFIER_PRAGMA_APPEND_VARYINGS;
export const SHADER_PRAGMA_BEGIN_MAIN = SHADER_MODIFIER_PRAGMA_BEGIN_MAIN;
export const SHADER_PRAGMA_END_MAIN = SHADER_MODIFIER_PRAGMA_END_MAIN;
export const SHADER_PRAGMA_APPEND_ATTRIBUTES = SHADER_MODIFIER_PRAGMA_APPEND_ATTRIBUTES;
export const SHADER_PRAGMA_APPEND_UNIFORMS = SHADER_MODIFIER_PRAGMA_APPEND_UNIFORMS;
export const SHADER_PRAGMA_RAYMARCH_SCENE = SHADER_MODIFIER_PRAGMA_RAYMARCH_SCENE;

// export const SHADER_PRAGMA_GPU_PARTICLE_INITIALIZE_END_MAIN = 'GPU_PARTICLE_INITIALIZE_END_MAIN';
// export const SHADER_PRAGMA_GPU_PARTICLE_UPDATE_END_MAIN = 'GPU_PARTICLE_UPDATE_END_MAIN';

// tmp
// export type ShaderPragmas =
//     | typeof SHADER_PRAGMA_DEFINES
//     | typeof SHADER_PRAGMA_ATTRIBUTES
//     | typeof SHADER_PRAGMA_APPEND_INCLUDE
//     | typeof SHADER_PRAGMA_APPEND_VARYINGS
//     | typeof SHADER_PRAGMA_BEGIN_MAIN
//     | typeof SHADER_PRAGMA_END_MAIN
//     | typeof SHADER_PRAGMA_APPEND_ATTRIBUTES
//     | typeof SHADER_PRAGMA_APPEND_UNIFORMS
//     | typeof SHADER_PRAGMA_RAYMARCH_SCENE;

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

export const GL_TEXTURE_FILTER_NEAREST = 9728;
export const GL_TEXTURE_FILTER_LINEAR = 9729;
export const GL_TEXTURE_FILTER_NEAREST_MIPMAP_NEAREST = 9984;
export const GL_TEXTURE_FILTER_NEAREST_MIPMAP_LINEAR = 9986;
export const GL_TEXTURE_FILTER_LINEAR_MIPMAP_NEAREST = 9985;
export const GL_TEXTURE_FILTER_LINEAR_MIPMAP_LINEAR = 9987;

export type GLTextureFilter =
    | typeof GL_TEXTURE_FILTER_NEAREST
    | typeof GL_TEXTURE_FILTER_LINEAR
    | typeof GL_TEXTURE_FILTER_NEAREST_MIPMAP_NEAREST
    | typeof GL_TEXTURE_FILTER_NEAREST_MIPMAP_LINEAR
    | typeof GL_TEXTURE_FILTER_LINEAR_MIPMAP_NEAREST
    | typeof GL_TEXTURE_FILTER_LINEAR_MIPMAP_LINEAR;

// wrap -----------------------------------

export const GL_TEXTURE_WRAP_S = 10242;
export const GL_TEXTURE_WRAP_T = 10243;
// export const GL_REPEAT = 10497;
// export const GL_CLAMP_TO_EDGE = 33071;
// export const GL_MIRRORED_REPEAT = 33648;

export const GL_TEXTURE_WRAP_REPEAT = 10497;
export const GL_TEXTURE_WRAP_CLAMP_TO_EDGE = 33071;
export const GL_TEXTURE_WRAP_MIRRORED_REPEAT = 33648;

export type GLTextureWrap =
    | typeof GL_TEXTURE_WRAP_REPEAT
    | typeof GL_TEXTURE_WRAP_CLAMP_TO_EDGE
    | typeof GL_TEXTURE_WRAP_MIRRORED_REPEAT;

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

export const GL_COLOR_ATTACHMENT0 = 36064;
export const GL_COLOR_ATTACHMENT1 = 36065;
export const GL_COLOR_ATTACHMENT2 = 36066;
export const GL_COLOR_ATTACHMENT3 = 36067;
export const GL_COLOR_ATTACHMENT4 = 36068;
export const GL_COLOR_ATTACHMENT5 = 36069;
export const GL_COLOR_ATTACHMENT6 = 36070;
export const GL_COLOR_ATTACHMENT7 = 36071;

export type GLColorAttachment =
    | typeof GL_COLOR_ATTACHMENT0
    | typeof GL_COLOR_ATTACHMENT1
    | typeof GL_COLOR_ATTACHMENT2
    | typeof GL_COLOR_ATTACHMENT3
    | typeof GL_COLOR_ATTACHMENT4
    | typeof GL_COLOR_ATTACHMENT5
    | typeof GL_COLOR_ATTACHMENT6
    | typeof GL_COLOR_ATTACHMENT7;

export const GLColorAttachments = [
    GL_COLOR_ATTACHMENT0,
    GL_COLOR_ATTACHMENT1,
    GL_COLOR_ATTACHMENT2,
    GL_COLOR_ATTACHMENT3,
    GL_COLOR_ATTACHMENT4,
    GL_COLOR_ATTACHMENT5,
    GL_COLOR_ATTACHMENT6,
    GL_COLOR_ATTACHMENT7,
];

// --

// export const PRAGMA_RAYMARCH_SCENE = '#pragma RAYMARCH_SCENE';
export const PRAGMA_RAYMARCH_SCENE = 'RAYMARCH_SCENE';
