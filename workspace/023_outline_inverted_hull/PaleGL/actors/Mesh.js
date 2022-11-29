﻿import {Actor} from "./Actor.js";
import {ActorTypes, UniformTypes} from "./../constants.js";
import {Material} from "../materials/Material.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader.js";

export class Mesh extends Actor {
    geometry;
    // material;
    materials = [];
    depthMaterial;
    castShadow;
    autoGenerateDepthMaterial;
    
    get material() {
        if(this.materials.length > 1) {
            console.warn("[Mesh.material getter] materials length > 1. material is head of materials.")
        }
        // return this.materials[0];
        return this.mainMaterial;
    }
    
    set material(material) {
        this.materials = [material];
    }
    
    get mainMaterial() {
        // materiamainMaterial.alphaTest
        return this.materials[0];
    }
    
    constructor({
        geometry,
        material,
        materials,
        depthMaterial = null,
        actorType = ActorTypes.Mesh,
        castShadow = false,
        autoGenerateDepthMaterial = true
    }) {
        super(actorType);
        this.geometry = geometry;
        // this.material = material;
        // TODO: check material is array
        this.materials = material !== null ? [material] : materials;
        this.depthMaterial = depthMaterial;
        this.castShadow = !!castShadow;
        this.autoGenerateDepthMaterial = autoGenerateDepthMaterial;
    }
 
    start(options) {
        super.start(options);
        
        const { gpu } = options;
        
        if(
            !this.depthMaterial &&
            this.autoGenerateDepthMaterial
        ) {
            this.depthMaterial = new Material({
                gpu,
                vertexShader: this.material.vertexShader,
                fragmentShader: this.material.depthFragmentShader || generateDepthFragmentShader(),
                uniforms: this.material.depthUniforms,
                faceSide: this.material.faceSide
            });
        }
    }

    // beforeRenderはActorに持たせても良い
    beforeRender(options) {
        const { gpu } = options;

        this.materials.forEach(material => {
            if(!material.isCompiledShader) {
                material.compileShader({ gpu });
            }
        });
        if(this.depthMaterial && !this.depthMaterial.isCompiledShader) {
            this.depthMaterial.compileShader({ gpu });
        }       
    }
}