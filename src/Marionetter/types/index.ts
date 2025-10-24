import { Actor } from '@/PaleGL/actors/actor.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { Color } from '@/PaleGL/math/color.ts';
import { RawVector2 } from '@/PaleGL/math/vector2.ts';
import { RawVector3 } from '@/PaleGL/math/vector3.ts';
import { RawVector4 } from '@/PaleGL/math/vector4.ts';

//
// settings
//

// TODO: 2回プロパティを書かなきゃいけないのが冗長かつミスる可能性高くなるが一旦・・・
export type NeedsShorten = true;
export const NeedsShorten = true;

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

export const MarionetterSceneProperty = {
    objects: NeedsShorten ? 'o' : 'objects',
} as const;

export type MarionetterObjectInfo = {
    name: string;
    transform: MarionetterTransformInfo;
    components: MarionetterComponentInfoKinds[];
    children: MarionetterObjectInfo[];
    // shorten
    n: string;
    t: MarionetterTransformInfo;
    co: MarionetterComponentInfoKinds[];
    ch: MarionetterObjectInfo[];
};

export const MarionetterObjectInfoProperty = {
    name: NeedsShorten ? 'n' : 'name',
    transform: NeedsShorten ? 't' : 'transform',
    components: NeedsShorten ? 'co' : 'components',
    children: NeedsShorten ? 'ch' : 'children',
} as const;

export type MarionetterTransformInfo = {
    localPosition: { x: number; y: number; z: number };
    localRotation: { x: number; y: number; z: number; w: number };
    localScale: { x: number; y: number; z: number };
    // shorten
    lp: { x: number; y: number; z: number };
    lr: { x: number; y: number; z: number; w: number };
    ls: { x: number; y: number; z: number };
};

export const MarionetterTransformInfoProperty = {
    localPosition: NeedsShorten ? 'lp' : 'localPosition',
    localRotation: NeedsShorten ? 'lr' : 'localRotation',
    localScale: NeedsShorten ? 'ls' : 'localScale',
} as const;

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

export type MarionetterTrackInfoBase = {
    type: MarionetterTrackInfoType;
    // shorten
    t: MarionetterTrackInfoType;
};

export const MarionetterTrackInfoBaseProperty = {
    type: NeedsShorten ? 't' : 'type',
} as const;

export type MarionetterDefaultTrackInfo = MarionetterTrackInfoBase & {
    targetName: string;
    clips: MarionetterClipInfoKinds[];
    // shorten
    tn: string;
    cs: MarionetterClipInfoKinds[];
};

export const MarionetterDefaultTrackInfoProperty = {
    targetName: NeedsShorten ? 'tn' : 'targetName',
    clips: NeedsShorten ? 'cs' : 'clips',
} as const;

export type MarionetterMarkerTrackInfo = MarionetterTrackInfoBase & {
    signalEmitters: MarionetterSignalEmitter[];
    // shorten
    ses: MarionetterSignalEmitter[];
};

export const MarionetterMarkerTrackInfoProperty = {
    signalEmitters: NeedsShorten ? 'ses' : 'signalEmitters',
} as const;

export type MarionetterTrackInfoKinds = MarionetterDefaultTrackInfo | MarionetterMarkerTrackInfo;

export type MarionetterSignalEmitter = {
    name: string;
    time: number;
    // shorten
    n: string;
    t: number;
};

export const MarionetterSignalEmitterProperty = {
    name: NeedsShorten ? 'n' : 'name',
    time: NeedsShorten ? 't' : 'time',
} as const;

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

export type MarionetterClipInfoBase = {
    type: MarionetterClipInfoType;
    start: number;
    duration: number;
    // shorten
    t: MarionetterClipInfoType;
    s: number;
    d: number;
};

export const MarionetterClipInfoBaseProperty = {
    type: NeedsShorten ? 't' : 'type',
    start: NeedsShorten ? 's' : 'start',
    duration: NeedsShorten ? 'd' : 'duration',
} as const;

// NOTE: unity側に合わせる
export const MarionetterAnimationClipType = {
    Default: 0,
    GBufferMaterial: 1,
    // custom
} as const;

