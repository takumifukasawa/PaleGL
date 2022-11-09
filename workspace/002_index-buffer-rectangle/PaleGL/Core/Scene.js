
export class Scene {
    children;
    
    constructor() {
        this.children = [];
    }
    
    add(mesh) {
        this.children.push(mesh)
    }
}