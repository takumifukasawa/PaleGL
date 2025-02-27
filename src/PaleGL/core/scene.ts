import {Actor, getActorHasChild} from '@/PaleGL/actors/actor.ts';

type TraverseFunc = (actor: Actor) => void;

export type Scene = ReturnType<typeof createScene>;

export function createScene() {
    const children: Actor[] = [];
   
    return {
        children
    };
}

export function findActorByName(actors: Actor[], name: string) {
    return actors.find((child) => child.name === name);
}

export function addActorToScene(scene: Scene, actor: Actor) {
    scene.children.push(actor);
}



function recursiveTraverseActor (actor: Actor, execFunc: TraverseFunc) {
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

export function findActorInSceneByName (scene: Scene, name: string)  {
    let result: Actor | undefined;
    traverseScene(scene, (actor) => {
        if (actor.name === name) {
            result = actor;
        }
    });
    return result || null;
}
    