import {PostProcessPass} from "./PostProcessPass.js";
import {UniformNames, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";
import {gaussianBlurFragmentShader} from "../shaders/gaussianBlurShader.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {CopyPass} from "./CopyPass.js";

export class BloomPass extends AbstractPostProcessPass {
    #extractBrightnessPass;

    #renderTargetExtractBrightness;
    #renderTargetMip4;
    #renderTargetMip8;
    #renderTargetMip16;
    #renderTargetMip32;
    
    #horizontalBlurPass;
    #verticalBlurPass;
    
    #lastPass;
    
    #blurMipPass4;
    #blurMipPass8;
    #blurMipPass16;
    #blurMipPass32;

    get renderTarget() {
        return this.#lastPass.renderTarget;
    }

    constructor({ gpu }) {
        super();
       
        this.#renderTargetExtractBrightness = new RenderTarget({ gpu });
        this.#renderTargetMip4 = new RenderTarget({ gpu })
        this.#renderTargetMip8 = new RenderTarget({ gpu })
        this.#renderTargetMip16 = new RenderTarget({ gpu })
        this.#renderTargetMip32 = new RenderTarget({ gpu })
        
        // const copyPass = new CopyPass({ gpu });
        // this.#passes.push(copyPass);
        
        this.#extractBrightnessPass = new FragmentPass({
            gpu,
            fragmentShader: `#version 300 es
            
precision mediump float;

out vec4 outColor;

in vec2 vUv;

uniform sampler2D ${UniformNames.SceneTexture};

float k = .8;

void main() {
    vec4 color = texture(${UniformNames.SceneTexture}, vUv);
    vec4 b = (color - k) / (1. - k);
    outColor = b;
    outColor = color;
}
            `,
        });
        
        const blurPixelNum = 7;
        
        this.#horizontalBlurPass = new FragmentPass({
            name: "horizontal blur pass",
            gpu,
            fragmentShader: gaussianBlurFragmentShader({
                isHorizontal: true, pixelNum: blurPixelNum, srcTextureUniformName: UniformNames.SceneTexture,
            }),
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
        this.#verticalBlurPass = new FragmentPass({
            name: "vertical blur pass",
            gpu,
            fragmentShader: gaussianBlurFragmentShader({
                isHorizontal: false, pixelNum: blurPixelNum, srcTextureUniformName: UniformNames.SceneTexture,
            }),
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

        this.#lastPass = new CopyPass({ gpu });
        // this.#passes.push(this.#lastPass);
    }
    
    #width = 1;
    #height = 1;

    setSize(width, height) {
        this.#width = width;
        this.#height = height;
        
        this.#extractBrightnessPass.setSize(width, height);
        this.#lastPass.setSize(width, height);
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        this.#extractBrightnessPass.render({ gpu, camera, renderer, prevRenderTarget });
        
        this.#renderTargetMip4.setSize(this.#width / 4, this.#height / 4);
        
        for(let i = 0; i < 2; i++) {
            const s = i === 0 ? 2 : 4;
            // this.#horizontalBlurPass.renderTarget = this.#renderTargetMip4;
            this.#horizontalBlurPass.material.uniforms.uTargetWidth.value = this.#width / s;
            this.#horizontalBlurPass.material.uniforms.uTargetHeight.value = this.#height / s;
            this.#horizontalBlurPass.setSize(this.#width / s, this.#height / s);
            this.#horizontalBlurPass.render({
                gpu,
                camera,
                renderer,
                prevRenderTarget: i === 0 ? this.#extractBrightnessPass.renderTarget : this.#verticalBlurPass.renderTarget,
            });

            // this.#verticalBlurPass.renderTarget = this.#renderTargetMip4;
            this.#verticalBlurPass.material.uniforms.uTargetWidth.value = this.#width / s;
            this.#verticalBlurPass.material.uniforms.uTargetHeight.value = this.#height / s;
            this.#verticalBlurPass.setSize(this.#width / s, this.#height / s);
            this.#verticalBlurPass.render({
                gpu,
                camera,
                renderer,
                prevRenderTarget: this.#horizontalBlurPass.renderTarget,
            });
        }

        this.#lastPass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: this.#verticalBlurPass.renderTarget,
            isLastPass
        });

        // this.#passes.forEach((pass, i) => {
        //     pass.setRenderTarget(renderer, camera, isLastPass && i == this.#passes.length - 1);

        //     renderer.clear(
        //         camera.clearColor.x,
        //         camera.clearColor.y,
        //         camera.clearColor.z,
        //         camera.clearColor.w
        //     );

        //     pass.mesh.updateTransform();
        //     pass.material.uniforms[UniformNames.SceneTexture].value =
        //         i === 0
        //             ? prevRenderTarget.texture
        //             : this.#passes[i - 1].renderTarget.texture;

        //     if(!pass.material.isCompiledShader) {
        //         pass.material.start({ gpu })
        //     }

        //     renderer.renderMesh(pass.geometry, pass.material);
        // });
    }
}