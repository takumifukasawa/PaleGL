import { Actor } from '@/PaleGL/actors/actor.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { RawVector2, Vector2 } from '@/PaleGL/math/vector2.ts';
import { RawVector3, Vector3 } from '@/PaleGL/math/vector3.ts';
import { RawVector4, Vector4 } from '@/PaleGL/math/vector4.ts';

//
// settings
//

// TODO: 2回プロパティを書かなきゃいけないのが冗長かつミスる可能性高くなるが一旦・・・
export type NeedsShorten = true;
export const NeedsShorten = true;

//
// utilities
//

type Append<T extends unknown[], U> = [...T, U];
type AppendMany<T extends unknown[], U extends unknown[]> = [...T, ...U];

//
// marionetter
//

export type MarionetterSceneStructure = {
    actors: Actor[];
    marionetterTimeline: MarionetterTimeline | null;
};

export const MARIONETTER_RECEIVE_DATA_TYPE_SEEK_TIMELINE = 'seekTimeline';
export const MARIONETTER_RECEIVE_DATA_TYPE_PLAY_TIMELINE = 'playTimeline';
export const MARIONETTER_RECEIVE_DATA_TYPE_STOP_TIMELINE = 'stopTimeline';
export const MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_SCENE = 'exportScene';
export const MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_HOT_RELOAD_SCENE = 'exportHotReloadScene';
export const MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_DATA = 'setSceneViewData';
export const MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_ENABLED = 'setSceneViewEnabled';
export const MARIONETTER_RECEIVE_DATA_TYPE_BEGIN_PLAYER = 'beginPlayer';
export const MARIONETTER_RECEIVE_DATA_TYPE_RELOAD = 'reload';

export type MarionetterReceiveDataType =
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_SEEK_TIMELINE
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_PLAY_TIMELINE
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_STOP_TIMELINE
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_SCENE
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_HOT_RELOAD_SCENE
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_DATA
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_ENABLED
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_BEGIN_PLAYER
    | typeof MARIONETTER_RECEIVE_DATA_TYPE_RELOAD;

export type MarionetterReceiveData = {
    type: MarionetterReceiveDataType;
};

export type MarionetterReceiveTimeData = MarionetterReceiveData & {
    currentTime: number;
};

export type MarionetterReceiveSceneViewData = MarionetterReceiveData & {
    cameraPosition: RawVector3;
    cameraRotation: RawVector4;
    cameraFov: number;
    cameraNear: number;
    cameraFar: number;
};

export type MarionetterReceiveSceneViewEnabledData = MarionetterReceiveData & {
    enabled: boolean;
};

export type Marionetter = {
    connect: () => void;
    getCurrentTime: () => number;
    setCurrentTime: (time: number) => void;
    setHotReloadCallback: (callback: () => void) => void;
    // setSceneViewDataCallback: (callback: (data: MarionetterReceiveSceneViewData) => void) => void;
    // setSceneViewEnabledCallback: (callback: (data: MarionetterReceiveSceneViewEnabledData) => void) => void;
};

export type MarionetterArgs = {
    port?: number;
    showLog?: boolean;
    onPlay?: (time: number) => void;
    onSeek?: (time: number) => void;
    onStop?: () => void;
    // onHotReload?: () => void;
    onSetSceneViewData?: (data: MarionetterReceiveSceneViewData) => void;
    onSceneViewEnabled?: (data: MarionetterReceiveSceneViewEnabledData) => void;
    onBeginPlayer?: () => void;
};

//
// scene
//

export type MarionetterScene = {
    objects: MarionetterObjectInfo[];
    // shorten
    o: MarionetterObjectInfo[];
};

export const MARIONETTER_SCENE_PROPERTY_OBJECTS = NeedsShorten ? 'o' : 'objects';

// ObjectInfo は配列形式でシリアライズされる
// [name, transform, components, children?]
// children は省略可能（末尾のnullは省略される）
// components は常に存在（空配列の可能性あり）
export type MarionetterObjectInfo = [
    string, // name
    MarionetterTransformInfo, // transform
    MarionetterComponentInfoKinds[], // components (always present, may be empty)
    MarionetterObjectInfo[]? // children (optional)
];

export const MARIONETTER_OBJECT_INFO_INDEX_NAME = 0;
export const MARIONETTER_OBJECT_INFO_INDEX_TRANSFORM = 1;
export const MARIONETTER_OBJECT_INFO_INDEX_COMPONENTS = 2;
export const MARIONETTER_OBJECT_INFO_INDEX_CHILDREN = 3;

// export type MarionetterTransformInfo = {
//     localPosition: { x: number; y: number; z: number };
//     localRotation: { x: number; y: number; z: number; w: number };
//     localScale: { x: number; y: number; z: number };
//     // shorten
//     lp: { x: number; y: number; z: number };
//     lr: { x: number; y: number; z: number; w: number };
//     ls: { x: number; y: number; z: number };
// };

// ExportTransformコンポーネントあり: [[x,y,z], [x,y,z,w], [x,y,z]]
// ExportTransformコンポーネントなし: []
// [
//      [lp.x, lp.y, lp.z], // position
//      [lr.x, lr.y, lr.z, lr.w], // rotation (quaternion)
//      [ls.x, ls.y, ls.z] // scale
// ]
export type MarionetterTransformInfo = [number[], number[], number[]] | [];

// export const MARIONETTER_TRANSFORM_LOCAL_POSITION_X_INDEX = 0;
// export const MARIONETTER_TRANSFORM_LOCAL_POSITION_Y_INDEX = 1;
// export const MARIONETTER_TRANSFORM_LOCAL_POSITION_Z_INDEX = 2;

// export const MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_POSITION = NeedsShorten ? 'lp' : 'localPosition';
// export const MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_ROTATION = NeedsShorten ? 'lr' : 'localRotation';
// export const MARIONETTER_TRANSFORM_INFO_PROPERTY_LOCAL_SCALE = NeedsShorten ? 'ls' : 'localScale';

//
// track
//

