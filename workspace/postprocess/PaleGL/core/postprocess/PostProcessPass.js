import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../Material.js";

const baseVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1);
}
`;

export class PostProcessPass {
    #geometry;
    material;

    constructor({ gpu, vertexShader = baseVertexShader, fragmentShader }) {
        this.#geometry = new PlaneGeometry({ gpu });
        this.material = new Material({
            gpu,
            vertexShader,
            fragmentShader
        });
    }
}