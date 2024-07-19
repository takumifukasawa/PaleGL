import { Actor } from '@/PaleGL/actors/Actor';
// import { Transform } from '@/PaleGL/core/Transform';
// import {Camera} from "@/PaleGL/actors/Camera.ts";
// import {PostProcess} from "@/PaleGL/postprocess/PostProcess.ts";
// import {Skybox} from "@/PaleGL/actors/Skybox.ts";

type TraverseFunc = (actor: Actor) => void;

export class Scene {
    children: Actor[] = []; // transform hierarchy
    // mainCamera: Camera | null = null; // TODO: findしたい
    // postProcess: PostProcess | null = null // TODO: cameraにもたせてもいいかも
    // skybox: Skybox | null = null; // TODO: findしたい

    // constructor(mainCamera: Camera, postProcess: PostProcess) {
    //     this.mainCamera = mainCamera;
    //     this.postProcess = postProcess;
    // }

    add(actor: Actor) {
        this.children.push(actor);
    }

    traverse(execFunc: TraverseFunc) {
        for (let i = 0; i < this.children.length; i++) {
            this.#recursiveTraverseActor(this.children[i], execFunc);
        }
    }

    find(name: string) {
        return this.children.find((child) => child.name === name);
    }

    #recursiveTraverseActor(actor: Actor, execFunc: TraverseFunc) {
        execFunc(actor);
        if (actor.transform.hasChild) {
            for (let i = 0; i < actor.transform.children.length; i++) {
                this.#recursiveTraverseActor(actor.transform.children[i], execFunc);
                // this.#recursiveTraverseActor(actor.transform.children[i].actor, execFunc)
            }
        }
    }
}
