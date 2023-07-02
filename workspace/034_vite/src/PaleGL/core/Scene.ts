import {Actor} from "../actors/Actor";
import {Transform} from "./Transform";

type TraverseFunc = (actor: Actor) => void;

export class Scene {
    children: Transform[] = []; // transform hierarchy
    // mainCamera;
    
    add(actor: Actor) {
        this.children.push(actor.transform);
    }
    
    traverse(execFunc: TraverseFunc) {
        for(let i = 0; i < this.children.length; i++) {
            this.#recursiveTraverseActor(this.children[i].actor, execFunc);
        }
    }
    
    #recursiveTraverseActor(actor: Actor, execFunc: TraverseFunc) {
        execFunc(actor);
        if(actor.transform.hasChild) {
            for(let i = 0; i < actor.transform.children.length; i++) {
                this.#recursiveTraverseActor(actor.transform.children[i], execFunc)
            }
        }
    }
}
