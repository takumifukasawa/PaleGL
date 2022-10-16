import {GPU} from "./PaleGL/Core/GPU.js";
import {Shader} from "./PaleGL/Core/Shader.js";
import {VertexArrayObject} from "./PaleGL/Core/VertexArrayObject.js";
import {AttributeTypes, PrimitiveTypes} from "./PaleGL/Core/constants.js";
import {Vector3} from "./PaleGL/Math/Vector3.js";

const v = new Vector3(1, 2, 3);
console.log(v.x)

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
    outColor = vec4(1, 0, 0, 1);
}
`;

const gl = canvas.getContext('webgl2');

const gpu = new GPU({gl});
const shader = new Shader({gpu, vertexShader, fragmentShader});

const vao = new VertexArrayObject({
    gpu, attributes: [
        {
            data: [
                -0.5, 0.5, 0,
                0.5, 0.5, 0,
                0.5, -0.5, 0
            ],
            location: 0,
            size: 3
        }
    ]
});

gpu.setSize(512, 512);

gpu.setShader(shader);
gpu.setVertexArrayObject(vao);

gpu.draw(3, PrimitiveTypes.Triangles, 0);
