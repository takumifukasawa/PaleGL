import { Actor } from '@/PaleGL/actors/Actor.ts';

//
// settings
//

// TODO: 2回プロパティを書かなきゃいけないのが冗長かつミスる可能性高くなるが一旦・・・
type NeedsShorten = true;
const NeedsShorten = true;

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

export type MarionetterArgs = { port?: number; showLog?: boolean };

//
// scene
//

export type MarionetterScene = NeedsShorten extends true
    ? {
          n: string;
          o: MarionetterObjectInfo[];
      }
    : {
          name: string;
          objects: MarionetterObjectInfo[];
      };

export type MarionetterObjectInfo = NeedsShorten extends true
    ? {
          n: string;
          t: MarionetterTransformInfo;
          co: MarionetterComponentInfoKinds[];
          ch: MarionetterObjectInfo[];
      }
    : {
          name: string;
          transform: MarionetterTransformInfo;
          components: MarionetterComponentInfoKinds[];
          children: MarionetterObjectInfo[];
      };

export type MarionetterTransformInfo = NeedsShorten extends true
    ? {
          lp: { x: number; y: number; z: number };
          lr: { x: number; y: number; z: number; w: number };
          ls: { x: number; y: number; z: number };
      }
    : {
          localPosition: { x: number; y: number; z: number };
          localRotation: { x: number; y: number; z: number; w: number };
          localScale: { x: number; y: number; z: number };
      };

//
// track
//

export const enum MarionetterTrackInfoType {
    None,
    AnimationTrack = 1,
    LightControlTrack = 2,
    ActivationControlTrack = 3,
    MarkerTrack = 4,
}

export type MarionetterTrackInfoBase = NeedsShorten extends true
    ? {
          t: MarionetterTrackInfoType;
      }
    : {
          type: MarionetterTrackInfoType;
      };

export type MarionetterDefaultTrackInfo = (NeedsShorten extends true
    ? {
          tn: string;
          cs: MarionetterClipInfoKinds[];
      }
    : {
          targetName: string;
          clips: MarionetterClipInfoKinds[];
      }) &
    MarionetterTrackInfoBase;

export type MarionetterMarkerTrackInfo = (NeedsShorten extends true
    ? {
          ses: MarionetterSignalEmitter[];
      }
    : {
          signalEmitters: MarionetterSignalEmitter[];
      }) &
    MarionetterTrackInfoBase;

export type MarionetterTrackInfoKinds = MarionetterDefaultTrackInfo | MarionetterMarkerTrackInfo;

export type MarionetterSignalEmitter = NeedsShorten extends true
    ? {
          n: string;
          t: number;
      }
    : {
          name: string;
          time: number;
      };

export type MarionetterClipInfoKinds = MarionetterAnimationClipInfo | MarionetterLightControlClipInfo;

// NOTE: unity側に合わせる
export const enum MarionetterClipInfoType {
    None = 0,
    AnimationClip = 1,
    LightControlClip = 2,
    ActivationControlClip = 3,
}

export type MarionetterClipInfoBase = NeedsShorten extends true
    ? {
          t: MarionetterClipInfoType;
          s: number;
          d: number;
      }
    : {
          type: MarionetterClipInfoType;
          start: number;
          duration: number;
      };

export type MarionetterAnimationClipInfo = MarionetterClipInfoBase &
    (NeedsShorten extends true
        ? {
              op: { x: number; y: number; z: number };
              or: { x: number; y: number; z: number };
              b: MarionetterClipBinding[];
          }
        : {
              offsetPosition: { x: number; y: number; z: number };
              offsetRotation: { x: number; y: number; z: number };
              bindings: MarionetterClipBinding[];
          });

export type MarionetterLightControlClipInfo = MarionetterClipInfoBase &
    (NeedsShorten extends true
        ? {
              b: MarionetterClipBinding[];
          }
        : {
              bindings: MarionetterClipBinding[];
          });

export type MarionetterActivationControlClipInfo = MarionetterClipInfoBase;

export type MarionetterClipBinding = NeedsShorten extends true
    ? {
          n: string;
          k: MarionetterAnimationClipKeyframe[];
      }
    : {
          propertyName: string;
          keyframes: MarionetterAnimationClipKeyframe[];
      };

