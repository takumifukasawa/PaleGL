import { ActorType, ActorTypes } from '@/PaleGL/constants.ts';
import {
    Actor,
    ActorFixedUpdateArgs,
    ActorLastUpdateArgs,
    ActorStartArgs,
    ActorUpdateArgs,
    // SetSizeActorFunc,
} from '@/PaleGL/actors/actor.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Camera } from '@/PaleGL/actors/camera/camera.ts';
import { updateSkyboxTransform } from '@/PaleGL/actors/skybox.ts';
import { updateLight } from '@/PaleGL/actors/light.ts';
import { updateObjectSpaceRaymarchMesh } from '@/PaleGL/actors/objectSpaceRaymarchMeshBehaviour.ts';
import { setSizeScreenSpaceRaymarchMesh } from '@/PaleGL/actors/screenSpaceRaymarchMesh.ts';
import { startSkinnedMesh, updateSkinnedMesh } from '@/PaleGL/actors/skinnedMesh.ts';
import { startMesh } from '@/PaleGL/actors/meshBehaviours.ts';
import { setSizeCamera, updateCameraTransform } from '@/PaleGL/actors/camera/cameraBehaviours.ts';

// try start actor -------------------------------------------------------

export const tryStartActor = (actor: Actor, { gpu, scene }: ActorStartArgs) => {
    if (actor.isStarted) {
        return;
    }
    actor.isStarted = true;
    startActor(actor, { gpu, scene });
};

// start actor -------------------------------------------------------

export type StartActorFunc = (actor: Actor, args: ActorStartArgs) => void;

export const startActorBehaviourBase = (actor: Actor, { gpu, scene }: ActorStartArgs) => {
    actor.components.forEach((component) => {
        component.start({ gpu, scene });
    });
    actor.onStart.forEach((cb) => {
        cb({ gpu, scene });
    });
};

export const startActorBehaviour: Partial<Record<ActorType, (actor: Actor, { gpu, scene }: ActorStartArgs) => void>> = {
    [ActorTypes.Mesh]: startMesh,
    [ActorTypes.SkinnedMesh]: startSkinnedMesh,
    [ActorTypes.Skybox]: startMesh,
};

const startActor = (actor: Actor, { gpu, scene }: ActorStartArgs) => {
    // // startの場合は必ず共通処理を通す
    // actor.components.forEach((component) => {
    //     component.start({ gpu, scene });
    // });
    // actor.onStart.forEach((cb) => {
    //     cb({ gpu, scene });
    // });

    (startActorBehaviour[actor.type] ?? startActorBehaviourBase)(actor, { gpu, scene });
};

// set size -------------------------------------------------------

export type SetSizeActorFunc = (actor: Actor, width: number, height: number) => void;

const setSizeActorBehaviour: Partial<Record<ActorType, SetSizeActorFunc>> = {
    [ActorTypes.Camera]: setSizeCamera,
    [ActorTypes.ScreenSpaceRaymarchMesh]: setSizeScreenSpaceRaymarchMesh,
};

export const setSizeActor: SetSizeActorFunc = (actor, width, height) => {
    setSizeActorBehaviour[actor.type]?.(actor, width, height);
};

// fixed update -------------------------------------------------------

export const fixedUpdateActor = (actor: Actor, { gpu, scene, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) => {
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.fixedUpdate({ gpu, fixedTime, fixedDeltaTime });
    });
    if (actor.animator) {
        actor.animator.update(fixedDeltaTime);
    }
    if (actor.onFixedUpdate) {
        actor.onFixedUpdate({ gpu, scene, fixedTime, fixedDeltaTime });
    }
};

// update -------------------------------------------------------

export type UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => void;

// export const defaultUpdateActorBehaviour: UpdateActorFunc = (actor: Actor, { gpu, scene, time, deltaTime }: ActorUpdateArgs) => {

const updateActorBehaviour: Partial<Record<ActorType, UpdateActorFunc>> = {
    [ActorTypes.Light]: updateLight,
    [ActorTypes.SkinnedMesh]: updateSkinnedMesh,
    [ActorTypes.ObjectSpaceRaymarchMesh]: updateObjectSpaceRaymarchMesh,
};

// update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
export const updateActor: UpdateActorFunc = (actor, { gpu, scene, time, deltaTime }) => {
    // updateの場合は必ず共通処理を通す
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.update({ gpu, time, deltaTime });
    });
    if (actor.onUpdate) {
        actor.onUpdate({ gpu, scene, time, deltaTime });
    }

    updateActorBehaviour[actor.type]?.(actor, { gpu, scene, time, deltaTime });
};

//

export const lastUpdateActor = (actor: Actor, { gpu, scene, time, deltaTime }: ActorLastUpdateArgs) => {
    tryStartActor(actor, { gpu, scene });
    actor.components.forEach((component) => {
        component.lastUpdate({ gpu, time, deltaTime });
    });
    if (actor.onLastUpdate) {
        actor.onLastUpdate({ gpu, scene, time, deltaTime });
    }
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const beforeRenderActor = (actor: Actor, { gpu }: { gpu: GPU }) => {
    if (actor.onBeforeRender) {
        actor.onBeforeRender();
    }
    // TODO: componentで必要になったら呼ぶ
};

export const processActorPropertyBinder = (actor: Actor, key: string, value: number) => {
    if (actor.onProcessPropertyBinder) {
        actor.onProcessPropertyBinder(key, value);
    }
    actor.components.forEach((component) => {
        component.processPropertyBinder?.(key, value);
    });
};

export const preProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    if (actor.onPreProcessTimeline) {
        actor.onPreProcessTimeline(timelineTime);
    }
    // _components.forEach((component) => {
    //     component.processTimeline?.(timelineTime, timelinePrevTime, timelineDeltaTime);
    // });
};

export const postProcessActorTimeline = (actor: Actor, timelineTime: number) => {
    if (actor.onPostProcessTimeline) {
        actor.onPostProcessTimeline(timelineTime);
    }
    actor.components.forEach((component) => {
        component.postProcessTimeline?.(timelineTime);
    });
};

export const setActorLookAt = (actor: Actor, p: Vector3) => {
    actor.transform.lookAt(p);
};

// update actor transform -------------------------------------------------------

export type UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => void;

export const defaultUpdateActorTransform: UpdateActorTransformFunc = (actor) => {
    console.log("hogehoge", actor.name, actor.parent, actor.children, actor.transform.getActor())
    actor.transform.updateMatrix();
};

const updateActorTransformBehaviour: Partial<Record<ActorType, UpdateActorTransformFunc>> = {
    [ActorTypes.Skybox]: updateSkyboxTransform,
    [ActorTypes.Camera]: updateCameraTransform,
};

export const updateActorTransform: UpdateActorTransformFunc = (actor: Actor, camera?: Camera) => {
    (updateActorTransformBehaviour[actor.type] ?? defaultUpdateActorTransform)(actor, camera);
};
