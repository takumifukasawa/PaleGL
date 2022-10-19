import {Vector3} from "../Math/Vector3.js";
import {Matrix4} from "../Math/Matrix4.js";

export class Transform {
    parent;
    actor;
    children = [];
    #worldMatrix = Matrix4.identity();
    #localMatrix = Matrix4.identity();
    position = Vector3.zero();
    rotation = Vector3.zero(); // degree vector
    scale = Vector3.one();
    
    get childCount() {
        return this.children.length;
    }
    
    get hasChild() {
        return this.childCount > 0;
    }
    
    get worldMatrix() {
        return this.#worldMatrix;
    }
    
    get localMatrix() {
        return this.#localMatrix;
    }
    
    addChild(child) {
        this.children.push(child);
    }
    
    updateMatrix() {
        const translationMatrix = Matrix4.translationMatrix(this.position);
        // TODO: rotation matrix
        const rotationMatrix = Matrix4.rotationZMatrix(this.rotation.z / 180 * Math.PI);
        const scalingMatrix = Matrix4.scalingMatrix(this.scale);
        this.#localMatrix = Matrix4.multiplyMatrices(translationMatrix, rotationMatrix, scalingMatrix);
        this.#worldMatrix = this.parent
            ? Matrix4.multiplyMatrices(this.parent.worldMatrix, this.localMatrix)
            : this.localMatrix;
    }

    setScale(s) {
        this.scale = s;
    }

    rotateZ(degree) {
        this.rotation.z = degree;
    }

    translate(v) {
        this.position = v;
    }
}