// unityに合わせる
export const MARIONETTER_TRACK_INFO_TYPE_NONE = 0;
export const MARIONETTER_TRACK_INFO_TYPE_ANIMATION_TRACK = 1;
export const MARIONETTER_TRACK_INFO_TYPE_LIGHT_CONTROL_TRACK = 2;
export const MARIONETTER_TRACK_INFO_TYPE_ACTIVATION_CONTROL_TRACK = 3;
export const MARIONETTER_TRACK_INFO_TYPE_MARKER_TRACK = 4;
export const MARIONETTER_TRACK_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_TRACK = 5;
// TODO: custom track は外から注入したい
// HumanTrack: 6,

export type MarionetterTrackInfoType =
    | typeof MARIONETTER_TRACK_INFO_TYPE_NONE
    | typeof MARIONETTER_TRACK_INFO_TYPE_ANIMATION_TRACK
    | typeof MARIONETTER_TRACK_INFO_TYPE_LIGHT_CONTROL_TRACK
    | typeof MARIONETTER_TRACK_INFO_TYPE_ACTIVATION_CONTROL_TRACK
    | typeof MARIONETTER_TRACK_INFO_TYPE_MARKER_TRACK
    | typeof MARIONETTER_TRACK_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_TRACK;

// [name, type]
export type MarionetterTrackInfoBase = [string, MarionetterTrackInfoType];

export const MARIONETTER_TRACK_INFO_BASE_NAME_INDEX = 0;
export const MARIONETTER_TRACK_INFO_BASE_TYPE_INDEX = 1;

// [name, type, targetName, clips]
export type MarionetterDefaultTrackInfo = [
    string,
    MarionetterTrackInfoType,
    string,
    MarionetterClipInfoKinds[]
];

export const MARIONETTER_DEFAULT_TRACK_INFO_NAME_INDEX = 0;
export const MARIONETTER_DEFAULT_TRACK_INFO_TYPE_INDEX = 1;
export const MARIONETTER_DEFAULT_TRACK_INFO_TARGET_NAME_INDEX = 2;
export const MARIONETTER_DEFAULT_TRACK_INFO_CLIPS_INDEX = 3;

// [name, type, signalEmitters]
export type MarionetterMarkerTrackInfo = [string, MarionetterTrackInfoType, MarionetterSignalEmitter[]];

export const MARIONETTER_MARKER_TRACK_INFO_NAME_INDEX = 0;
export const MARIONETTER_MARKER_TRACK_INFO_TYPE_INDEX = 1;
export const MARIONETTER_MARKER_TRACK_INFO_SIGNAL_EMITTERS_INDEX = 2;

export type MarionetterTrackInfoKinds = MarionetterDefaultTrackInfo | MarionetterMarkerTrackInfo;

export type MarionetterSignalEmitter = {
    name: string;
    time: number;
    // shorten
    n: string;
    t: number;
};

export const MARIONETTER_SIGNAL_EMITTER_PROPERTY_NAME = NeedsShorten ? 'n' : 'name';
export const MARIONETTER_SIGNAL_EMITTER_PROPERTY_TIME = NeedsShorten ? 't' : 'time';

export type MarionetterClipInfoKinds =
    | MarionetterAnimationClipInfo
    | MarionetterLightControlClipInfo
    | MarionetterActivationControlClipInfo
    | MarionetterObjectMoveAndLookAtClipInfo;
// // custom
// | MarionetterHumanClipInfo;

// NOTE: unity側に合わせる
export const MARIONETTER_CLIP_INFO_TYPE_NONE = 0;
export const MARIONETTER_CLIP_INFO_TYPE_ANIMATION_CLIP = 1;
export const MARIONETTER_CLIP_INFO_TYPE_LIGHT_CONTROL_CLIP = 2;
export const MARIONETTER_CLIP_INFO_TYPE_ACTIVATION_CONTROL_CLIP = 3;
export const MARIONETTER_CLIP_INFO_TYPE_SIGNAL_EMITTER = 4;
export const MARIONETTER_CLIP_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP = 5;
// custom
// HumanClip: 6,

export type MarionetterClipInfoType =
    | typeof MARIONETTER_CLIP_INFO_TYPE_NONE
    | typeof MARIONETTER_CLIP_INFO_TYPE_ANIMATION_CLIP
    | typeof MARIONETTER_CLIP_INFO_TYPE_LIGHT_CONTROL_CLIP
    | typeof MARIONETTER_CLIP_INFO_TYPE_ACTIVATION_CONTROL_CLIP
    | typeof MARIONETTER_CLIP_INFO_TYPE_SIGNAL_EMITTER
    | typeof MARIONETTER_CLIP_INFO_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP;

// export type MarionetterClipInfoBase = {
//     type: MarionetterClipInfoType;
//     start: number;
//     duration: number;
//     // shorten
//     t: MarionetterClipInfoType;
//     s: number;
//     d: number;
// };

export const MARIONETTER_ANIMATION_CLIP_NAME_INDEX = 0;
export const MARIONETTER_ANIMATION_CLIP_TYPE_INDEX = 1;
export const MARIONETTER_ANIMATION_CLIP_START_INDEX = 2;
export const MARIONETTER_ANIMATION_CLIP_DURATION_INDEX = 3;
export const MARIONETTER_ANIMATION_CLIP_POST_EXTRAPORATION_INDEX = 4;
export const MARIONETTER_ANIMATION_CLIP_BINDINGS_INDEX = 5;

// [name, clipInfoType, start, duration, post-extraporation, ...subclass data, speed?]
// NOTE: speed is optional and appears as the last element if != 1.0
export type MarionetterClipInfoBase = [
    string,
    MarionetterClipInfoType,
    number,
    number,
    MARIONETTER_CLIP_POST_EXTRAPORATION_MODE,
];

// export const MARIONETTER_CLIP_INFO_BASE_PROPERTY_TYPE = NeedsShorten ? 't' : 'type';
// export const MARIONETTER_CLIP_INFO_BASE_PROPERTY_START = NeedsShorten ? 's' : 'start';
// export const MARIONETTER_CLIP_INFO_BASE_PROPERTY_DURATION = NeedsShorten ? 'd' : 'duration';

