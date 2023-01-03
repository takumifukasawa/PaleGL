import {PostProcessPass} from "./PostProcessPass.js";
import {UniformNames, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";
import {gaussianBlurFragmentShader} from "../shaders/gaussianBlurShader.js";
import {getGaussianBlurWeights} from "../utilities/gaussialBlurUtilities";

export class GaussianBlurPass extends AbstractPostProcessPass {
    #passes = [];

    get renderTarget() {
        return this.#passes[this.#passes.length - 1].renderTarget;
    }

    constructor({ gpu, blurPixelNum = 7 }) {
        super();
        
        const blurWeights = getGaussianBlurWeights(blurPixelNum, Math.floor(blurPixelNum / 2));
        
        const horizontalBlurPass = new FragmentPass({
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
                },
                uBlurWeights: {
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights)
                }
            }           
        });
        const verticalBlurPass = new FragmentPass({
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
                },
                uBlurWeights: {
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights)
                }
            }           
        });
        
        this.#passes.push(horizontalBlurPass);
        this.#passes.push(verticalBlurPass);
    }

    setSize(width, height) {
        this.#passes.forEach(pass => {
            pass.setSize(width, height);
            // pass.material.uniforms.uTargetWidth.value = width;
            // pass.material.uniforms.uTargetHeight.value = height;
            this.material.updateUniform("uTargetWidth", width);
            this.material.updateUniform("uTargetHeight", height);
        });
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        this.#passes.forEach((pass, i) => {
            pass.setRenderTarget(renderer, camera, isLastPass && i == this.#passes.length - 1);

            // TODO: pass内で好きに設定してよさそう
            renderer.clear(
                camera.clearColor.x,
                camera.clearColor.y,
                camera.clearColor.z,
                camera.clearColor.w
            );

            // TODO: mesh経由する必要たぶんない
            pass.mesh.updateTransform();
            // pass.material.uniforms[UniformNames.SceneTexture].value = i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture;
            pass.material.updateUniform(UniformNames.SceneTexture, i === 0 ? prevRenderTarget.texture : this.#passes[i - 1].renderTarget.texture);
            if(!pass.material.isCompiledShader) {
                pass.material.start({ gpu })
            }

            renderer.renderMesh(pass.geometry, pass.material);
        });
    }   
}