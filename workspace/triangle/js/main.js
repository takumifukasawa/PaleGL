import PaleGL from "./palegl/index.js";

const canvas = document.getElementById("js-canvas");

const renderer = new PaleGL.ForwardRenderer(canvas);
const scene = new PaleGL.Scene();
const camera = new PaleGL.Camera();

const vertexShader = `#version 300 es
out vec4 position;
void main() {
  position = vec4(0, 0, 0, 1);
}
`;

const fragmentShader = `#version 300 es
out vec4 color;
void main() {
  color = vec4(1, 0, 0, 1);
}
`;

const gl = renderer.gl;
const material = new PaleGL.Material({
  gpu: renderer.gpu,
  vertexShader,
  fragmentShader,
});
const geometry = new PaleGL.Geometry({
  attributes: {
    positions: {
      // prettier-ignore
      data: [
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
        0, 0, 0,
      ],
    },
  },
});
const meshActor = new PaleGL.MeshActor({ geometry, material });

scene.add(meshActor);

const onWindowResize = (width, height) => {};

const onTick = () => {
  renderer.render(scene, camera);
  requestAnimationFrame(onTick);
};

window.addEventListener("resize", onWindowResize);

requestAnimationFrame(onTick);
