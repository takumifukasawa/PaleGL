
export const PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    LineLoop: "LineLoop",
    LineStrip: "LineStrip",
    Triangles: "Triangles",
    TriangleStrip: "TriangleStrip",
    TriangleFan: "TriangleFan",
};

export const AttributeTypes = {
    Position: "Position",
};

export const UniformTypes = {
    Matrix4: "Matrix4",
    Matrix4Array: "Matrix4Array",
    Texture: "Texture",
    CubeMap: "CubeMap",
    Vector3: "Vector3",
    Struct: "Struct",
    Float: "Float",
    Color: "Color",
};

export const TextureTypes = {
    RGBA: "RGBA",
    Depth: "Depth",
}

export const TextureWrapTypes = {
    Repeat: "Repeat",
    ClampToEdge: "ClampToEdge",
};

export const TextureFilterTypes = {
    Linear: "Linear",
};

export const BlendTypes = {
    Opaque: "Opaque",
    Transparent: "Transparent",
    Additive: "Additive",
};

export const RenderQueues = {
    Skybox: 1,
    Opaque: 2,
    Transparent: 3
};

export const RenderbufferTypes = {
    Depth: "Depth",
};

export const ActorTypes = {
    Null: "Null",
    Mesh: "Mesh",
    SkinnedMesh: "SkinnedMesh",
    Light: "Light",
    Skybox: "Skybox",
    Camera: "Camera",
};

export const CubeMapAxis = {
    PositiveX: "PositiveX",
    NegativeX: "NegativeX",
    PositiveY: "PositiveY",
    NegativeY: "NegativeY",
    PositiveZ: "PositiveZ",
    NegativeZ: "NegativeZ",
};

// export const CameraClearType = {
//     Skybox: "Skybox",
//     Color: "Color",
//     // TODO: type for NONE
// };

export const FaceSide = {
    Front: "Front",
    Back: "Back",
    Double: "Double"
};

// TODO: rename Type"s"
export const AttributeUsageType = {
    StaticDraw: "StaticDraw",
    DynamicDraw: "DynamicDraw"
}

export const RenderTargetTypes = {
    RGBA: "RGBA",
    Depth: "Depth"
}

export const AnimationClipTypes = {
    Vector3: "Vector3",
    Rotator: "Rotator",
}