import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";

export class GaussianBlurPass extends AbstractPostProcessPass {
    #passes = [];

    get renderTarget() {
        return this.#passes[this.#passes.length - 1].renderTarget;
    }

    constructor({ gpu }) {
        const blurShaderGenerator = (isHorizontal) => `#version 300 es

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

float gauss(float sigma, float x) {
    float sigma2 = sigma * sigma;
    return exp(-(x * x) / (2. * sigma));
}

uniform float uTargetWidth;
uniform float uTargetHeight;

void main() {
    vec4 textureColor = texture(uSceneTexture, vUv);
    vec4 sampleColor = vec4(0.);
    vec2 texelSize = vec2(1. / uTargetWidth, 1. / uTargetHeight);

    const int pixelNum = 7;
    float sum = 0.;
    float[pixelNum] weights;
    float width = floor(float(pixelNum) / 2.);
    float sigma = width;
    for(int i = 0; i < pixelNum; i++) {
        weights[i] = gauss(sigma, float(i) - width);
        sum += weights[i];
    }
    for(int i = 0; i < pixelNum; i++) {
        float weight = weights[i] /= sum;
        float index = float(i) - width;
        sampleColor += texture(uSceneTexture, vUv + vec2(${isHorizontal ? "index" : "0."}, ${isHorizontal ? "0." : "index"}) * texelSize) * weight;
    }
    
    outColor = sampleColor;
}
`;
        super();
        
        const horizontalBlurPass = new FragmentPass({
            name: "horizontal blur pass",
            gpu,
            fragmentShader: blurShaderGenerator(true),
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
        const verticalBlurPass = new FragmentPass({
            name: "vertical blur pass",
            gpu,
            fragmentShader: blurShaderGenerator(false),
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
        
        this.#passes.push(horizontalBlurPass);
        this.#passes.push(verticalBlurPass);
    }

    setSize(width, height) {
        this.#passes.forEach(pass => {
            pass.setSize(width, height);
            pass.material.uniforms.uTargetWidth.value = width;
            pass.material.uniforms.uTargetHeight.value = height;
        });
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        this.#passes.forEach((pass, i) => {
            pass.setRenderTarget(renderer, camera, isLastPass && i == this.#passes.length - 1);

            renderer.clear(
                camera.clearColor.x,
                camera.clearColor.y,
                camera.clearColor.z,
                camera.clearColor.w
            );

            pass.mesh.updateTransform();
            pass.material.uniforms.uSceneTexture.value = i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture;
            if(!pass.material.isCompiledShader) {
                pass.material.start({ gpu })
            }

            renderer.renderMesh(pass.geometry, pass.material);
        });
    }   
}