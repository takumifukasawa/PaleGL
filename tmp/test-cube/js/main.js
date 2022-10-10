import { Material } from "./palegl/Engine/Material.js";
import PaleGL from "./palegl/index.js";

const canvas = document.getElementById("js-canvas");

const renderer = new PaleGL.ForwardRenderer(canvas);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new PaleGL.Scene();
const perspectiveCameraActor = new PaleGL.CameraActor({
  camera: new PaleGL.PerspectiveCamera(90, 1, 0.1, 2),
});
perspectiveCameraActor.setPosition(new PaleGL.Vector3(0, 0, 1));

const vertexShader = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aColor;

out vec3 vColor;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  vColor = aColor;
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1);
}
`;

const fragmentShader = `#version 300 es

precision mediump float;

in vec3 vColor;
out vec4 outColor;

uniform float uTime;

void main() {
  outColor = vec4(vColor, 1);
  // outColor = vec4(vec3(uTime / 1000.), 1);
}
`;

const material = new PaleGL.Material({
  gpu: renderer.gpu,
  vertexShader,
  fragmentShader,
  primitiveType: PaleGL.GPU.PrimitiveTypes.Triangles,
  uniforms: {
    uTime: {
      type: Material.UniformTypes.Float,
      data: 0,
    },
    uViewMatrix: {
      type: Material.UniformTypes.Matrix4fv,
      data: PaleGL.Matrix4x4.identity(),
    },
    uProjectionMatrix: {
      type: Material.UniformTypes.Matrix4fv,
      data: PaleGL.Matrix4x4.identity(),
    },
  },
});
const geometry = new PaleGL.Geometry({
  gpu: renderer.gpu,
  attributes: [
    // position
    new PaleGL.Attribute({
      type: PaleGL.Attribute.Types.Position,
      stride: 3,
      // prettier-ignore
      data: [
        // left bottom
        -0.5, -0.5, 0,
        // right bottom
        0.5, -0.5, 0,
        // left top
        -0.5, 0.5, 0,
        // right top
        0.5, 0.5, 0,
      ],
    }),
    // color
    new PaleGL.Attribute({
      stride: 3,
      // prettier-ignore
      data: [
        // left bottom
        1, 0, 0,
        // right bottom
        0, 1, 0,
        // left top
        0, 0, 1,
        // right top
        1, 1, 1,
      ],
    }),
  ],
  indices: [0, 1, 2, 2, 1, 3],
});
const meshActor = new PaleGL.MeshActor({ geometry, material });

scene.add(meshActor);

const onWindowResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  // canvas.width = width * 2;
  // canvas.height = height * 2;
  // canvas.style.width = `${width}px`;
  // canvas.style.height = `${height}px`;
  renderer.setSize(width, height);
  perspectiveCameraActor.setSize({ width, height });
};

const onTick = () => {
  // TODO: sceneかengineに移したい
  meshActor.update();
  perspectiveCameraActor.update();

  meshActor.material.uniforms.uTime.data = performance.now();

  renderer.clear();
  renderer.render(scene, perspectiveCameraActor);
  requestAnimationFrame(onTick);
};

onWindowResize();
window.addEventListener("resize", onWindowResize);

requestAnimationFrame(onTick);
