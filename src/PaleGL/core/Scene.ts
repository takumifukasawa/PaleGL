import { Actor } from '@/PaleGL/actors/Actor';

type TraverseFunc = (actor: Actor) => void;

export class Scene {
    _children: Actor[] = []; // transform hierarchy

    get children() {
        return this._children;
    }

    add(actor: Actor) {
        this._children.push(actor);
    }

    traverse(execFunc: TraverseFunc) {
        for (let i = 0; i < this._children.length; i++) {
            this.#recursiveTraverseActor(this._children[i], execFunc);
        }
    }

    find(name: string): Actor | null {
        // tmp
        // const result = this.children.find((child) => child.name === name);

        let result: Actor | undefined;
        this.traverse((actor) => {
            if (actor.name === name) {
                result = actor;
                // TODO: break;
            }
        });
        return result || null;
    }

    static find(actors: Actor[], name: string) {
        // TODO: recursive
        return actors.find((child) => child.name === name);
    }

    #recursiveTraverseActor(actor: Actor, execFunc: TraverseFunc) {
        execFunc(actor);
        if (actor.hasChild) {
            for (let i = 0; i < actor.children.length; i++) {
                this.#recursiveTraverseActor(actor.children[i], execFunc);
                // this.#recursiveTraverseActor(actor.transform.children[i].actor, execFunc)
            }
        }
    }
}
