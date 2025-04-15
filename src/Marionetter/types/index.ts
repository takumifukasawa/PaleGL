import { Actor } from '@/PaleGL/actors/actor.ts';
import { RawVector3 } from '@/PaleGL/math/vector3.ts';
import { Scene } from '@/PaleGL/core/scene.ts';

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

export const MarionetterReceiveDataType = {
    SeekTimeline: 'seekTimeline',
    PlayTimeline: 'playTimeline',
    StopTimeline: 'stopTimeline',
    ExportScene: 'exportScene',
    ExportHotReloadScene: 'exportHotReloadScene',
} as const;

export type MarionetterReceiveDataType = (typeof MarionetterReceiveDataType)[keyof typeof MarionetterReceiveDataType];

export type MarionetterReceiveData = {
    type: MarionetterReceiveDataType;
    currentTime: number;
};

export type Marionetter = {
    connect: () => void;
    getCurrentTime: () => number;
    setCurrentTime: (time: number) => void;
    setHotReloadCallback: (callback: () => void) => void;
};

export type MarionetterArgs = {
    port?: number;
    showLog?: boolean;
    onPlay?: (time: number) => void;
    onSeek?: (time: number) => void;
    onStop?: () => void;
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
export const MarionetterTrackInfoType = {
    None: 0,
    AnimationTrack: 1,
    LightControlTrack: 2,
    ActivationControlTrack: 3,
    MarkerTrack: 4,
    ObjectMoveAndLookAtTrack: 5,
} as const;

export type MarionetterTrackInfoType = (typeof MarionetterTrackInfoType)[keyof typeof MarionetterTrackInfoType];

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

// NOTE: unity側に合わせる
export const enum MarionetterClipInfoType {
    None = 0,
    AnimationClip = 1,
    LightControlClip = 2,
    ActivationControlClip = 3,
    SignalEmitter = 4,
    ObjectMoveAndLookAtClip = 5,
}

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

export type MarionetterAnimationClipInfo = MarionetterClipInfoBase & {
    offsetPosition: { x: number; y: number; z: number };
    offsetRotation: { x: number; y: number; z: number };
    bindings: MarionetterClipBinding[];
    // shorten
    op: { x: number; y: number; z: number };
    or: { x: number; y: number; z: number };
    b: MarionetterClipBinding[];
};

export const MarionetterAnimationClipInfoProperty = {
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

export type MarionetterCurveKeyframeConstraint = NeedsShorten extends true ? {
    // shorten
    t: number;
    v: number;
    i: number;
    o: number;
} : {
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
export const MarionetterComponentType = {
    None: 0,
    PlayableDirector: 1,
    Light: 2,
    Camera: 3,
    MeshRenderer: 4,
    MeshFilter: 5,
    Volume: 6,
    ObjectMoveAndLookAtController: 7,
} as const;

export type MarionetterComponentType = (typeof MarionetterComponentType)[keyof typeof MarionetterComponentType];

export type MarionetterComponentInfoKinds =
    | MarionetterPlayableDirectorComponentInfo
    | MarionetterLightComponentInfo
    | MarionetterSpotLightComponentInfo
    | MarionetterDirectionalLightComponentInfo
    | MarionetterCameraComponentInfo
    | MarionetterMeshRendererComponentInfo
    | MarionetterMeshFilterComponentInfo
    | MarionetterVolumeComponentInfo
    | MarionetterObjectMoveAndLookAtControllerComponentInfo;

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

// volume: postprocess

export type MarionetterVolumeVolumeLayerBase = {
    layerType: 'Bloom' | 'DepthOfField';
    // shorten
    l: 'Bloom' | 'DepthOfField';
};

export const MarionetterVolumeVolumeLayerBaseProperty = {
    layerType: NeedsShorten ? 'l' : 'layerType',
} as const;

export type MarionetterVolumeLayerBloom = MarionetterVolumeVolumeLayerBase & {
    intensity: number;
    // shorten
    bl_i: number;
};

export const MarionetterVolumeLayerBloomProperty = {
    intensity: NeedsShorten ? 'bl_i' : 'intensity',
} as const;

export type MarionetterVolumeLayerDepthOfField = MarionetterVolumeVolumeLayerBase & {
    focusDistance: number;
    // shorten
    dof_fd: number;
};

export const MarionetterVolumeLayerDepthOfFieldProperty = {
    focusDistance: NeedsShorten ? 'dof_fd' : 'focusDistance',
} as const;

export type MarionetterVolumeLayerVignette = MarionetterVolumeVolumeLayerBase & {
    intensity: number;
    // shorten
    vi_i: number;
};

export const MarionetterVolumeLayerVignetteProperty = {
    intensity: NeedsShorten ? 'vi_i' : 'intensity',
} as const;

export type MarionetterVolumeLayerVolumetricLight = MarionetterVolumeVolumeLayerBase & {
    volumetricLightRayStep: number;
    // shorten
    vl_rs: number;
};

export const MarionetterVolumeLayerVolumetricLightProperty = {
    volumetricLightRayStep: NeedsShorten ? 'vl_rs' : 'volumetricLightRayStep',
} as const;

export type MarionetterVolumeLayerKinds =
    | MarionetterVolumeLayerBloom
    | MarionetterVolumeLayerDepthOfField
    | MarionetterVolumeLayerVignette
    | MarionetterVolumeLayerVolumetricLight;

export type MarionetterVolumeComponentInfo = MarionetterComponentInfoBase & {
    volumeLayers: MarionetterVolumeLayerKinds[];
    // shorten
    vl: MarionetterVolumeLayerKinds[];
};

export const MarionetterVolumeComponentInfoProperty = {
    volumeLayers: NeedsShorten ? 'vl' : 'volumeLayers',
} as const;

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

export const MarionetterMaterialType = {
    None: 0,
    Lit: 1,
} as const;

export type MarionetterMaterialType = (typeof MarionetterMaterialType)[keyof typeof MarionetterMaterialType];

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
    roughness: number;
    receiveShadow: number;
    // shorten
    c: string; // hex string
    m: number;
    r: number;
    rs: number;
};

export const MarionetterLitMaterialInfoProperty = {
    color: NeedsShorten ? 'c' : 'color',
    metallic: NeedsShorten ? 'm' : 'metallic',
    roughness: NeedsShorten ? 'r' : 'roughness',
    receiveShadow: NeedsShorten ? 'rs' : 'receiveShadow',
} as const;

export type MarionetterMaterialKinds = MarionetterLitMaterialInfo;

// mesh renderer

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

//
// post process component properties
//

export const MarionetterPostProcessBloom = {
    bloomIntensity: NeedsShorten ? 'bl_i' : 'bloomIntensity',
} as const;
export type MarionetterPostProcessBloomIntensity =
    (typeof MarionetterPostProcessBloom)[keyof typeof MarionetterPostProcessBloom];

export const MarionetterPostProcessDepthOfField = {
    focusDistance: NeedsShorten ? 'dof_fd' : 'depthOfFieldFocusDistance',
} as const;
export type MarionetterPostProcessDepthOfFieldFocusDistance =
    (typeof MarionetterPostProcessDepthOfField)[keyof typeof MarionetterPostProcessDepthOfField];

export const MarionetterPostProcessVignette = {
    vignetteIntensity: NeedsShorten ? 'vi_i' : 'vignetteIntensity',
} as const;
export type MarionetterPostProcessVignetteIntensity =
    (typeof MarionetterPostProcessVignette)[keyof typeof MarionetterPostProcessVignette];

export const MarionetterPostProcessVolumetricLight = {
    volumetricLightRayStep: NeedsShorten ? 'vl_rs' : 'volumetricLightRayStep',
} as const;
export type MarionetterPostProcessVolumetricLightRayStep =
    (typeof MarionetterPostProcessVolumetricLight)[keyof typeof MarionetterPostProcessVolumetricLight];

//
// timeline
//

export type MarionetterTimelineExecuteArgs = { time: number; scene: Scene };

export type MarionetterTimeline = {
    // tracks: MarionetterTimelineTrack[];
    tracks: MarionetterTimelineTrackKinds[];
    execute: (args: MarionetterTimelineExecuteArgs) => void;
    bindActors: (actors: Actor[]) => void;
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
    targetActors: Actor[];
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

export const enum MarionetterAnimationClipType {
    None = 0,
    AnimationClip = 1,
    LightControlClip = 2,
    ActivationControlClip = 3,
    SignalEmitter = 4,
    ObjectMoveAndLookAtClip = 5,
}

export type MarionetterClipArgs = { actor: Actor; time: number; scene: Scene };

export type MarionetterAnimationClip = {
    type: MarionetterAnimationClipType.AnimationClip;
    clipInfo: MarionetterAnimationClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

export type MarionetterLightControlClip = {
    type: MarionetterAnimationClipType.LightControlClip;
    clipInfo: MarionetterLightControlClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

export type MarionetterActivationControlClip = {
    type: MarionetterAnimationClipType.ActivationControlClip;
    clipInfo: MarionetterActivationControlClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

// TODO: signal emitter

export type MarionetterObjectMoveAndLookAtClip = {
    type: MarionetterAnimationClipType.ObjectMoveAndLookAtClip;
    clipInfo: MarionetterObjectMoveAndLookAtClipInfo;
    execute: (args: MarionetterClipArgs) => void;
};

//
// timeline properties
//
