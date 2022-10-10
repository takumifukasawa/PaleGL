import PaleGL from "./palegl/index.js";

const canvas = document.getElementById("js-canvas");

const renderer = new PaleGL.ForwardRenderer(canvas);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new PaleGL.Scene();
const camera = new PaleGL.Camera();

const vertexShader = `#version 300 es

precision mediump float;

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aColor;

out vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = vec4(aPosition, 1);
}
`;

const fragmentShader = `#version 300 es

precision mediump float;

in vec3 vColor;
out vec4 outColor;

void main() {
  outColor = vec4(vColor, 1);
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
      ],
    }),
  ],
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
};

const onTick = () => {
  renderer.clear();
  renderer.render(scene, camera);
  // requestAnimationFrame(onTick);
};

onWindowResize();
window.addEventListener("resize", onWindowResize);

requestAnimationFrame(onTick);
