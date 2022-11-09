import {PostProcessPass} from "./PostProcessPass.js";

const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    outColor = textureColor;
}
`;

export class CopyPass extends PostProcessPass {
    constructor({ gpu }) {
        super({ gpu, fragmentShader });
    }
}