// export type NodeBase = ReturnType<typeof createNodeBase>;
export type NodeBase = {
    getName: () => string;
    getParent: () => NodeBase | null;
    getChildren: () => NodeBase[];
    getChildCount: () => number;
    hasChild: () => boolean;
    setParent: (parent: NodeBase) => void;
    addChild: (child: NodeBase) => void;
};

export function addChildNode(parent: NodeBase, child: NodeBase) {
    parent.addChild(child);
    child.setParent(parent);
}

export function createNodeBase({ name }: { name: string }): NodeBase {
    const _name: string = name;
    let _parent: NodeBase | null = null;
    const _children: NodeBase[] = [];

    const getChildCount = () => {
        return _children.length;
    };

    const hasChild = () => {
        return getChildCount() > 0;
    };

    const setParent = (parent: NodeBase) => (_parent = parent);

    const addChild = (child: NodeBase) => {
        _children.push(child);
    };

    // // TODO: 引数でworldMatrixとdirty_flagを渡すべきな気がする
    // const updateMatrix = () => {
    //     console.error('should implementation');
    // }

    return {
        // getter, setter
        getName: () => _name,
        getParent: () => _parent,
        getChildren: () => _children,
        // methods
        getChildCount,
        hasChild,
        setParent,
        addChild,
    };
}
