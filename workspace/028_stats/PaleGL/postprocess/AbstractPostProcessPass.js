import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../materials/Material.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Mesh} from "../actors/Mesh.js";
import {PrimitiveTypes, UniformTypes} from "../constants.js";


export class AbstractPostProcessPass {
    name;
    enabled = true;

    constructor({ name = "" } = {}) {
        this.name = name;
    }
  
    setSize(width, height) {
        throw "[AbstractPostProcessPass.setSize] should implementation";
    }

    setRenderTarget(renderer, camera, isLastPass) {
        throw "[AbstractPostProcessPass.setRenderTarget] should implementation";
    }
    
    render({ gpu, camera, renderer, prevRenderTarget, isLastPass } = {}) {
        throw "[AbstractPostProcessPass.render] should implementation";
    }
}