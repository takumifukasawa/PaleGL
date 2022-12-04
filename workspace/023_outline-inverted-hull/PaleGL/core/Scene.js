
export class Scene {
    children = []; // transform hierarchy
    mainCamera;
    
    add(actor) {
        this.children.push(actor.transform);
    }
    
    traverse(execFunc) {
        for(let i = 0; i < this.children.length; i++) {
            this.recursiveTraverseActor(this.children[i].actor, execFunc);
        }
    }
    
    recursiveTraverseActor(actor, execFunc) {
        execFunc(actor);
        if(actor.transform.hasChild) {
            for(let i = 0; i < actor.transform.children.length; i++) {
                this.recursiveTraverseActor(actor.transform.children[i], execFunc)
            }
        }
    }
}