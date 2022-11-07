import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {ActorTypes} from "../constants.js";

// TODO: 外側から各種propertyを取得するときはmatrix更新した方がいい？
export class Transform {
    parent;
    actor;
    children = [];
    #worldMatrix = Matrix4.identity();
    #localMatrix = Matrix4.identity();
    position = Vector3.zero();
    rotation = Vector3.zero(); // degree vector
    scale = Vector3.one();
    lookAtTarget = null; // world v

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

    get localPosition() {
        return this.position.clone();
    }

    get worldPosition() {
        return this.#worldMatrix.position;
    }
    
    get worldRight() {
        return new Vector3(this.#worldMatrix.m00, this.#worldMatrix.m10, this.#worldMatrix.m20).normalize();
    }

    get worldUp() {
        return new Vector3(this.#worldMatrix.m01, this.#worldMatrix.m11, this.#worldMatrix.m21).normalize();
    }

    get worldForward() {
        return new Vector3(this.#worldMatrix.m02, this.#worldMatrix.m12, this.#worldMatrix.m22).normalize();
    }

    addChild(child) {
        this.children.push(child);
    }

    // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    updateMatrix() {
        // TODO: lookatとの併用これで合ってる？
        if (this.lookAtTarget) {
            // TODO:
            // - pass up vector
            const lookAtMatrix = this.actor.type === ActorTypes.Camera
                ? Matrix4.getLookAtMatrix(this.position, this.lookAtTarget, Vector3.up(), true)
                : Matrix4.getLookAtMatrix(this.position, this.lookAtTarget);
            const scalingMatrix = Matrix4.scalingMatrix(this.scale);
            this.#localMatrix = Matrix4.multiplyMatrices(lookAtMatrix, scalingMatrix);
            // this.#localMatrix = Matrix4.multiplyMatrices(lookAtMatrix);
        } else {
            const translationMatrix = Matrix4.translationMatrix(this.position);
            const rotationXMatrix = Matrix4.rotationXMatrix(this.rotation.x / 180 * Math.PI);
            const rotationYMatrix = Matrix4.rotationYMatrix(this.rotation.y / 180 * Math.PI);
            const rotationZMatrix = Matrix4.rotationZMatrix(this.rotation.z / 180 * Math.PI);
            // roll(Z), pitch(X), yaw(Y)
            const rotationMatrix = Matrix4.multiplyMatrices(rotationYMatrix, rotationXMatrix, rotationZMatrix);
            const scalingMatrix = Matrix4.scalingMatrix(this.scale);
            this.#localMatrix = Matrix4.multiplyMatrices(translationMatrix, rotationMatrix, scalingMatrix);
        }
        this.#worldMatrix = this.parent
            ? Matrix4.multiplyMatrices(this.parent.worldMatrix, this.#localMatrix)
            : this.#localMatrix;
    }

    setScaling(s) {
        this.scale = s;
    }

    setRotationX(degree) {
        this.rotation.x = degree;
    }

    setRotationY(degree) {
        this.rotation.y = degree;
    }

    setRotationZ(degree) {
        this.rotation.z = degree;
    }

    setTranslation(v) {
        this.position = v;
    }

    lookAt(lookAtTarget) {
        this.lookAtTarget = lookAtTarget;
    }

    // lookAt(center, up = new Vector3(0, 1, 0)) {
    //     console.log(this.#localMatrix.clone())
    //     this.#localMatrix.lookAt(center, up);
    //     console.log(this.#localMatrix.clone())
    // }
}