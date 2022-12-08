import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../materials/Material.js";
import {RenderTarget} from "../core/RenderTarget.js";
import {Mesh} from "../actors/Mesh.js";
import {PrimitiveTypes, UniformTypes} from "../constants.js";


export class PostProcessPass {
    #geometry;
    #material;
    renderTarget;
    mesh;
    enabled = true;
    
    constructor({ gpu, vertexShader, fragmentShader, uniforms }) {
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
    
    render({ gpu, prevRenderTarget }) {
        // このあたりの処理をpassに逃してもいいかもしれない
        this.mesh.updateTransform();
        this.mesh.material.uniforms.uSceneTexture.value = prevRenderTarget.texture;
        if(!this.mesh.material.isCompiledShader) {
            this.mesh.material.start({ gpu })
        }
    }
}