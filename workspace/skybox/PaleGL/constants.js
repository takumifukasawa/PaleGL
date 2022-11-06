
export const PrimitiveTypes = {
    Points: "Points",
    Lines: "Lines",
    Triangles: "Triangles"
};

export const AttributeTypes = {
    Position: "Position",
};

export const UniformTypes = {
    Matrix4: "Matrix4",
    Texture: "Texture",
    CubeMap: "CubeMap",
    Vector3: "Vector3",
    Struct: "Struct",
    Float: "Float",
    Color: "Color"
};

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
    Light: "Light",
    Skybox: "Skybox"
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