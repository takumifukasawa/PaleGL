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

export type MarionetterScene = NeedsShorten extends true
    ? {
          // n: string;
          o: MarionetterObjectInfo[];
      }
    : {
          // name: string;
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

// TODO: signal emitter

export type MarionetterObjectMoveAndLookAtClipInfo = MarionetterClipInfoBase &
    (NeedsShorten extends true
        ? {
              lp: RawVector3;
              tn: string;
              b: MarionetterClipBinding[];
          }
        : {
              localPosition: RawVector3;
              lookAtTargetName: string;
              bindings: MarionetterClipBinding[];
          });

export const MarionetterObjectMoveAndLookAtClipInfoProperty = {
    localPositionX: NeedsShorten ? 'lp.x' : 'LocalPosition.x',
    localPositionY: NeedsShorten ? 'lp.y' : 'LocalPosition.y',
    localPositionZ: NeedsShorten ? 'lp.z' : 'LocalPosition.z',
} as const;
export type MarionetterObjectMoveAndLookAtClipInfoProperty =
    (typeof MarionetterObjectMoveAndLookAtClipInfoProperty)[keyof typeof MarionetterObjectMoveAndLookAtClipInfoProperty];

export type MarionetterClipBinding = NeedsShorten extends true
    ? {
          n: string;
          k: MarionetterAnimationClipKeyframe[];
      }
    : {
          propertyName: string;
          keyframes: MarionetterAnimationClipKeyframe[];
      };

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
export type MarionetterCurveKeyframe = NeedsShorten extends true
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

// for arr
// export type MarionetterCurveKeyframe = number[];

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

// light: directional light

export type MarionetterDirectionalLightComponentInfo = MarionetterLightComponentInfo &
    (NeedsShorten extends true
        ? {
              l: 'Directional';
          }
        : {
              lightType: 'Directional';
          });

// light: spotlight

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

// volume: postprocess

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
              bl_i: number;
          }
        : {
              intensity: number;
          });

export type MarionetterVolumeLayerDepthOfField = MarionetterVolumeVolumeLayerBase &
    (NeedsShorten extends true
        ? {
              dof_fd: number;
          }
        : {
              focusDistance: number;
          });

export type MarionetterVolumeLayerVignette = MarionetterVolumeVolumeLayerBase &
    (NeedsShorten extends true
        ? {
              vi_i: number;
          }
        : {
              intensity: number;
          });

export type MarionetterVolumeLayerVolumetricLight = MarionetterVolumeVolumeLayerBase &
    (NeedsShorten extends true
        ? {
            vl_rs: number;
        }
        : {
            volumetricLightRayStep: number;
        });

export type MarionetterVolumeLayerKinds =
    | MarionetterVolumeLayerBloom
    | MarionetterVolumeLayerDepthOfField
    | MarionetterVolumeLayerVignette
    | MarionetterVolumeLayerVolumetricLight;

export type MarionetterVolumeComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              vl: MarionetterVolumeLayerKinds[];
          }
        : {
              volumeLayers: MarionetterVolumeLayerKinds[];
          });

// camera

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

// material

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
          m: number;
          r: number;
          rs: number;
      }
    : {
          color: string;
          metallic: number;
          roughness: number;
          receiveShadow: number;
      }) &
    MarionetterMaterialInfo;

export type MarionetterMaterialKinds = MarionetterLitMaterialInfo;

// mesh renderer

export type MarionetterMeshRendererComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              mn: string;
              m: MarionetterMaterialKinds;
          }
        : {
              materialName: string;
              material: MarionetterMaterialKinds;
          });

// mesh filter

export type MarionetterMeshFilterComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              mn: string;
          }
        : {
              meshName: string;
          });

// object move and look at controller component

export type MarionetterObjectMoveAndLookAtControllerComponentInfo = MarionetterComponentInfoBase &
    (NeedsShorten extends true
        ? {
              lp: RawVector3;
              tn: string;
          }
        : {
              localPosition: RawVector3;
              lookAtTargetName: string;
          });

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
