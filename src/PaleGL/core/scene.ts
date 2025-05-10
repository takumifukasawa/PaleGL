import {Actor, getActorHasChild} from '@/PaleGL/actors/actor.ts';
import { createOrthographicCamera, OrthographicCamera } from '@/PaleGL/actors/cameras/orthographicCamera.ts';
import {Camera} from "@/PaleGL/actors/cameras/camera.ts";

type TraverseFunc = (actor: Actor) => void;

export type Scene = {
    children: Actor[];
    mainCamera: Camera | null;
    uiCamera: OrthographicCamera | null;
};

// const w = 1920;
// const h = 720;
// const uiCamera = createOrthographicCamera(
//     0,
//     w,
//     0,
//     h,
//     0,
//     1
// );

export function createScene(): Scene {
    const children: Actor[] = [];

    return {
        children,
        mainCamera: null,
        uiCamera: null,
    };
}

// export function setSceneUICamera(scene: Scene, camera: OrthographicCamera) {
//     scene.uiCamera = camera;
// }

export function createSceneUICamera(scene: Scene, w: number = 1920, h: number = 1080) {
    const uiCamera = createOrthographicCamera(0, w, 0, h, -1, 1);
    // const uiCamera = createOrthographicCamera(-w/2, w/2, -h/2, h/2, -1, 100);
    // const uiCamera = createFullQuadOrthographicCamera();
    // addActorToScene(scene, uiCamera);
    // subscribeActorOnSetSize(uiCamera, () => {
    //     console.log("hogehoge",  uiCamera)
    // });
    // uiCamera.autoResize = false;
    scene.uiCamera = uiCamera;
}

export function setMainCamera(scene: Scene, camera: Camera) {
    scene.mainCamera = camera;
}

export function findActorByName(actors: Actor[], name: string) {
    return actors.find((child) => child.name === name);
}

export function addActorToScene(scene: Scene, actor: Actor) {
    scene.children.push(actor);
}

function recursiveTraverseActor(actor: Actor, execFunc: TraverseFunc) {
    execFunc(actor);
    if (getActorHasChild(actor)) {
        for (let i = 0; i < actor.children.length; i++) {
            recursiveTraverseActor(actor.children[i], execFunc);
        }
    }
}

export function traverseScene(scene: Scene, execFunc: TraverseFunc) {
    for (let i = 0; i < scene.children.length; i++) {
        recursiveTraverseActor(scene.children[i], execFunc);
    }
}

export function findActorInSceneByName(scene: Scene, name: string) {
    let result: Actor | undefined;
    traverseScene(scene, (actor) => {
        if (actor.name === name) {
            result = actor;
        }
    });
    return result || null;
}
