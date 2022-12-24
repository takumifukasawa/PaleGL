import {PostProcessPass} from "./PostProcessPass.js";
import {UniformNames, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";
import {gaussianBlurFragmentShader} from "../shaders/gaussianBlurShader.js";
import {RenderTarget} from "../core/RenderTarget.js";

export class BloomPass extends AbstractPostProcessPass {
    #passes = [];
    
    #renderTargetMip2;
    #renderTargetMip4;
    #renderTargetMip8;
    #renderTargetMip16;
    #horizontalBlurPass;
    #verticalBlurPass;

    get renderTarget() {
        return this.#passes[this.#passes.length - 1].renderTarget;
    }

    constructor({ gpu }) {
        super();
        
        this.#renderTargetMip2 = new RenderTarget({ gpu })
        this.#renderTargetMip4 = new RenderTarget({ gpu })
        this.#renderTargetMip8 = new RenderTarget({ gpu })
        this.#renderTargetMip16 = new RenderTarget({ gpu })
        
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
    }

    setSize(width, height) {
        // this.#passes.forEach((pass, i) => {
        //     pass.setSize(w, h);
        //     //pass.material.uniforms.uTargetWidth.value = w;
        //     //pass.material.uniforms.uTargetHeight.value = h;
        // });
        (new Array(4)).fill(0).forEach((_, i) => {
            const mipRate = 2 ^ (i + 1);
            const w = width / mipRate;
            const h = height / mipRate;
            this.#horizontalBlurPass.setSize(width, height);
            this.#verticalBlurPass.setSize(width, height);
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
            pass.material.uniforms[UniformNames.SceneTexture].value =
                i === 0
                    ? prevRenderTarget.texture
                    : this.#passes[i - 1].renderTarget.texture;

            if(!pass.material.isCompiledShader) {
                pass.material.start({ gpu })
            }

            renderer.renderMesh(pass.geometry, pass.material);
        });
    }
}