export type MarionetterAnimationClipKeyframe = NeedsShorten extends true
    ? {
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

// TODO: 短縮系への対応
export type MarionetterCurveKeyframe = NeedsShorten extends true
    ? {
          t: number;
          v: number;
          i: number;
          o: number;
      }
    : {
          t: number;
          v: number;
          i: number;
          o: number;
      };

//
// components
//

export type MarionetterComponentInfoBase = NeedsShorten extends true
    ? {
          t: MarionetterComponentType;
      }
    : {
          type: MarionetterComponentType;
      };

// unity側に合わせる
export const MarionetterComponentType = {
    None: 0,
    PlayableDirector: 1,
    Light: 2,
    Camera: 3,
    MeshRenderer: 4,
    MeshFilter: 5,
    Volume: 6,
} as const;

export type MarionetterComponentType = (typeof MarionetterComponentType)[keyof typeof MarionetterComponentType];

export type MarionetterComponentInfoKinds =
    | MarionetterPlayableDirectorComponentInfo
    | MarionetterLightComponentInfo
    | MarionetterCameraComponentInfo
    | MarionetterMeshRendererComponentInfo
    | MarionetterMeshFilterComponentInfo;

// unity側に合わせてcomponent情報を追加

export type MarionetterPlayableDirectorComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              n: string;
              d: number;
              ts: MarionetterTrackInfoKinds[];
          }
        : {
              name: string;
              duration: number;
              tracks: MarionetterTrackInfoKinds[];
          });

export type MarionetterLightComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              l: 'Directional' | 'Point' | 'Spot';
              i: number;
              c: string; // hex string
          }
        : {
              lightType: 'Directional' | 'Point' | 'Spot';
              intensity: number;
              color: string;
          });

export type MarionetterDirectionalLightComponentInfo = MarionetterLightComponentInfo &
    (NeedsShorten extends true
        ? {
              l: 'Directional';
          }
        : {
              lightType: 'Directional';
          });

export type MarionetterSpotLightComponentInfo = MarionetterLightComponentInfo &
    (NeedsShorten extends true
        ? {
              l: 'Spot';
              r: number;
              isa: number;
              sa: number;
          }
        : {
              lightType: 'Spot';
              range: number;
              innerSpotAngle: number;
              spotAngle: number;
          });

export type MarionetterVolumeVolumeLayerBase = NeedsShorten extends true
    ? {
          l: 'Bloom' | 'DepthOfField';
      }
    : {
          layerType: 'Bloom' | 'DepthOfField';
      };

export type MarionetterVolumeLayerBloom = MarionetterVolumeVolumeLayerBase &
    (NeedsShorten extends true
        ? {
              i: number;
          }
        : {
              intensity: number;
          });

export type MarionetterVolumeLayerDepthOfField = MarionetterVolumeVolumeLayerBase &
    (NeedsShorten extends true
        ? {
              f: number;
          }
        : {
              focusDistance: number;
          });

export type MarionetterVolumeLayerKinds = MarionetterVolumeLayerBloom | MarionetterVolumeLayerDepthOfField;

export type MarionetterVolumeComponentInfo = MarionetterComponentInfoBase & (NeedsShorten extends true ? {
    vl: MarionetterVolumeLayerKinds[];
} : {
    volumeLayers: MarionetterVolumeLayerKinds[];
});

export type MarionetterCameraComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              ct: 'Perspective' | 'Orthographic';
              im: boolean;
              f: number;
          }
        : {
              cameraType: 'Perspective' | 'Orthographic';
              isMain: boolean;
              fov: number;
          });

export const MarionetterMaterialType = {
    None: 0,
    Lit: 1,
} as const;

export type MarionetterMaterialType = (typeof MarionetterMaterialType)[keyof typeof MarionetterMaterialType];

export type MarionetterMaterialInfo = NeedsShorten extends true
    ? {
          t: MarionetterMaterialType;
          n: string;
      }
    : {
          type: MarionetterMaterialType;
          name: string;
      };

export type MarionetterLitMaterialInfo = (NeedsShorten extends true
    ? {
          c: string; // hex string
      }
    : {
          color: string;
      }) &
    MarionetterMaterialInfo;

export type MarionetterMeshRendererComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              mn: string;
              m: MarionetterMaterialInfo;
          }
        : {
              materialName: string;
              material: MarionetterMaterialInfo;
          });

export type MarionetterMeshFilterComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              mn: string;
          }
        : {
              meshName: string;
          });

//
// timeline
//

export type MarionetterTimeline = {
    // tracks: MarionetterTimelineTrack[];
    tracks: MarionetterTimelineTrackKinds[];
    execute: (time: number) => void;
};

// export type MarionetterTimelineTrack = {
//     targetName: string;
//     // targetObj: Actor | null;
//     clips: MarionetterClipKinds[];
//     signalEmitters: MarionetterSignalEmitter[];
//     execute: (time: number) => void;
// };

export type MarionetterTimelineTrackBase = {
    execute: (time: number) => void;
};

export type MarionetterTimelineDefaultTrack = {
    targetName: string;
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
    | MarionetterActivationControlClip;

export const enum MarionetterAnimationClipType {
    None = 0,
    AnimationClip = 1,
    LightControlClip = 2,
    ActivationControlClip = 3,
    SignalEmitter = 4,
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
