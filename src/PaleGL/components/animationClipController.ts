import { MarionetterClipKinds, MarionetterTimelineDefaultTrack, NeedsShorten } from '@/Marionetter/types';
import { Actor } from '@/PaleGL/actors/actor.ts';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    Component,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
    OnPostProcessClipCallback,
    OnProcessPropertyBinderCallback,
} from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_ANIMATION_CLIP_CONTROLLER } from '@/PaleGL/constants.ts';
import {
    AnimationTextureData,
    UNIFORM_NAME_ANIMATION_FPS,
    UNIFORM_NAME_ANIMATION_TIME,
    UNIFORM_NAME_CLIP_FRAME_COUNT,
    UNIFORM_NAME_CLIP_START_ROW,
    UNIFORM_VALUE_ANIMATION_FPS,
} from '../../../../src/pages/scripts/createHumanAnimationTexture.ts';

const Property = {
    clipIndex: NeedsShorten ? 'ac_ci' : 'clipIndex',
} as const;

export type AnimationClipControllerBehaviour = ComponentBehaviour & {
    switchAnimationClip: (index: number) => void;
    setAnimationTextureData: (data: AnimationTextureData) => void;
};

export type AnimationClipController = Component<ComponentModel, AnimationClipControllerBehaviour>;

type Bindings = Map<string, string>;

export const createAnimationClipController = (
    mesh: Mesh,
    // bindings: Bindings,
    trackName: string,
    animationClipNames: string[],
    syncWithClip: boolean
): AnimationClipController => {
    let animationName = '';
    let animationTextureData: AnimationTextureData | null = null;

    const switchAnimationClip = (index: number) => {
        animationName = animationClipNames[index];
    };

    // const onFilterPropertyBinder = (key: string) => bindings.has(key);

    const onProcessPropertyBinder: OnProcessPropertyBinderCallback = (actor, componentModel, key, value) => {
        if (key === Property.clipIndex) {
            switchAnimationClip(value as number);
        }
    };

    const onPostProcessClip: OnPostProcessClipCallback = (
        // prettier-ignore
        actor: Actor,
        componentModel: ComponentModel,
        track: MarionetterTimelineDefaultTrack,
        clipInTimeline: MarionetterClipKinds,
        timeInClip: number
    ) => {
        if (trackName === track.name && animationTextureData !== null) {
            const targetClipName = syncWithClip ? clipInTimeline.name : animationName;
            const clip = animationTextureData.clips.find((c) => c.name === targetClipName);

            if (clip) {
                // TODO: 動作確認のためにgpuparticleもここで更新してるだけ
                // animationHumanMeshes.forEach((humanMesh) => {
                setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_CLIP_START_ROW, clip.startRow);
                setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_CLIP_FRAME_COUNT, clip.frameCount); // 60
                setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_ANIMATION_TIME, timeInClip);
                setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_ANIMATION_FPS, UNIFORM_VALUE_ANIMATION_FPS);
                // });
            }
        }
    };

    const setAnimationTextureData = (data: AnimationTextureData) => {
        animationTextureData = data;
    };

    return createComponent(
        { type: COMPONENT_TYPE_ANIMATION_CLIP_CONTROLLER, onProcessPropertyBinder, onPostProcessClip },
        { switchAnimationClip, setAnimationTextureData }
    );
};
