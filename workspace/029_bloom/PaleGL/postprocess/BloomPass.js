import {PostProcessPass} from "./PostProcessPass.js";
import {UniformNames, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";
import {FragmentPass} from "./FragmentPass.js";
import {gaussianBlurFragmentShader} from "../shaders/gaussianBlurShader.js";
import {CopyPass} from "./CopyPass.js";

export class BloomPass extends AbstractPostProcessPass {
    #passes = [];
    
    get renderTarget() {
        return this.#passes[this.#passes.length - 1].renderTarget;
    }

    constructor({ gpu }) {
        super();

        this.#passes.push(new CopyPass({ gpu }));
        this.#passes.push(new CopyPass({ gpu }));
    }

    setSize(width, height) {
        this.#passes.forEach((pass, i) => {
            const w = width / (i === 0 ? 4 : 1);
            const h = height / (i === 0 ? 4 : 1)
            pass.setSize(w, h);
            if(pass.material.uniforms.uTargetWidth) {
                pass.material.uniforms.uTargetWidth.value = width;
            }
            if(pass.material.uniforms.uTargetHeight) {
                pass.material.uniforms.uTargetHeight.value = height;
            }
        });
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        console.log("------------")
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