export type MarionetterAnimationClipType =
    (typeof MarionetterAnimationClipType)[keyof typeof MarionetterAnimationClipType];

export type MarionetterAnimationClipInfo = MarionetterClipInfoBase & {
    animationClipType: MarionetterAnimationClipType;
    offsetPosition: { x: number; y: number; z: number };
    offsetRotation: { x: number; y: number; z: number };
    bindings: MarionetterClipBinding[];
    // shorten
    act: MarionetterAnimationClipType;
    op: { x: number; y: number; z: number };
    or: { x: number; y: number; z: number };
    b: MarionetterClipBinding[];
};

export const MarionetterAnimationClipInfoProperty = {
    animationClipType: NeedsShorten ? 'act' : 'animationClipType',
    offsetPosition: NeedsShorten ? 'op' : 'offsetPosition',
    offsetRotation: NeedsShorten ? 'or' : 'offsetRotation',
    bindings: NeedsShorten ? 'b' : 'bindings',
} as const;

export type MarionetterLightControlClipInfo = MarionetterClipInfoBase & {
    bindings: MarionetterClipBinding[];
    // shorten
    b: MarionetterClipBinding[];
};

export const MarionetterLightControlClipInfoProperty = {
    bindings: NeedsShorten ? 'b' : 'bindings',
} as const;

export type MarionetterActivationControlClipInfo = MarionetterClipInfoBase;

// TODO: signal emitter

export type MarionetterObjectMoveAndLookAtClipInfo = MarionetterClipInfoBase & {
    localPosition: RawVector3;
    lookAtTargetName: string;
    bindings: MarionetterClipBinding[];
    // shorten
    lp: RawVector3;
    tn: string;
    b: MarionetterClipBinding[];
};

export const MarionetterObjectMoveAndLookAtClipInfoProperty = {
    localPosition: NeedsShorten ? 'lp' : 'localPosition',
    lookAtTargetName: NeedsShorten ? 'tn' : 'lookAtTargetName',
    bindings: NeedsShorten ? 'b' : 'bindings',
    localPositionX: NeedsShorten ? 'lp.x' : 'LocalPosition.x',
    localPositionY: NeedsShorten ? 'lp.y' : 'LocalPosition.y',
    localPositionZ: NeedsShorten ? 'lp.z' : 'LocalPosition.z',
} as const;

export type MarionetterObjectMoveAndLookAtClipInfoProperty =
    (typeof MarionetterObjectMoveAndLookAtClipInfoProperty)[keyof typeof MarionetterObjectMoveAndLookAtClipInfoProperty];

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

export type MarionetterClipBinding = {
    propertyName: string;
    keyframes: MarionetterAnimationClipKeyframe[];
    // shorten
    n: string;
    k: MarionetterAnimationClipKeyframe[];
};

export const MarionetterClipBindingProperty = {
    propertyName: NeedsShorten ? 'n' : 'propertyName',
    keyframes: NeedsShorten ? 'k' : 'keyframes',
} as const;

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
export const MarionetterCurveKeyframeProperty = {
    time: NeedsShorten ? 't' : 'time',
    value: NeedsShorten ? 'v' : 'value',
    inTangent: NeedsShorten ? 'i' : 'inTangent',
    outTangent: NeedsShorten ? 'o' : 'outTangent',
} as const;

// for arr
// export type MarionetterCurveKeyframe = number[];

//
// components
//

export type MarionetterComponentInfoBase = {
    type: MarionetterComponentType;
    // shorten
    t: MarionetterComponentType;
};

export const MarionetterComponentInfoBaseProperty = {
    type: NeedsShorten ? 't' : 'type',
} as const;

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

export type MarionetterPlayableDirectorComponentInfo = MarionetterComponentInfoBase & {
    name: string;
    duration: number;
    tracks: MarionetterTrackInfoKinds[];
    // shorten
    n: string;
    d: number;
    ts: MarionetterTrackInfoKinds[];
};

export const MarionetterPlayableDirectorComponentInfoProperty = {
    name: NeedsShorten ? 'n' : 'name',
    duration: NeedsShorten ? 'd' : 'duration',
    tracks: NeedsShorten ? 'ts' : 'tracks',
} as const;

