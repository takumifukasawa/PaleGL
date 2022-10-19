import {Matrix4} from "../Math/Matrix4.js";

export class Transform {
    parent;
    #worldMatrix;
    #localMatrix;
    #scalingMatrix;
    #rotationMatrix;
    #translationMatrix;
    
    get worldMatrix() {
        return this.#worldMatrix;
    }
    
    get localMatrix() {
        return this.#localMatrix;
    }
    
    constructor() {
        this.#worldMatrix,
        this.#localMatrix,
        this.#scalingMatrix,
        this.#rotationMatrix,
        this.#translationMatrix = Matrix4.identity();
    }
    
    update() {
        this.#worldMatrix = Matrix4.multiplyMatrices(this.parent.worldMatrix, this.localMatrix);
    }

    // TODO: override matrix
    scale(s) {
        this.#scalingMatrix = Matrix4.scaleMatrix(s);
    }

    // TODO: override matrix
    rotateZ(rad) {
        this.#rotationMatrix = Matrix4.rotateZMatrix(rad);
    }

    // TODO: override matrix
    translate(v) {
        this.#translationMatrix = Matrix4.translateMatrix(v);
    }
}