export const MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_NONE = 0;
export const MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD = 1;
export const MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP = 2;
export const MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_PINGPONG = 3;
export const MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_CONTINUE = 4;
export type MARIONETTER_CLIP_POST_EXTRAPORATION_MODE =
    | typeof MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_NONE
    | typeof MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_HOLD
    | typeof MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_LOOP
    | typeof MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_PINGPONG
    | typeof MARIONETTER_CLIP_POST_EXTRAPORATION_MODE_CONTINUE;

// NOTE: unity側に合わせる
export const MARIONETTER_ANIMATION_CLIP_TYPE_DEFAULT = 0;
export const MARIONETTER_ANIMATION_CLIP_TYPE_GBUFFER_MATERIAL = 1;
export type MarionetterAnimationClipType =
    | typeof MARIONETTER_ANIMATION_CLIP_TYPE_DEFAULT
    | typeof MARIONETTER_ANIMATION_CLIP_TYPE_GBUFFER_MATERIAL;

// export type MarionetterAnimationClipInfo = MarionetterClipInfoBase & {
//     animationClipType: MarionetterAnimationClipType;
//     offsetPosition: { x: number; y: number; z: number };
//     offsetRotation: { x: number; y: number; z: number };
//     bindings: MarionetterClipBinding[];
//     // shorten
//     act: MarionetterAnimationClipType;
//     op: { x: number; y: number; z: number };
//     or: { x: number; y: number; z: number };
//     b: MarionetterClipBinding[];
// };

// [..., bindings, animation clip type, op?, or?]
export type MarionetterAnimationClipInfo = AppendMany<
    // prettier-ignore
    MarionetterClipInfoBase,
    [
        MarionetterClipBinding[], // bindings
        MarionetterAnimationClipType,
        { x: number; y: number; z: number }?, // offset position (possibly null)
        { x: number; y: number; z: number }?, // offset rotation (possibly null
    ]
>;

// // offset周りは一旦使わない
// // export const MARIONETTER_ANIMATION_CLIP_INFO_PROPERTY_ANIMATION_CLIP_TYPE = NeedsShorten ? 'act' : 'animationClipType';
// // export const MARIONETTER_ANIMATION_CLIP_INFO_PROPERTY_OFFSET_POSITION = NeedsShorten ? 'op' : 'offsetPosition';
// // export const MARIONETTER_ANIMATION_CLIP_INFO_PROPERTY_OFFSET_ROTATION = NeedsShorten ? 'or' : 'offsetRotation';
// export const MARIONETTER_ANIMATION_CLIP_INFO_PROPERTY_BINDINGS = NeedsShorten ? 'b' : 'bindings';

// // [clipInfoType, start, duration, bindings, op?, or?]
// export type MarionetterLightControlClipInfo = MarionetterClipInfoBase & {
//     bindings: MarionetterClipBinding[];
//     // shorten
//     b: MarionetterClipBinding[];
// };

// [..., bindings]
export type MarionetterLightControlClipInfo = AppendMany<
    // prettier-ignore
    MarionetterClipInfoBase,
    [MarionetterClipBinding[]]
>;

export const MARIONETTER_LIGHT_CONTROL_CLIP_INFO_PROPERTY_BINDINGS = NeedsShorten ? 'b' : 'bindings';

export type MarionetterActivationControlClipInfo = MarionetterClipInfoBase;

// TODO: signal emitter

// export type MarionetterObjectMoveAndLookAtClipInfo = MarionetterClipInfoBase & {
//     localPosition: RawVector3;
//     lookAtTargetName: string;
//     bindings: MarionetterClipBinding[];
//     // shorten
//     lp: RawVector3;
//     tn: string;
//     b: MarionetterClipBinding[];
// };

// [..., bindings, target name, local position
export type MarionetterObjectMoveAndLookAtClipInfo = AppendMany<
    // prettier-ignore
    MarionetterClipInfoBase,
    [MarionetterClipBinding[], string, RawVector3]
>;

export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION = NeedsShorten
    ? 'lp'
    : 'localPosition';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOOK_AT_TARGET_NAME = NeedsShorten
    ? 'tn'
    : 'lookAtTargetName';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_BINDINGS = NeedsShorten ? 'b' : 'bindings';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_X = NeedsShorten
    ? 'lp.x'
    : 'LocalPosition.x';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Y = NeedsShorten
    ? 'lp.y'
    : 'LocalPosition.y';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Z = NeedsShorten
    ? 'lp.z'
    : 'LocalPosition.z';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_X = NeedsShorten
    ? 'uv.x'
    : 'UpVector.x';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Y = NeedsShorten
    ? 'uv.y'
    : 'UpVector.y';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_UP_VECTOR_Z = NeedsShorten
    ? 'uv.z'
    : 'UpVector.z';

// export type MarionetterObjectMoveAndLookAtClipInfoProperty =
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOOK_AT_TARGET_NAME
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_BINDINGS
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_X
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Y
//     | typeof MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CLIP_INFO_PROPERTY_LOCAL_POSITION_Z;

// export type MarionetterHumanClipInfo = MarionetterClipInfoBase & {
//     leftShoulderRotation: RawVector3;
// };

// export const MarionetterHumanClipInfoProperty = {
//     bindings: NeedsShorten ? 'b' : 'bindings',
//     leftShoulderRotationX: NeedsShorten ? 'lsr.x' : 'LeftShoulderRotation.x',
//     leftShoulderRotationY: NeedsShorten ? 'lsr.y' : 'LeftShoulderRotation.y',
//     leftShoulderRotationZ: NeedsShorten ? 'lsr.z' : 'LeftShoulderRotation.z',
// } as const;

// export type MarionetterHumanClipInfoProperty =
//     (typeof MarionetterHumanClipInfoProperty)[keyof typeof MarionetterHumanClipInfoProperty];

// export type MarionetterClipBinding = {
//     propertyName: string;
//     keyframes: MarionetterAnimationClipKeyframe[];
//     // shorten
//     n: string;
//     k: MarionetterAnimationClipKeyframe[];
// };

// [name, keyframes]
export type MarionetterClipBinding = [string, MarionetterAnimationClipKeyframe[]];

