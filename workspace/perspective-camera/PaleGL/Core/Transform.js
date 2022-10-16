import {Matrix4x4} from "../Math/Matrix4x4.js";

export class Transform {
    worldMatrix;
    constructor() {
        this.worldMatrix = new Matrix4x4();
    }
}