// import gl
import { GPU } from "./GL/GPU.js";
import { Shader } from "./GL/Shader.js";

// import engine
import { Engine } from "./Engine/Engine.js";
import { ForwardRenderer } from "./Engine/ForwardRenderer.js";
import { Scene } from "./Engine/Scene.js";
import { PerspectiveCamera } from "./Engine/PerspectiveCamera.js";
import { Material } from "./Engine/Material.js";
import { Geometry } from "./Engine/Geometry.js";
import { MeshActor } from "./Engine/Actor/MeshActor.js";
import { CameraActor } from "./Engine/Actor/CameraActor.js";
import { Attribute } from "./Engine/Attribute.js";

// import math
import { Vector3 } from "./Math/Vector3.js";
import { Matrix4x4 } from "./Math/Matrix4x4.js";

const PaleGL = {
  // gl
  GPU,
  Shader,
  // engine
  Engine,
  ForwardRenderer,
  Scene,
  PerspectiveCamera,
  Material,
  Geometry,
  MeshActor,
  CameraActor,
  Attribute,
  // math
  Vector3,
  Matrix4x4,
};

export default PaleGL;
