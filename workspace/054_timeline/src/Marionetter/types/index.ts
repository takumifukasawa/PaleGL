import { Actor } from '@/PaleGL/actors/Actor.ts';

//
// marionetter
//

export const MarionetterReceiveDataType = {
    SeekTimeline: 'seekTimeline',
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
    setHotReloadCallback: (callback: () => void) => void;
};

export type MarionetterArgs = { port?: number, showLog?: boolean };

//
// scene
//

export type MarionetterScene = {
    name: string; // shorthand: n
    objects: MarionetterObjectInfo[]; // shorthand: o
};

export type MarionetterObjectInfo = {
    name: string; // shorthand: n
    transform: MarionetterTransformInfo; // shorthand: t
    components: MarionetterComponentInfoKinds[]; // shorthand: c
    children: MarionetterObjectInfo[]; // shorthand: o
};

export type MarionetterTransformInfo = {
    localPosition: { x: number; y: number; z: number }; // shorthand: lp
    // euler ver
    // localRotation: { x: number; y: number; z: number }; // shorthand: lr
    // quaternion ver
    localRotation: { x: number; y: number; z: number; w: number }; // shorthand: lr
    localScale: { x: number; y: number; z: number }; // shorthand: ls
};

//
// track
//

export const enum MarionetterTrackInfoType {
    None,
    AnimationTrack = 1,
    LightControlTrack = 2,
    ActivationControlTrack = 3,
}

export type MarionetterTrackInfo = {
    targetName: string; // shorthand: tn
    type: MarionetterTrackInfoType; // shorthand: t
    clips: MarionetterClipInfoKinds[]; // shorthand: cs
};

export type MarionetterClipInfoKinds = MarionetterAnimationClipInfo | MarionetterLightControlClipInfo;

// NOTE: unity側に合わせる
export const enum MarionetterClipInfoType {
    None = 0,
    AnimationClip = 1,
    LightControlClip = 2,
    ActivationControlClip = 3,
}

export type MarionetterClipInfoBase = {
    type: MarionetterClipInfoType; // shorthand: t
    start: number; // shorthand: s
    duration: number; // shorthand: d
};

export type MarionetterAnimationClipInfo = MarionetterClipInfoBase & {
    offsetPosition: { x: number; y: number; z: number }; // shorthand: op
    offsetRotation: { x: number; y: number; z: number }; // shorthand: or
    bindings: MarionetterClipBinding[]; // shorthand: b
};

export type MarionetterLightControlClipInfo = MarionetterClipInfoBase & {
    bindings: MarionetterClipBinding[]; // shorthand: b
};

export type MarionetterActivationControlClipInfo = MarionetterClipInfoBase;

export type MarionetterClipBinding = {
    propertyName: string; // short hand: n
    keyframes: MarionetterAnimationClipKeyframe[];
};

export type MarionetterAnimationClipKeyframe = {
    time: number; // shorthand: t
    value: number; // shorthand: v
    inTangent: number; // shorthand: i
    outTangent: number; // shorthand: o
};

//
// components
//

export type MarionetterComponentInfoBase = {
    type: MarionetterComponentType; // shorthand: t
};

// unity側に合わせる
export const MarionetterComponentType = {
    None: 0,
    PlayableDirector: 1,
    Light: 2,
    Camera: 3,
    MeshRenderer: 4,
    MeshFilter: 5,
} as const;

export type MarionetterComponentType = (typeof MarionetterComponentType)[keyof typeof MarionetterComponentType];

export type MarionetterComponentInfoKinds =
    | MarionetterPlayableDirectorComponentInfo
    | MarionetterLightComponentInfo
    | MarionetterCameraComponentInfo
    | MarionetterMeshRendererComponentInfo
    | MarionetterMeshFilterComponentInfo;

// unity側に合わせてcomponent情報を追加

export type MarionetterPlayableDirectorComponentInfo = MarionetterComponentInfoBase & {
    name: string; // shorthand: n
    duration: number; // shorthand: d
    tracks: MarionetterTrackInfo[]; // shorthand: ts
};

export type MarionetterLightComponentInfo = MarionetterComponentInfoBase & {
    lightType: 'Directional' | 'Point' | 'Spot'; // shorthand: l
    intensity: number; // shorthand: i
    color: string; // shorthand: c, hex string
};

export type MarionetterDirectionalLightComponentInfo = MarionetterLightComponentInfo & {
    lightType: 'Directional'; // shorthand: l
};

export type MarionetterSpotLightComponentInfo = MarionetterLightComponentInfo & {
    lightType: 'Spot'; // shorthand: l
    range: number; // shorthand: r
    innerSpotAngle: number; // shorthand: isa
    spotAngle: number; // shorthand: sa
};

export type MarionetterCameraComponentInfo = MarionetterComponentInfoBase & {
    cameraType: 'Perspective' | 'Orthographic'; // ct
    isMain: boolean; // shorthand: im
    fov: number; // shorthand: f
};

export const MarionetterMaterialType = {
    None: 0,
    Lit: 1,
} as const;

export type MarionetterMaterialType = (typeof MarionetterMaterialType)[keyof typeof MarionetterMaterialType];

export type MarionetterMaterialInfo = {
    type: MarionetterMaterialType,
    name: string;
};

export type MarionetterLitMaterialInfo = {
    color: string; // shorthand: c, hex string
} & MarionetterMaterialInfo;

export type MarionetterMeshRendererComponentInfo = MarionetterComponentInfoBase & {
    materialName: string; // shorthand: mn
    material: MarionetterMaterialInfo; // shorthand: m
};

export type MarionetterMeshFilterComponentInfo = MarionetterComponentInfoBase & {
    meshName: string; // shorthand: mn
};

//
// timeline
//

export type MarionetterTimeline = {
    tracks: MarionetterTimelineTrack[];
    execute: (time: number) => void;
};

export type MarionetterTimelineTrack = {
    targetName: string;
    // targetObj: Actor | null;
    clips: MarionetterClipKinds[];
    execute: (time: number) => void;
};

export type MarionetterClipKinds = MarionetterAnimationClip | MarionetterLightControlClip | MarionetterActivationControlClip;

export const enum MarionetterAnimationClipType {
    AnimationClip = 0,
    LightControlClip = 1,
    ActivationControlClip = 2,
}

export type MarionetterAnimationClip = {
    type: MarionetterAnimationClipType.AnimationClip;
    clipInfo: MarionetterAnimationClipInfo;
    execute: (actor: Actor, time: number) => void;
};

export type MarionetterLightControlClip = {
    type: MarionetterAnimationClipType.LightControlClip;
    clipInfo: MarionetterLightControlClipInfo;
    execute: (actor: Actor, time: number) => void;
};

export type MarionetterActivationControlClip = {
    type: MarionetterAnimationClipType.ActivationControlClip;
    clipInfo: MarionetterActivationControlClipInfo;
    execute: () => void;
};
