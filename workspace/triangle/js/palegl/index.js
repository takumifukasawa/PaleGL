import { ForwardRenderer } from "./ForwardRenderer.js";
import { Engine } from "./Engine.js";
import { Scene } from "./Scene.js";
import { Camera } from "./Camera.js";
import { GPU } from "./GL/GPU.js";
import { Shader } from "./GL/Shader.js";
import { Material } from "./Material.js";
import { Geometry } from "../Geometry.js";
import { MeshActor } from "./MeshActor.js";

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
};

export default PaleGL;
