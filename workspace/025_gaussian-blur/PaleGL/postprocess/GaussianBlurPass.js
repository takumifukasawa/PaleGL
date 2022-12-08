import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";

export class GaussianBlurPass extends PostProcessPass {
    constructor({ gpu }) {
        const fragmentShader = `#version 300 es

precision mediump float;

in vec2 vUv;

out vec4 outColor;

uniform sampler2D uSceneTexture;

// ------------------------------------------------------
//
// # 3x3
//
// 1/4, 2/4, 1/4 を縦横 => 3 + 3 => 6回 fetch
//
// --------------------------
// | 1 | 2 | 1 |
// | 2 | 4 | 2 | * (1 / 16)
// | 1 | 2 | 1 |
// --------------------------
//
// # 5x5
//
// 1/16, 4/16, 6/16, 4/16, 1/16 を縦横 => 5 + 5 => 10回 fetch
//
// -------------------------------------
// | 1 | 4  | 6  | 4  | 1 |
// | 4 | 16 | 24 | 16 | 4 |
// | 6 | 24 | 36 | 24 | 6 | * (1/ 256)
// | 4 | 16 | 24 | 16 | 4 |
// | 1 | 4  | 6  | 4  | 1 |
// -------------------------------------
//
// ------------------------------------------------------

uniform float uTargetWidth;
uniform float uTargetHeight;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    vec4 sampleColor = vec4(0.);
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);
    // horizontal blue
    sampleColor += texture(uSceneTexture, vUv + vec2(-2., 0.) * texelSize) * (1. / 16.);
    sampleColor += texture(uSceneTexture, vUv + vec2(-1., 0.) * texelSize) * (4. / 16.);
    sampleColor += texture(uSceneTexture, vUv + vec2(0., 0.) * texelSize) * (6. / 16.);
    sampleColor += texture(uSceneTexture, vUv + vec2(1., 0.) * texelSize) * (4. / 16.);
    sampleColor += texture(uSceneTexture, vUv + vec2(2., 0.) * texelSize) * (1. / 16.);
    outColor = sampleColor;
}
`;
        super({
            gpu,
            fragmentShader,
            uniforms: {
                uTargetWidth: {
                    type: UniformTypes.Float,
                    value: 1,
                },
                uTargetHeight: {
                    type: UniformTypes.Float,
                    value: 1,
                }
            }
        });
    }
    
    setSize(width, height) {
        super.setSize(width, height);
        this.mesh.material.uniforms.uTargetWidth.value = width;
        this.mesh.material.uniforms.uTargetHeight.value = height;
    }
    
    render(options) {
        super.render(options);
    }
}