// export const MARIONETTER_CLIP_BINDING_PROPERTY_PROPERTY_NAME = NeedsShorten ? 'n' : 'propertyName';
// export const MARIONETTER_CLIP_BINDING_PROPERTY_KEYFRAMES = NeedsShorten ? 'k' : 'keyframes';

// // for obj
// export type MarionetterAnimationClipKeyframe = NeedsShorten extends true
//     ? {
//           t: number;
//           v: number;
//           i: number;
//           o: number;
//       }
//     : {
//           time: number;
//           value: number;
//           inTangent: number;
//           outTangent: number;
//       };

// for arr
export type MarionetterAnimationClipKeyframe = number[];

// for obj
export type MarionetterCurveKeyframe = {
    // TODO: うまいことproperty名をまとめられるはず
    time: number;
    value: number;
    inTangent: number;
    outTangent: number;
    // shorten
    t: number;
    v: number;
    i: number;
    o: number;
};

export type MarionetterCurveKeyframeConstraint = NeedsShorten extends true
    ? {
          // shorten
          t: number;
          v: number;
          i: number;
          o: number;
      }
    : {
          time: number;
          value: number;
          inTangent: number;
          outTangent: number;
      };
export const MARIONETTER_CURVE_KEYFRAME_PROPERTY_TIME = NeedsShorten ? 't' : 'time';
export const MARIONETTER_CURVE_KEYFRAME_PROPERTY_VALUE = NeedsShorten ? 'v' : 'value';
export const MARIONETTER_CURVE_KEYFRAME_PROPERTY_IN_TANGENT = NeedsShorten ? 'i' : 'inTangent';
export const MARIONETTER_CURVE_KEYFRAME_PROPERTY_OUT_TANGENT = NeedsShorten ? 'o' : 'outTangent';

// for arr
// export type MarionetterCurveKeyframe = number[];

//
// components
//

// ComponentInfoBase は配列形式でシリアライズされる
// [type, {...残りのプロパティ}]
export type MarionetterComponentInfoBase = [
    MarionetterComponentType, // type
    Record<string, any> // 残りのプロパティ
];

export const MARIONETTER_COMPONENT_INFO_BASE_INDEX_TYPE = 0;
export const MARIONETTER_COMPONENT_INFO_BASE_INDEX_DATA = 1;

// 後方互換性のため残す（deprecated）
export const MARIONETTER_COMPONENT_INFO_BASE_PROPERTY_TYPE = MARIONETTER_COMPONENT_INFO_BASE_INDEX_TYPE;

// unity側に合わせる
export const MARIONETTER_COMPONENT_TYPE_NONE = 0;
export const MARIONETTER_COMPONENT_TYPE_PLAYABLE_DIRECTOR = 1;
export const MARIONETTER_COMPONENT_TYPE_LIGHT = 2;
export const MARIONETTER_COMPONENT_TYPE_CAMERA = 3;
export const MARIONETTER_COMPONENT_TYPE_MESH_RENDERER = 4;
export const MARIONETTER_COMPONENT_TYPE_MESH_FILTER = 5;
export const MARIONETTER_COMPONENT_TYPE_POST_PROCESS_CONTROLLER = 6;
export const MARIONETTER_COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER = 7;
export const MARIONETTER_COMPONENT_TYPE_FBM_NOISE_TEXTURE_CONTROLLER = 8;
export const MARIONETTER_COMPONENT_TYPE_GBUFFER_MATERIAL_CONTROLLER = 9;
// CUSTOM

export type MarionetterComponentType =
    | typeof MARIONETTER_COMPONENT_TYPE_NONE
    | typeof MARIONETTER_COMPONENT_TYPE_PLAYABLE_DIRECTOR
    | typeof MARIONETTER_COMPONENT_TYPE_LIGHT
    | typeof MARIONETTER_COMPONENT_TYPE_CAMERA
    | typeof MARIONETTER_COMPONENT_TYPE_MESH_RENDERER
    | typeof MARIONETTER_COMPONENT_TYPE_MESH_FILTER
    | typeof MARIONETTER_COMPONENT_TYPE_POST_PROCESS_CONTROLLER
    | typeof MARIONETTER_COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER
    | typeof MARIONETTER_COMPONENT_TYPE_FBM_NOISE_TEXTURE_CONTROLLER
    | typeof MARIONETTER_COMPONENT_TYPE_GBUFFER_MATERIAL_CONTROLLER;

export type MarionetterComponentInfoKinds =
    | MarionetterPlayableDirectorComponentInfo
    | MarionetterLightComponentInfo
    | MarionetterSpotLightComponentInfo
    | MarionetterDirectionalLightComponentInfo
    | MarionetterCameraComponentInfo
    | MarionetterMeshRendererComponentInfo
    | MarionetterMeshFilterComponentInfo
    // | MarionetterVolumeComponentInfo
    | MarionetterPostProcessControllerComponentInfo
    | MarionetterObjectMoveAndLookAtControllerComponentInfo
    | MarionetterFbmNoiseTextureControllerComponentInfo
    | MarionetterGBufferMaterialControllerComponentInfo;

// unity側に合わせてcomponent情報を追加

// playable director component
// [type, {n, d, ts}]
export type MarionetterPlayableDirectorComponentInfo = [
    MarionetterComponentType,
    {
        name: string;
        duration: number;
        tracks: MarionetterTrackInfoKinds[];
        // shorten
        n: string;
        d: number;
        ts: MarionetterTrackInfoKinds[];
    }
];

export const MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_NAME = NeedsShorten ? 'n' : 'name';
export const MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_DURATION = NeedsShorten ? 'd' : 'duration';
export const MARIONETTER_PLAYABLE_DIRECTOR_COMPONENT_INFO_PROPERTY_TRACKS = NeedsShorten ? 'ts' : 'tracks';

// Light component info is now stored as an array:
// [type, [...lightData]]
// lightData is an array:
//   Directional: [lightType, intensity, color]
//   Spot: [lightType, intensity, color, range, innerSpotAngle, spotAngle]
// lightType is a number: 0=Directional, 1=Spot, 2=Point
export type MarionetterLightComponentInfo = [
    MarionetterComponentType,
    [number, number, string] // [lightType, intensity, color]
];

