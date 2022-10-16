import {GPU} from "./PaleGL/Core/GPU.js";
import {Shader} from "./PaleGL/Core/Shader.js";
import {VertexArrayObject} from "./PaleGL/Core/VertexArrayObject.js";
import {AttributeTypes, PrimitiveTypes} from "./PaleGL/Core/constants.js";
import {Vector3} from "./PaleGL/Math/Vector3.js";
import {IndexBufferObject} from "./PaleGL/Core/IndexBufferObject.js";
import {Scene} from "./PaleGL/Core/Scene.js";
import {ForwardRenderer} from "./PaleGL/Core/ForwardRenderer.js";
import {Mesh} from "./PaleGL/Core/Mesh.js";
import {Geometry} from "./PaleGL/Core/Geometry.js";
import {Material} from "./PaleGL/Core/Material.js";

const canvas = document.getElementById("js-canvas");

const vertexShader = `#version 300 es

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

const gl = canvas.getContext('webgl2');

const gpu = new GPU({gl});

const scene = new Scene();

const renderer = new ForwardRenderer({gpu});

const geometry = new Geometry({
    gpu,
    attributes: {
        position: {
            // -----------------------------
            // 0 ---- 1
            // |      |
            // |      |
            // 3 ---- 2
            // -----------------------------
            data: [
                -0.5, 0.5, 0,
                0.5, 0.5, 0,
                0.5, -0.5, 0,
                -0.5, -0.5, 0
            ],
            size: 3
        },
        color: {
            data: [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
                1, 1, 0
            ],
            size: 3
        }
    },
    indices: [0, 2, 1, 0, 3, 2],
    drawCount: 6
});

const material = new Material({gpu, vertexShader, fragmentShader, primitiveType: PrimitiveTypes.Triangles});

const mesh = new Mesh(geometry, material);

scene.add(mesh);

gpu.setSize(512, 512);

renderer.render(scene);
