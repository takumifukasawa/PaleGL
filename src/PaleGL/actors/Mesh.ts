﻿import { Actor, ActorArgs, ActorStartArgs } from '@/PaleGL/actors/Actor';
import { ActorType, ActorTypes, DepthFuncTypes } from '@/PaleGL/constants';
import { Material } from '@/PaleGL/materials/Material';
import { defaultDepthFragmentShader } from '@/PaleGL/core/buildShader.ts';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import {UniformValue} from "@/PaleGL/core/Uniforms.ts";

export type MeshOptionsArgs = {
    castShadow?: boolean;
    instanced?: boolean;
    autoGenerateDepthMaterial?: boolean;
    renderEnabled?: boolean;
};

export type MeshArgs = ActorArgs & {
    // required
    geometry: Geometry;
    // optional
    material?: Material;
    actorType?: ActorType;
    materials?: Material[];
    depthMaterial?: Material;
    depthMaterials?: Material[];
    // actorType?: ActorTypes,
} & MeshOptionsArgs;

export class Mesh extends Actor {
    geometry: Geometry;
    // material;
    materials: Material[] = [];
    depthMaterials: Material[] = [];
    castShadow: boolean;
    instanced: boolean;
    autoGenerateDepthMaterial: boolean;
    renderEnabled: boolean;

    get material() {
        if (this.hasMaterials) {
            console.warn('[Mesh.material getter] materials length > 1. material is head of materials.');
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
        name,
        geometry,
        material,
        materials = [],
        depthMaterial,
        depthMaterials = [],
        actorType,
        castShadow = false,
        instanced = false,
        autoGenerateDepthMaterial = true,
        renderEnabled = true,
    }: MeshArgs) {
        super({ name, type: actorType || ActorTypes.Mesh });
        this.geometry = geometry;
        // this.material = material;
        // TODO: check material is array
        this.materials = material ? [material] : materials ? materials : [];
        this.depthMaterials = depthMaterial ? [depthMaterial] : depthMaterials ? depthMaterials : [];
        this.castShadow = !!castShadow;
        this.instanced = !!instanced;
        this.autoGenerateDepthMaterial = !!autoGenerateDepthMaterial;
        this.renderEnabled = !!renderEnabled;
    }

    // TODO: args は { gpu } だけでいいかも
    start(args: ActorStartArgs) {
        // const {gpu} = options;

        super.start(args);

        const { gpu } = args;

        this.geometry.start();

        // 未コンパイルであればコンパイルする
        this.materials.forEach((material) => {
            if (!material.isCompiledShader) {
                material.start({
                    gpu,
                    attributeDescriptors: this.geometry.getAttributeDescriptors(),
                });
            }
        });

        this.materials.forEach((material, i) => {
            if (!this.depthMaterials[i] && this.autoGenerateDepthMaterial) {
                // for debug
                // console.log(this.material, this.materials)
                // TODO: depth material から clone した方がいい気がする
                this.depthMaterials[i] = new Material({
                    name: `${material.name}/depth`,
                    // gpu,
                    // vertexShader: this.mainMaterial.vertexShader,
                    vertexShader: material.rawVertexShader!,
                    fragmentShader: material.depthFragmentShader || defaultDepthFragmentShader(),
                    uniforms: material.depthUniforms.data, // TODO: deepcopyした方がよい？
                    faceSide: material.faceSide,
                    depthTest: true,
                    depthWrite: true,
                    depthFuncType: DepthFuncTypes.Lequal,
                    alphaTest: material.alphaTest,
                    skipDepthPrePass: !!material.skipDepthPrePass,

                    // TODO: 手動でいろいろ追加しなきゃなのが面倒
                    isInstancing: material.isInstancing,
                    useInstanceLookDirection: material.useInstanceLookDirection,
                    useVertexColor: material.useVertexColor,

                    uniformBlockNames: material.uniformBlockNames, // TODO: 外側からも追加して渡せるほうがいいかもしれない
                    // depthFuncType: this.mainMaterial.depthFuncType
                });
            }
        });

        this.depthMaterials.forEach((material) => {
            if (!material.isCompiledShader) {
                material.start({
                    gpu,
                    attributeDescriptors: this.geometry.getAttributeDescriptors(),
                });
            }
        });

        // for debug
        // console.log("main raw vertex", this.mainMaterial.rawVertexShader)
        // console.log("main raw fragment", this.mainMaterial.rawFragmentShader)
        // console.log("depth raw vertex", this.depthMaterial.rawVertexShader)
    }

    // beforeRender({ gpu }: { gpu: GPU }) {
    //     super.beforeRender({ gpu });
    //     // this.materials.forEach(material => material.updateUniforms({ gpu }));
    //     // this.depthMaterial.updateUniforms({ gpu });
    // }

    // TODO: render前の方がよい気がする
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateMaterial(_args: { camera: Camera }) {
        this.materials.forEach((material) => material.updateUniforms());
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateDepthMaterial(_args: { camera: Camera }) {
        this.depthMaterials.forEach((material) => material.updateUniforms());
    }
    
    setUniformValueToPairMaterial(i: number, name: string, newValue: UniformValue) {
        this.materials[i].uniforms.setValue(name, newValue);
        this.depthMaterials[i].uniforms.setValue(name, newValue);
    }
    
    setUniformValueToAllMaterials(name: string, newValue: UniformValue) {
        this.materials.forEach((material) => material.uniforms.setValue(name, newValue));
        this.depthMaterials.forEach((material) => material.uniforms.setValue(name, newValue));
    }
    
    setCanRenderMaterial(index: number, flag: boolean) {
        this.materials[index].canRender = flag;
        this.depthMaterials[index].canRender = flag;
    }
}