// export const MARIONETTER_LIGHT_COMPONENT_INFO_PROPERTY_DATA = NeedsShorten ? 'l' : 'lightData';

// Array indices for light component data
export const MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_LIGHT_TYPE = 0;
export const MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_INTENSITY = 1;
export const MARIONETTER_LIGHT_COMPONENT_INFO_INDEX_COLOR = 2;

// light: directional light
// [type, [...lightData]]
export type MarionetterDirectionalLightComponentInfo = [
    MarionetterComponentType,
    [0, number, string] // [LIGHT_TYPE_DIRECTIONAL, intensity, color]
];

// light: spotlight
// [type, [...lightData]]
export type MarionetterSpotLightComponentInfo = [
    MarionetterComponentType,
    [1, number, string, number, number, number] // [LIGHT_TYPE_SPOT, intensity, color, range, innerSpotAngle, spotAngle]
];

// Array indices for spot light component data (indices 0-2 are same as base light)
export const MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_RANGE = 3;
export const MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_INNER_SPOT_ANGLE = 4;
export const MARIONETTER_SPOT_LIGHT_COMPONENT_INFO_INDEX_SPOT_ANGLE = 5;

// // volume: postprocess
//
// export type MarionetterVolumeVolumeLayerBase = {
//     layerType: 'Bloom' | 'DepthOfField';
//     // shorten
//     l: 'Bloom' | 'DepthOfField';
// };
//
// export const MarionetterVolumeVolumeLayerBaseProperty = {
//     layerType: NeedsShorten ? 'l' : 'layerType',
// } as const;
//
// export type MarionetterVolumeLayerBloom = MarionetterVolumeVolumeLayerBase & {
//     intensity: number;
//     // shorten
//     bl_i: number;
// };
//
// export const MarionetterVolumeLayerBloomProperty = {
//     intensity: NeedsShorten ? 'bl_i' : 'intensity',
// } as const;
//
// export type MarionetterVolumeLayerDepthOfField = MarionetterVolumeVolumeLayerBase & {
//     focusDistance: number;
//     // shorten
//     dof_fd: number;
// };
//
// export const MarionetterVolumeLayerDepthOfFieldProperty = {
//     focusDistance: NeedsShorten ? 'dof_fd' : 'focusDistance',
// } as const;
//
// export type MarionetterVolumeLayerVignette = MarionetterVolumeVolumeLayerBase & {
//     intensity: number;
//     // shorten
//     vi_i: number;
// };
//
// export const MarionetterVolumeLayerVignetteProperty = {
//     intensity: NeedsShorten ? 'vi_i' : 'intensity',
// } as const;
//
// export type MarionetterVolumeLayerVolumetricLight = MarionetterVolumeVolumeLayerBase & {
//     volumetricLightRayStep: number;
//     // shorten
//     vl_rs: number;
// };
//
// export const MarionetterVolumeLayerVolumetricLightProperty = {
//     volumetricLightRayStep: NeedsShorten ? 'vl_rs' : 'volumetricLightRayStep',
// } as const;
//
// export type MarionetterVolumeLayerKinds =
//     | MarionetterVolumeLayerBloom
//     | MarionetterVolumeLayerDepthOfField
//     | MarionetterVolumeLayerVignette
//     | MarionetterVolumeLayerVolumetricLight;
//
// export type MarionetterVolumeComponentInfo = MarionetterComponentInfoBase & {
//     volumeLayers: MarionetterVolumeLayerKinds[];
//     // shorten
//     vl: MarionetterVolumeLayerKinds[];
// };
//
// export const MarionetterVolumeComponentInfoProperty = {
//     volumeLayers: NeedsShorten ? 'vl' : 'volumeLayers',
// } as const;

// camera
// [type, {ct, im, f}]
export type MarionetterCameraComponentInfo = [
    MarionetterComponentType,
    {
        cameraType: 'Perspective' | 'Orthographic';
        isMain: boolean;
        fov: number;
        // shorten
        ct: 'Perspective' | 'Orthographic';
        im: boolean;
        f: number;
    }
];

export const MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_CAMERA_TYPE = NeedsShorten ? 'ct' : 'cameraType';
export const MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_IS_MAIN = NeedsShorten ? 'im' : 'isMain';
export const MARIONETTER_CAMERA_COMPONENT_INFO_PROPERTY_FOV = NeedsShorten ? 'f' : 'fov';

// material

export const MARIONETTER_MATERIAL_TYPE_NONE = 0;
export const MARIONETTER_MATERIAL_TYPE_LIT = 1;
export const MARIONETTER_MATERIAL_TYPE_UNLIT = 2;

export type MarionetterMaterialType =
    | typeof MARIONETTER_MATERIAL_TYPE_NONE
    | typeof MARIONETTER_MATERIAL_TYPE_LIT
    | typeof MARIONETTER_MATERIAL_TYPE_UNLIT;

// [type, color]
export type MarionetterUnlitMaterialInfo = [
    MarionetterMaterialType, // 0: type
    string, // 1: color
];

// [type, color, tiling, metallic, roughness, emission, receiveShadow]
export type MarionetterLitMaterialInfo = [
    MarionetterMaterialType, // 0: type
    string, // 1: color
    RawVector4, // 2: tiling
    number, // 3: metallic
    number, // 4: roughness
    string, // 5: emission
    number, // 6: receiveShadow
];

// Array indices for material info
export const MARIONETTER_MATERIAL_INFO_TYPE_INDEX = 0;
export const MARIONETTER_MATERIAL_INFO_COLOR_INDEX = 1;
export const MARIONETTER_LIT_MATERIAL_INFO_TILING_INDEX = 2;
export const MARIONETTER_LIT_MATERIAL_INFO_METALLIC_INDEX = 3;
export const MARIONETTER_LIT_MATERIAL_INFO_ROUGHNESS_INDEX = 4;
export const MARIONETTER_LIT_MATERIAL_INFO_EMISSION_INDEX = 5;
export const MARIONETTER_LIT_MATERIAL_INFO_RECEIVE_SHADOW_INDEX = 6;

// merge
export type MarionetterMaterialKinds = MarionetterLitMaterialInfo | MarionetterUnlitMaterialInfo;

