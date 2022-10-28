import {PlaneGeometry} from "../geometries/PlaneGeometry.js";
import {Material} from "../Material.js";
import {OrthographicCamera} from "../OrthographicCamera.js";
import {Vector3} from "../../math/Vector3.js";
import {RenderTarget} from "../RenderTarget.js";
import {Scene} from "../Scene.js";
import {Mesh} from "../Mesh.js";
import {PrimitiveTypes, UniformTypes} from "../constants.js";

const baseVertexShader = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aUv;

out vec2 vUv;

void main() {
    vUv = aUv;
    gl_Position = vec4(aPosition, 1);
}
`;

export class PostProcessPass {
    // #scene = new Scene();
    #geometry;
    #material;
    // #camera;
    // renderToScreen = false;
    renderTarget;
    mesh;
    
    constructor({ gpu, vertexShader = baseVertexShader, fragmentShader, uniforms }) {
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
        this.mesh = new Mesh(this.#geometry, this.#material); 
        // this.#scene.add(this.mesh);
        
        this.renderTarget = new RenderTarget({ gpu, width: 1, height: 1 });
        
        // this.#camera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
        // this.#camera.transform.setTranslation(new Vector3(0, 0, 1));
    }
  
    setSize(width, height) {
        // this.#camera.setSize(width, height);
        this.renderTarget.setSize(width, height);
    }

    // render(prevPassRenderTarget) {
    //     // this.#camera.setRenderTarget(this.renderToScreen ? null : this.renderTarget);
    //     this.#material.uniforms.uSceneTexture.value = prevPassRenderTarget.texture;
    //     // renderer.render(this.#scene, this.#camera);
    // }
}