import {Matrix4} from "../Math/Matrix4.js";

export class Transform {
    worldMatrix;
    constructor() {
        this.worldMatrix = new Matrix4();
    }
}