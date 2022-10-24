import {Actor} from "./Actor.js";
import {Matrix4} from "../math/Matrix4.js";

export class Camera extends Actor {
    viewMatrix = Matrix4.identity();
    projectionMatrix = Matrix4.identity();
    
    constructor() {
        super();
    }
    
    updateTransform() {
        super.updateTransform();
    }
}