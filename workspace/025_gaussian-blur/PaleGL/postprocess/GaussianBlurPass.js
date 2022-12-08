import {PostProcessPass} from "./PostProcessPass.js";
import {UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";

export class GaussianBlurPass extends AbstractPostProcessPass {
    #passes = [];

    constructor({ gpu }) {
        const horizontalBlueFragmentShader = `#version 300 es

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
        super();
       
        const horizontalBlurPass = new FragmentPass({
            gpu,
            fragmentShader: horizontalBlueFragmentShader,
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
        
        // this.#verticalRenderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
    }

    setSize(width, height) {
        this.#passes.forEach(pass => {
            pass.setSize(width, height);
            pass.mesh.material.uniforms.uTargetWidth.value = width;
            pass.mesh.material.uniforms.uTargetHeight.value = height;
        });
    }

    setRenderTarget(renderer, camera, isLastPass) {
        if(isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this.renderTarget);
        }
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

            // このあたりの処理をpassに逃してもいいかもしれない
            pass.mesh.updateTransform();
            pass.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
            if(!pass.mesh.material.isCompiledShader) {
                pass.mesh.material.start({ gpu })
            }

            renderer.renderMesh(pass.mesh.geometry, pass.mesh.material);
        });
    }   
}