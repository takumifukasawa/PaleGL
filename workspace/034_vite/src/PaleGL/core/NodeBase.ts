export class NodeBase {
    name: string;
    parent: NodeBase | null = null;
    children: NodeBase[] = [];

    constructor({name}: { name: string }) {
        this.name = name;
    }

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    addChild(child: NodeBase) {
        this.children.push(child);
        child.parent = this;
    }

    // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    updateMatrix() {
        throw "should implementation"
    }
}