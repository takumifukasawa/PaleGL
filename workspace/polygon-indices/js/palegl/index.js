import { ForwardRenderer } from "./Engine/ForwardRenderer.js";
import { Engine } from "./Engine/Engine.js";
import { Scene } from "./Engine/Scene.js";
import { Camera } from "./Engine/Camera.js";
import { GPU } from "./GL/GPU.js";
import { Shader } from "./GL/Shader.js";
import { Material } from "./Engine/Material.js";
import { Geometry } from "./Engine/Geometry.js";
import { MeshActor } from "./Engine/Actor/MeshActor.js";
import { Attribute } from "./Engine/Attribute.js";

const PaleGL = {
  Scene,
  GPU,
  ForwardRenderer,
  Engine,
  Camera,
  Shader,
  Material,
  Geometry,
  MeshActor,
  Attribute,
};

export default PaleGL;