export type MarionetterLightComponentInfo = MarionetterComponentInfoBase & {
    lightType: 'Directional' | 'Point' | 'Spot';
    intensity: number;
    color: string;
    // shorten
    l: 'Directional' | 'Point' | 'Spot';
    i: number;
    c: string; // hex string
};

export const MarionetterLightComponentInfoProperty = {
    lightType: NeedsShorten ? 'l' : 'lightType',
    intensity: NeedsShorten ? 'i' : 'intensity',
    color: NeedsShorten ? 'c' : 'color',
} as const;

// light: directional light

export type MarionetterDirectionalLightComponentInfo = MarionetterLightComponentInfo & {
    lightType: 'Directional';
    // shorten
    l: 'Directional';
};

export const MarionetterDirectionalLightComponentInfoProperty = {
    lightType: NeedsShorten ? 'l' : 'lightType',
} as const;

// light: spotlight

export type MarionetterSpotLightComponentInfo = MarionetterLightComponentInfo & {
    lightType: 'Spot';
    range: number;
    innerSpotAngle: number;
    spotAngle: number;
    // shorten
    l: 'Spot';
    r: number;
    isa: number;
    sa: number;
};

export const MarionetterSpotLightComponentInfoProperty = {
    lightType: NeedsShorten ? 'l' : 'lightType',
    range: NeedsShorten ? 'r' : 'range',
    innerSpotAngle: NeedsShorten ? 'isa' : 'innerSpotAngle',
    spotAngle: NeedsShorten ? 'sa' : 'spotAngle',
} as const;

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

export type MarionetterCameraComponentInfo = MarionetterComponentInfoBase & {
    cameraType: 'Perspective' | 'Orthographic';
    isMain: boolean;
    fov: number;
    // shorten
    ct: 'Perspective' | 'Orthographic';
    im: boolean;
    f: number;
};

export const MarionetterCameraComponentInfoProperty = {
    cameraType: NeedsShorten ? 'ct' : 'cameraType',
    isMain: NeedsShorten ? 'im' : 'isMain',
    fov: NeedsShorten ? 'f' : 'fov',
} as const;

// material

export const MARIONETTER_MATERIAL_TYPE_NONE = 0;
export const MARIONETTER_MATERIAL_TYPE_LIT = 1;
export const MARIONETTER_MATERIAL_TYPE_UNLIT = 2;

export type MarionetterMaterialType =
    | typeof MARIONETTER_MATERIAL_TYPE_NONE
    | typeof MARIONETTER_MATERIAL_TYPE_LIT
    | typeof MARIONETTER_MATERIAL_TYPE_UNLIT;

export type MarionetterMaterialInfo = {
    type: MarionetterMaterialType;
    name: string;
    // shorten
    t: MarionetterMaterialType;
    n: string;
};

export const MarionetterMaterialInfoProperty = {
    type: NeedsShorten ? 't' : 'type',
    name: NeedsShorten ? 'n' : 'name',
} as const;

export type MarionetterLitMaterialInfo = MarionetterMaterialInfo & {
    color: string;
    metallic: number;
    tiling: RawVector4;
    roughness: number;
    emission: string;
    receiveShadow: number;
    // shorten
    c: string; // hex string
    ti: RawVector4;
    m: number;
    r: number;
    e: string; // hex string (rgbi ... i is intensity)
    rs: number;
};

export const MarionetterLitMaterialInfoProperty = {
    color: NeedsShorten ? 'c' : 'color',
    tiling: NeedsShorten ? 'ti' : 'tiling',
    metallic: NeedsShorten ? 'm' : 'metallic',
    roughness: NeedsShorten ? 'r' : 'roughness',
    emission: NeedsShorten ? 'e' : 'emission',
    receiveShadow: NeedsShorten ? 'rs' : 'receiveShadow',
} as const;

export type MarionetterUnlitMaterialInfo = MarionetterMaterialInfo & {
    color: string;
    receiveShadow: number;
    // emission: string;
    // shorten
    c: string; // hex string
    // e : string; // hex string (rgbi ... i is intensity)
    rs: number;
};

