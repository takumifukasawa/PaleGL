// export type NodeBase = ReturnType<typeof createNodeBase>;
export type NodeBase = {
    name: string
    parent: NodeBase | null;
    children: NodeBase[];
};

export function createNodeBase({ name }: { name: string }): NodeBase {
    const parent: NodeBase | null = null;
    const children: NodeBase[] = [];

    // // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    // const updateMatrix = () => {
    //     console.error('should implementation');
    // }

    return {
        name,
        parent,
        children
    };
}

export function addChildNode(parent: NodeBase, child: NodeBase) {
    // parent.addChild(child);
    // child.setParent(parent);
    addChildInternal(parent, child);
    setParentInternal(child, parent);
}

export function getNodeChildCount (node: NodeBase) {
    return node.children.length;
}

export function hasNodeChild (node: NodeBase) {
    return getNodeChildCount(node) > 0;
}

function setParentInternal (node: NodeBase, parent: NodeBase) {
    node.parent = parent;
}

function addChildInternal (node: NodeBase, child: NodeBase) {
     node.children.push(child);
}
