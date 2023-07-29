import { Actor } from '@/PaleGL/actors/Actor';
import { Transform } from '@/PaleGL/core/Transform';
import {Camera} from "@/PaleGL/actors/Camera.ts";
import {PostProcess} from "@/PaleGL/postprocess/PostProcess.ts";

type TraverseFunc = (actor: Actor) => void;

export class Scene {
    children: Transform[] = []; // transform hierarchy
    mainCamera: Camera | null = null; // TODO: findしたい
    postProcess: PostProcess | null = null // TODO: cameraにもたせてもいいかも
    
    // constructor(mainCamera: Camera, postProcess: PostProcess) {
    //     this.mainCamera = mainCamera;
    //     this.postProcess = postProcess;
    // }

    add(actor: Actor) {
        this.children.push(actor.transform);
    }

    traverse(execFunc: TraverseFunc) {
        for (let i = 0; i < this.children.length; i++) {
            this.#recursiveTraverseActor(this.children[i].actor, execFunc);
        }
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
