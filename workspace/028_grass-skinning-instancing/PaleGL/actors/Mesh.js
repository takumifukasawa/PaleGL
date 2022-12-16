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
    instanced;
    autoGenerateDepthMaterial;
    
    get material() {
        if(this.hasMaterials) {
            console.warn("[Mesh.material getter] materials length > 1. material is head of materials.")
        }
        // return this.materials[0];
        return this.mainMaterial;
    }
    
    set material(material) {
        this.materials = [material];
    }
    
    get mainMaterial() {
        return this.materials[0];
    }
    
    get hasMaterials() {
        return this.materials.length > 1;
    }
    
    constructor({
        geometry,
        material,
        materials,
        depthMaterial = null,
        actorType = ActorTypes.Mesh,
        castShadow = false,
        instanced = false,
        autoGenerateDepthMaterial = true
    }) {
        super(actorType);
        this.geometry = geometry;
        // this.material = material;
        // TODO: check material is array
        this.materials = material !== null ? [material] : materials;
        this.depthMaterial = depthMaterial;
        this.castShadow = !!castShadow;
        this.instanced = !!instanced;
        this.autoGenerateDepthMaterial = autoGenerateDepthMaterial;
    }

    start(options) {
        super.start(options);
        
        const { gpu } = options;
        
        // 未コンパイルであればコンパイルする
        this.materials.forEach(material => {
            if(!material.isCompiledShader) {
                material.start({
                    gpu,
                    attributeDescriptors: this.geometry.getAttributeDescriptors()
                });
            }
        });

        if(
            !this.depthMaterial &&
            this.autoGenerateDepthMaterial
        ) {
            this.depthMaterial = new Material({
                gpu,
                vertexShader: this.mainMaterial.vertexShader,
                fragmentShader: this.mainMaterial.depthFragmentShader || generateDepthFragmentShader(),
                uniforms: this.mainMaterial.depthUniforms,
                faceSide: this.mainMaterial.faceSide
            });
        }       
        
        if(this.depthMaterial && !this.depthMaterial.isCompiledShader) {
            this.depthMaterial.start({
                gpu,
                attributeDescriptors: this.geometry.getAttributeDescriptors()
            });
        }
    }
}