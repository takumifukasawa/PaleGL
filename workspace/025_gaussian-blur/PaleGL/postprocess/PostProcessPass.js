import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../materials/Material.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Mesh} from "../actors/Mesh.js";
import {PrimitiveTypes, UniformTypes} from "../constants.js";
import {AbstractPostProcessPass} from "./AbstractPostProcessPass.js";


export class PostProcessPass extends AbstractPostProcessPass {
    #geometry;
    #material;
    renderTarget;
    mesh;
    
    constructor({ gpu, vertexShader, fragmentShader, uniforms, name }) {
        super({ name });

        const baseVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;
        vertexShader = vertexShader || baseVertexShader;

        // NOTE: geometryは親から渡して使いまわしてもよい
        this.#geometry = new PlaneGeometry({ gpu });
        this.#material = new Material({
            gpu,
            vertexShader,
            fragmentShader,
            uniforms: {
                ...uniforms, 
                uSceneTexture: {
                    type: UniformTypes.Texture,
                    value: null
                }
            },
            primitiveType: PrimitiveTypes.Triangles
        });
        this.mesh = new Mesh({
            geometry: this.#geometry,
            material: this.#material
        }); 
        
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
    }
  
    setSize(width, height) {
        this.renderTarget.setSize(width, height);
    }

    setRenderTarget(renderer, camera, isLastPass) {
        if(isLastPass) {
            renderer.setRenderTarget(camera.renderTarget);
        } else {
            renderer.setRenderTarget(this.renderTarget);
        }
    }

    render({ gpu, camera, renderer, prevRenderTarget, isLastPass }) {
        this.setRenderTarget(renderer, camera, isLastPass);

        renderer.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );

        // このあたりの処理をpassに逃してもいいかもしれない
        this.mesh.updateTransform();
        this.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
        if(!this.mesh.material.isCompiledShader) {
            this.mesh.material.start({ gpu })
        }

        renderer.renderMesh(this.mesh.geometry, this.mesh.material);
    }
}