// --- mesh renderer
// [type, {mn, m}]
export type MarionetterMeshRendererComponentInfo = [
    MarionetterComponentType,
    {
        materialName: string;
        material: MarionetterMaterialKinds;
        // shorten
        mn: string;
        m: MarionetterMaterialKinds;
    }
];

export const MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL_NAME = NeedsShorten ? 'mn' : 'materialName';
export const MARIONETTER_MESH_RENDERER_COMPONENT_INFO_PROPERTY_MATERIAL = NeedsShorten ? 'm' : 'material';

// mesh filter
// [type, {mn}]
export type MarionetterMeshFilterComponentInfo = [
    MarionetterComponentType,
    {
        meshName: string;
        // shorten
        mn: string;
    }
];

export const MARIONETTER_MESH_FILTER_COMPONENT_INFO_PROPERTY_MESH_NAME = NeedsShorten ? 'mn' : 'meshName';

// post process controller component
// [type, {...all properties}]
export type MarionetterPostProcessControllerComponentInfo = [
    MarionetterComponentType,
    {
    screenSpaceShadowEnabled: number;
    screenSpaceShadowBias: number;
    screenSpaceShadowJitterSize: RawVector3;
    screenSpaceShadowSharpness: number;
    screenSpaceShadowStrength: number;
    screenSpaceShadowRatio: number;
    screenSpaceShadowRayStepMultiplier: number;

    ambientOcclusionEnabled: number;
    ambientOcclusionSampleLength: number;
    ambientOcclusionBias: number;
    ambientOcclusionMinDistance: number;
    ambientOcclusionMaxDistance: number;
    ambientOcclusionColor: string;
    ambientOcclusionPower: number;
    ambientOcclusionStrength: number;
    ambientOcclusionBlendRate: number;

    screenSpaceReflectionEnabled: number;
    screenSpaceReflectionRayDepthBias: number;
    screenSpaceReflectionRayNearestDistance: number;
    screenSpaceReflectionRayMaxDistance: number;
    screenSpaceReflectionRayThickness: number;
    screenSpaceReflectionRayJitterSize: RawVector2;
    screenSpaceReflectionFadeMinDistance: number;
    screenSpaceReflectionFadeMaxDistance: number;
    screenSpaceReflectionScreenEdgeFadeFactorMin: RawVector2;
    screenSpaceReflectionScreenEdgeFadeFactorMax: RawVector2;
    screenSpaceReflectionRoughnessPower: number;
    screenSpaceReflectionAdditionalRate: number;
    screenSpaceReflectionBlendRate: number;

    lightShaftEnabled: number;
    lightShaftRatio: number;
    lightShaftBlendRate: number;
    lightShaftPassScaleBase: number;
    lightShaftRayStepStrength: number;

    volumetricLightEnabled: number;
    volumetricLightRayStep: number;
    volumetricLightBlendRate: number;
    volumetricLightDensityMultiplier: number;
    volumetricLightRayJitterSize: RawVector3;
    volumetricLightRatio: number;

    fogEnabled: number;
    fogColor: string;
    fogStrength: number;
    fogDensity: number;
    fogDensityAttenuation: number;
    fogEndHeight: number;
    fogDistanceStart: number;
    fogDistanceEnd: number;
    fogDistancePower: number;
    fogSSSRate: number;
    fogSSSFogColor: string;
    fogBlendRate: number;

    depthOfFieldFocusEnabled: number;
    depthOfFieldFocusDistance: number;
    depthOfFieldFocusRange: number;
    depthOfFieldBokehRadius: number;

    bloomEnabled: number;
    bloomAmount: number;
    bloomTone: number;
    bloomThreshold: number;

    streakEnabled: number;
    streakThreshold: number;
    streakStretch: number;
    streakColor: string;
    streakIntensity: number;
    streakVerticalScale: number;
    streakHorizontalScale: number;

    vignetteEnabled: number;
    vignetteRadiusFrom: number;
    vignetteRadiusTo: number;
    vignettePower: number;
    vignetteBlendRate: number;

    chromaticAberrationEnabled: number;
    chromaticAberrationScale: number;
    chromaticAberrationPower: number;
    chromaticAberrationBlendRate: number;

    glitchEnabled: number;
    glitchBlendRate: number;

    colorCurtainEnabled: number;
    colorCurtainColor: string;
    colorCurtainBlendRate: number;

    // shorten ---

    sss_on: number;
    sss_b: number;
    sss_js: RawVector3;
    sss_sh: number;
    sss_s: number;
    sss_r: number;
    sss_rsm: number;

    ao_on: number;
    ao_sl: number;
    ao_b: number;
    ao_mid: number;
    ao_mad: number;
    ao_c: string;
    ao_p: number;
    ao_s: number;
    ao_br: number;

    ssr_on: number;
    ssr_rdb: number;
    ssr_rnd: number;
    ssr_rmd: number;
    ssr_rt: number;
    ssr_rj: RawVector2;
    ssr_fmd: number;
    ssr_fxd: number;
    ssr_seffm: RawVector2;
    ssr_seffM: RawVector2;
    ssr_rp: number;
    ssr_ar: number;
    ssr_br: number;

    ls_on: number;
    ls_r: number;
    ls_br: number;
    ls_psb: number;
    ls_rss: number;

    vl_on: number;
    vl_rs: number;
    vl_br: number;
    vl_dm: number;
    vl_rjs: RawVector3;
    vl_r: number;

    fg_on: number;
    fg_c: string;
    fg_s: number;
    fg_d: number;
    fg_da: number;
    fg_eh: number;
    fg_ds: number;
    fg_de: number;
    fg_dp: number;
    fg_sss_r: number;
    fg_sss_fc: string;
    fg_br: number;

    dof_on: number;
    dof_fd: number;
    dof_fr: number;
    dof_br: number;

    bl_on: number;
    bl_a: number;
    bl_to: number;
    bl_th: number;

    sk_on: number;
    sk_th: number;
    sk_st: number;
    sk_c: string;
    sk_i: number;
    sk_vs: number;
    sk_hs: number;

    vg_on: number;
    vg_rf: number;
    vg_rt: number;
    vg_p: number;
    vg_br: number;

    ca_on: number;
    ca_s: number;
    ca_p: number;
    ca_br: number;

    gl_on: number;
    gl_br: number;

    cc_on: number;
    cc_c: string;
    cc_br: number;
    }
]; 

