import PaleGL from "./palegl/index.js";

const canvas = document.getElementById("js-canvas");

const renderer = new PaleGL.ForwardRenderer(canvas);
const scene = new PaleGL.Scene();
const camera = new PaleGL.Camera();

const vertexShader = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPosition;

void main() {
  gl_Position = vec4(aPosition, 1);
}
`;

const fragmentShader = `#version 300 es

precision mediump float;

out vec4 outColor;

void main() {
  outColor = vec4(1, 1, 1, 1);
}
`;

const material = new PaleGL.Material({
  gpu: renderer.gpu,
  vertexShader,
  fragmentShader,
  primitiveType: PaleGL.GPU.PrimitiveTypes.Triangles,
});
const geometry = new PaleGL.Geometry({
  gpu: renderer.gpu,
  attributes: [
    new PaleGL.Attribute({
      type: PaleGL.Attribute.Types.Position,
      location: 0,
      stride: 3,
      // prettier-ignore
      data: [
        // left bottom
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
        -0.5, 0.5, 0,
      ],
    }),
  ],
});
const meshActor = new PaleGL.MeshActor({ geometry, material });

scene.add(meshActor);

const onWindowResize = (width, height) => {};

const onTick = () => {
  renderer.clear();
  renderer.render(scene, camera);
  // requestAnimationFrame(onTick);
};

window.addEventListener("resize", onWindowResize);

requestAnimationFrame(onTick);
