import { Actor } from '@/PaleGL/actors/Actor';

type TraverseFunc = (actor: Actor) => void;

export type Scene = ReturnType<typeof createScene>;

export function createScene() {
    const _children: Actor[] = [];
   
    const getChildren = () => _children;
    
    const add = (actor: Actor) => {
        _children.push(actor);
    }
    
    const traverse = (execFunc: TraverseFunc) => {
        for (let i = 0; i < _children.length; i++) {
            _recursiveTraverseActor(_children[i], execFunc);
        }
    }
    
    const _recursiveTraverseActor = (actor: Actor, execFunc: TraverseFunc) => {
        execFunc(actor);
        if (actor.hasChild) {
            for (let i = 0; i < actor.children.length; i++) {
                _recursiveTraverseActor(actor.children[i], execFunc);
            }
        }
    }
    
    const find = (name: string) => {
        let result: Actor | undefined;
        traverse((actor) => {
            if (actor.name === name) {
                result = actor;
            }
        });
        return result || null;
    }
    
    return {
        getChildren,
        add,
        traverse,
        find
    };
}

export function findActorByName(actors: Actor[], name: string) {
    return actors.find((child) => child.name === name);
}