export const MarionetterUnlitMaterialInfoProperty = {
    color: NeedsShorten ? 'c' : 'color',
    // emission: NeedsShorten ? 'e' : 'emission',
    receiveShadow: NeedsShorten ? 'rs' : 'receiveShadow',
} as const;

// merge
export type MarionetterMaterialKinds = MarionetterLitMaterialInfo & MarionetterUnlitMaterialInfo;

// --- mesh renderer

export type MarionetterMeshRendererComponentInfo = MarionetterComponentInfoBase & {
    materialName: string;
    material: MarionetterMaterialKinds;
    // shorten
    mn: string;
    m: MarionetterMaterialKinds;
};

export const MarionetterMeshRendererComponentInfoProperty = {
    materialName: NeedsShorten ? 'mn' : 'materialName',
    material: NeedsShorten ? 'm' : 'material',
} as const;

// mesh filter

export type MarionetterMeshFilterComponentInfo = MarionetterComponentInfoBase & {
    meshName: string;
    // shorten
    mn: string;
};

export const MarionetterMeshFilterComponentInfoProperty = {
    meshName: NeedsShorten ? 'mn' : 'meshName',
} as const;

// post process controller component

export type MarionetterPostProcessControllerComponentInfo = MarionetterComponentInfoBase & {
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
};

export const MarionetterPostProcessControllerComponentInfoProperty = {
    bloomAmount: NeedsShorten ? 'bl_a' : 'bloomAmount',
} as const;

// object move and look at controller component

export type MarionetterObjectMoveAndLookAtControllerComponentInfo = MarionetterComponentInfoBase & {
    localPosition: RawVector3;
    lookAtTargetName: string;
    // shorten
    lp: RawVector3;
    tn: string;
};

export const MarionetterObjectMoveAndLookAtControllerComponentInfoProperty = {
    localPosition: NeedsShorten ? 'lp' : 'localPosition',
    lookAtTargetName: NeedsShorten ? 'tn' : 'lookAtTargetName',
} as const;

// fbm noise texture controller component

export type MarionetterFbmNoiseTextureControllerComponentInfo = MarionetterComponentInfoBase & {
    gridSize: RawVector2;
    octaves: number;
    amplitude: number;
    frequency: number;
    factor: number;
};

// fbm noise texture controller component

export const MarionetterFbmNoiseTextureControllerComponentInfoProperty = {
    gridSize: NeedsShorten ? 'gs' : 'gridSize',
    octaves: NeedsShorten ? 'o' : 'octaves',
    amplitude: NeedsShorten ? 'a' : 'amplitude',
    frequency: NeedsShorten ? 'f' : 'frequency',
    factor: NeedsShorten ? 'fa' : 'factor',
} as const;

// gbuffer material controller component

export type MarionetterGBufferMaterialControllerComponentInfo = MarionetterComponentInfoBase & {
    baseColor: string;
    emissiveColor: string;
    metallic: number;
    roughness: number;
};

export const MarionetterGBufferMaterialControllerComponentInfoProperty = {
    baseColor: NeedsShorten ? 'bc' : 'baseColor',
    emissiveColor: NeedsShorten ? 'ec' : 'emissiveColor',
    metallic: NeedsShorten ? 'ec' : 'metallic',
    roughness: NeedsShorten ? 'r' : 'roughness',
} as const;

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

export type MarionetterTimelineDefaultTrack = {
    targetName: string;
    targetActor: Actor;
    clips: MarionetterClipKinds[];
} & MarionetterTimelineTrackBase;

export type MarionetterTimelineMarkerTrack = {
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

export const TimelinePropertyBinderType = {
    Float: 0,
    Vector2: 1,
    Vector3: 2,
    Vector4: 3,
    Color: 4,
} as const;

export type TimelinePropertyBinderType = (typeof TimelinePropertyBinderType)[keyof typeof TimelinePropertyBinderType];

export const TimelinePropertyBinderTarget = {
    Material: 0,
} as const;

export type TimelinePropertyBinderTarget =
    (typeof TimelinePropertyBinderTarget)[keyof typeof TimelinePropertyBinderTarget];

export type TimelinePropertyValue = number | Color;