// export const MARIONETTER_POST_PROCESS_CONTROLLER_COMPONENT_INFO_PROPERTY_BLOOM_AMOUNT = NeedsShorten
//     ? 'bl_a'
//     : 'bloomAmount';

// object move and look at controller component
// [type, {lp, tn, uv}]
export type MarionetterObjectMoveAndLookAtControllerComponentInfo = [
    MarionetterComponentType,
    {
        localPosition: RawVector3;
        lookAtTargetName: string;
        upVector: RawVector3;
        // shorten
        lp: RawVector3;
        tn: string;
        uv: RawVector3;
    }
];

// wip
// export type MarionetterObjectMoveAndLookAtControllerComponentInfo = [
//     // prettier-ignore
//     MarionetterComponentType, // type
//     string, // name
//     number, number, number, // lp: 2-4
// ];

export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOCAL_POSITION = NeedsShorten
    ? 'lp'
    : 'localPosition';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_LOOK_AT_TARGET_NAME = NeedsShorten
    ? 'tn'
    : 'lookAtTargetName';
export const MARIONETTER_OBJECT_MOVE_AND_LOOK_AT_CONTROLLER_COMPONENT_INFO_PROPERTY_UP_VECTOR = NeedsShorten
    ? 'uv'
    : 'upVector';

// fbm noise texture controller component
// [type, {gs, o, a, f, fa}]
export type MarionetterFbmNoiseTextureControllerComponentInfo = [
    MarionetterComponentType,
    {
        gridSize: RawVector2;
        octaves: number;
        amplitude: number;
        frequency: number;
        factor: number;
    }
];

export const MARIONETTER_FBM_NOISE_TEXTURE_CONTROLLER_COMPONENT_INFO_PROPERTY_GRID_SIZE = NeedsShorten
    ? 'gs'
    : 'gridSize';
export const MARIONETTER_FBM_NOISE_TEXTURE_CONTROLLER_COMPONENT_INFO_PROPERTY_OCTAVES = NeedsShorten ? 'o' : 'octaves';
export const MARIONETTER_FBM_NOISE_TEXTURE_CONTROLLER_COMPONENT_INFO_PROPERTY_AMPLITUDE = NeedsShorten
    ? 'a'
    : 'amplitude';
export const MARIONETTER_FBM_NOISE_TEXTURE_CONTROLLER_COMPONENT_INFO_PROPERTY_FREQUENCY = NeedsShorten
    ? 'f'
    : 'frequency';
export const MARIONETTER_FBM_NOISE_TEXTURE_CONTROLLER_COMPONENT_INFO_PROPERTY_FACTOR = NeedsShorten ? 'fa' : 'factor';

// gbuffer material controller component
// [type, [...data]]
export type MarionetterGBufferMaterialControllerComponentInfo = [
    MarionetterComponentType,
    [string, number, number, string, RawVector4, number] // [baseColor, metallic, roughness, emissiveColor, textureTilingOffset, heightScale]
];

// export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_COMPONENT_INFO_PROPERTY_DATA = NeedsShorten ? 'd' : 'data';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_INDEX = 0;
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_INDEX = 1;
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_INDEX = 2;
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_INDEX = 3;
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_TEXTURE_TILING_OFFSET_INDEX = 4;
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_HEIGHT_SCALE_INDEX = 5;

export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_BASE_COLOR_PROPERTY_NAME = NeedsShorten ? 'gbm_bc' : 'BaseColor';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_METALLIC_PROPERTY_NAME = NeedsShorten ? 'gbm_m' : 'Metallic';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_ROUGHNESS_PROPERTY_NAME = NeedsShorten ? 'gbm_r' : 'Roughness';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_EMISSIVE_COLOR_PROPERTY_NAME = NeedsShorten ? 'gbm_ec' : 'EmissiveColor';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_TEXTURE_TILING_OFFSET_PROPERTY_NAME = NeedsShorten ? 'gbm_to' : 'TextureTilingOffset';
export const MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_DATA_HEIGHT_SCALE_PROPERTY_NAME = NeedsShorten ? 'gbm_hs' : 'HeightScale';


// //
// // post process component properties
// //

// export const MarionetterPostProcessBloom = {
//     bloomAmount: NeedsShorten ? 'bl_i' : 'bloomAmount',
// } as const;
// export type MarionetterPostProcessBloomIntensity =
//     (typeof MarionetterPostProcessBloom)[keyof typeof MarionetterPostProcessBloom];
//
// export const MarionetterPostProcessDepthOfField = {
//     focusDistance: NeedsShorten ? 'dof_fd' : 'depthOfFieldFocusDistance',
// } as const;
// export type MarionetterPostProcessDepthOfFieldFocusDistance =
//     (typeof MarionetterPostProcessDepthOfField)[keyof typeof MarionetterPostProcessDepthOfField];
//
// export const MarionetterPostProcessVignette = {
//     vignetteIntensity: NeedsShorten ? 'vi_i' : 'vignetteIntensity',
// } as const;
// export type MarionetterPostProcessVignetteIntensity =
//     (typeof MarionetterPostProcessVignette)[keyof typeof MarionetterPostProcessVignette];
//
// export const MarionetterPostProcessVolumetricLight = {
//     volumetricLightRayStep: NeedsShorten ? 'vl_rs' : 'volumetricLightRayStep',
// } as const;
// export type MarionetterPostProcessVolumetricLightRayStep =
//     (typeof MarionetterPostProcessVolumetricLight)[keyof typeof MarionetterPostProcessVolumetricLight];

//
// timeline
//

export type MarionetterTimelineExecuteArgs = { time: number; scene: Scene };

export type MarionetterTimeline = {
    // tracks: MarionetterTimelineTrack[];
    tracks: MarionetterTimelineTrackKinds[];
    execute: (args: MarionetterTimelineExecuteArgs) => void;
    bindActors: (actors: Actor[]) => void;
    duration: number;
};

