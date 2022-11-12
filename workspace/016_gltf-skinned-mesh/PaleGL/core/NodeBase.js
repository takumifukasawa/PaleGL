import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {ActorTypes} from "../constants.js";
import {Rotator} from "../math/Rotator.js";

export class NodeBase {
    name;
    parent;
    children = [];
    
    constructor({ name }) {
        this.name = name;
    }

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }

    // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    updateMatrix() {
        throw "should implementation"
    }
}