// export type MarionetterTimelineTrack = {
//     targetName: string;
//     // targetObj: Actor | null;
//     clips: MarionetterClipKinds[];
//     signalEmitters: MarionetterSignalEmitter[];
//     execute: (time: number) => void;
// };

export type MarionetterTimelineTrackExecuteArgs = { time: number; scene: Scene };

export type MarionetterTimelineTrackBase = {
    execute: (args: MarionetterTimelineTrackExecuteArgs) => void;
};

export const MARIONETTER_TRACK_TYPE_DEFAULT = 0;
export const MARIONETTER_TRACK_TYPE_MARKER = 1;
export type MarionetterTrackType = typeof MARIONETTER_TRACK_TYPE_DEFAULT | typeof MARIONETTER_TRACK_TYPE_MARKER;

export type MarionetterTimelineDefaultTrack = {
    name: string;
    trackType: MarionetterTrackType;
    targetName: string;
    targetActor: Actor;
    clips: MarionetterClipKinds[];
} & MarionetterTimelineTrackBase;

export type MarionetterTimelineMarkerTrack = {
    name: string;
    trackType: MarionetterTrackType;
    signalEmitters: MarionetterTimelineSignalEmitter[];
} & MarionetterTimelineTrackBase;

export type MarionetterTimelineSignalEmitter = {
    name: string;
    time: number;
    triggered: boolean;
    execute: (time: number) => void;
};

export type MarionetterTimelineTrackKinds = MarionetterTimelineDefaultTrack | MarionetterTimelineMarkerTrack;

export type MarionetterClipKinds =
    | MarionetterAnimationClip
    | MarionetterLightControlClip
    | MarionetterActivationControlClip
    | MarionetterObjectMoveAndLookAtClip;

export const MARIONETTER_CLIP_TYPE_NONE = 0;
export const MARIONETTER_CLIP_TYPE_ANIMATION_CLIP = 1;
export const MARIONETTER_CLIP_TYPE_LIGHT_CONTROL_CLIP = 2;
export const MARIONETTER_CLIP_TYPE_ACTIVATION_CONTROL_CLIP = 3;
export const MARIONETTER_CLIP_TYPE_SIGNAL_EMITTER = 4;
export const MARIONETTER_CLIP_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP = 5;
// CUSTOM
// HumanClip: 6

export type MarionetterClipType =
    | typeof MARIONETTER_CLIP_TYPE_NONE
    | typeof MARIONETTER_CLIP_TYPE_ANIMATION_CLIP
    | typeof MARIONETTER_CLIP_TYPE_LIGHT_CONTROL_CLIP
    | typeof MARIONETTER_CLIP_TYPE_ACTIVATION_CONTROL_CLIP
    | typeof MARIONETTER_CLIP_TYPE_SIGNAL_EMITTER
    | typeof MARIONETTER_CLIP_TYPE_OBJECT_MOVE_AND_LOOK_AT_CLIP;

export type MarionetterClipArgs = { actor: Actor; time: number; scene: Scene };

export type MarionetterAnimationClipBase = {
    name: string;
    type: MarionetterClipType;
};

export type MarionetterAnimationClip = MarionetterAnimationClipBase & {
    // type: MarionetterAnimationClipType.AnimationClip;
    clipInfo: MarionetterAnimationClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

export type MarionetterLightControlClip = MarionetterAnimationClipBase & {
    // type: MarionetterAnimationClipType.LightControlClip;
    clipInfo: MarionetterLightControlClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

export type MarionetterActivationControlClip = MarionetterAnimationClipBase & {
    // type: MarionetterAnimationClipType.ActivationControlClip;
    clipInfo: MarionetterActivationControlClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

// TODO: signal emitter

export type MarionetterObjectMoveAndLookAtClip = MarionetterAnimationClipBase & {
    // type: MarionetterAnimationClipType.ObjectMoveAndLookAtClip;
    clipInfo: MarionetterObjectMoveAndLookAtClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

// export type MarionetterHumanClip = MarionetterAnimationClipBase & {
//     // type: MarionetterAnimationClipType.HumanClip;
//     clipInfo: MarionetterHumanClipInfo;
//     execute: (args: MarionetterClipArgs) => void;
// };

//
// timeline properties
//

export const TIMELINE_PROPERTY_BINDER_TYPE_FLOAT = 0;
export const TIMELINE_PROPERTY_BINDER_TYPE_VECTOR2 = 1;
export const TIMELINE_PROPERTY_BINDER_TYPE_VECTOR3 = 2;
export const TIMELINE_PROPERTY_BINDER_TYPE_VECTOR4 = 3;
export const TIMELINE_PROPERTY_BINDER_TYPE_COLOR = 4;
export type TimelinePropertyBinderType =
    | typeof TIMELINE_PROPERTY_BINDER_TYPE_FLOAT
    | typeof TIMELINE_PROPERTY_BINDER_TYPE_VECTOR2
    | typeof TIMELINE_PROPERTY_BINDER_TYPE_VECTOR3
    | typeof TIMELINE_PROPERTY_BINDER_TYPE_VECTOR4
    | typeof TIMELINE_PROPERTY_BINDER_TYPE_COLOR;

export const TIMELINE_PROPERTY_BINDER_TARGET_MATERIAL = 0;
export type TimelinePropertyBinderTarget = typeof TIMELINE_PROPERTY_BINDER_TARGET_MATERIAL;

export type TimelinePropertyValue = number | Vector2 | Vector3 | Vector4 | Color;

//
// camera controller
//

export type MarionetterCameraControllerInfo = {
    near: number;
    far: number;
    fov: number;
    // shorten
    nc: number;
    fc: number;
    f: number;
};

export const MARIONETTER_CAMERA_CONTROLLER_INFO_PROPERTY_NEAR = NeedsShorten ? 'nc' : 'near';
export const MARIONETTER_CAMERA_CONTROLLER_INFO_PROPERTY_FAR = NeedsShorten ? 'fc' : 'far';
export const MARIONETTER_CAMERA_CONTROLLER_INFO_PROPERTY_FOV = NeedsShorten ? 'f' : 'fov';
