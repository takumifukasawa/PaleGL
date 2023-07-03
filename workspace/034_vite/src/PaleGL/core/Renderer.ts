import {
    ActorTypes,
    BlendTypes,
    RenderQueueType,
    UniformNames,
    UniformTypes
} from "./../constants";
import {Matrix4} from "../math/Matrix4";
import {GPU} from "./GPU";
import {Stats} from "../utilities/Stats";
import {Light} from "../actors/Light";
import {Mesh} from "../actors/Mesh";
import {Scene} from "./Scene";
import {Camera, CameraRenderTargetType} from "../actors/Camera";
import {Material} from "../materials/Material";
import {Geometry} from "../geometries/Geometry";

type RenderMeshInfo = { actor: Mesh, materialIndex: number };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[]
};

export class Renderer {
    private gpu;
    canvas;
    pixelRatio;
    private realWidth: number = 1;
    private realHeight: number = 1;
    #stats: Stats | null = null;

    constructor({gpu, canvas, pixelRatio = 1.5}: { gpu: GPU, canvas: HTMLCanvasElement, pixelRatio: number }) {
        this.gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
    }

    setStats(stats: Stats) {
        this.#stats = stats;
    }

    setSize(realWidth: number, realHeight: number) {
        // setSize(width: number, height: number, realWidth: number, realHeight: number) {
        this.realWidth = realWidth;
        this.realHeight = realHeight;
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHeight;
        this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
    }

    setRenderTarget(renderTarget: CameraRenderTargetType) {
        if (renderTarget) {
            this.gpu.setFramebuffer(renderTarget.framebuffer)
            this.gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.gpu.setFramebuffer(null)
            this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
        }
    }

    flush() {
        this.gpu.flush();
    }

    // TODO: pass Color
    clear(r: number, g: number, b: number, a: number) {
        this.gpu.clear(r, g, b, a);
    }

    #shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        castShadowLightActors.forEach(lightActor => {
            if (!lightActor.shadowMap) {
                return;
            }
            if (!lightActor.shadowCamera) {
                return;
            }
            this.setRenderTarget(lightActor.shadowMap.write);
            this.clear(0, 0, 0, 1);

            if (castShadowRenderMeshInfos.length < 1) {
                return;
            }

            castShadowRenderMeshInfos.forEach(({actor}) => {
                const targetMaterial = actor.depthMaterial;

                // // TODO: material 側でやった方がよい？
                // if (targetMaterial.uniforms[UniformNames.WorldMatrix]) {
                //     targetMaterial.uniforms[UniformNames.WorldMatrix].value = actor.transform.worldMatrix;
                // }
                // if (targetMaterial.uniforms[UniformNames.ViewMatrix]) {
                //     targetMaterial.uniforms[UniformNames.ViewMatrix].value = lightActor.shadowCamera.viewMatrix;
                // }
                // if (targetMaterial.uniforms[UniformNames.ProjectionMatrix]) {
                //     targetMaterial.uniforms[UniformNames.ProjectionMatrix].value = lightActor.shadowCamera.projectionMatrix;
                // }

                // TODO: material 側でやった方がよい？
                if (!targetMaterial) {
                    throw "invalid target material";
                }

                // 先頭でガードしてるので shadow camera はあるはず。
                targetMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
                targetMaterial.updateUniform(UniformNames.ViewMatrix, lightActor.shadowCamera!.viewMatrix);
                targetMaterial.updateUniform(UniformNames.ProjectionMatrix, lightActor.shadowCamera!.projectionMatrix);
                this.renderMesh(actor.geometry, targetMaterial);
            });
        });
    }

    #buildRenderMeshInfo(actor: Mesh, materialIndex: number = 0): RenderMeshInfo {
        return {
            actor,
            materialIndex
        }
    }

    #scenePass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: Light[],
        clear: boolean = true
    ) {
        // TODO: refactor
        if (clear) {
            this.clear(
                camera.clearColor.x,
                camera.clearColor.y,
                camera.clearColor.z,
                camera.clearColor.w
            );
        }

        sortedRenderMeshInfos.forEach(({actor, materialIndex}) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];
            // const targetMaterial = actor.depthMaterial;

            // reset
            // NOTE: 余計なresetとかしない方がいい気がする
            // if(targetMaterial.uniforms.uShadowMap) {
            //     targetMaterial.uniforms.uShadowMap.value = null;
            // }

            // // TODO: material 側でやった方がよい？
            // if (targetMaterial.uniforms[UniformNames.WorldMatrix]) {
            //     targetMaterial.uniforms[UniformNames.WorldMatrix].value = actor.transform.worldMatrix;
            // }
            // if (targetMaterial.uniforms[UniformNames.ViewMatrix]) {
            //     targetMaterial.uniforms[UniformNames.ViewMatrix].value = camera.viewMatrix;
            // }
            // if (targetMaterial.uniforms[UniformNames.ProjectionMatrix]) {
            //     targetMaterial.uniforms[UniformNames.ProjectionMatrix].value = camera.projectionMatrix;
            // }
            // if (targetMaterial.uniforms[UniformNames.NormalMatrix]) {
            //     targetMaterial.uniforms[UniformNames.NormalMatrix].value = actor.transform.worldMatrix.clone().invert().transpose();
            // }
            // if (targetMaterial.uniforms[UniformNames.ViewPosition]) {
            //     targetMaterial.uniforms[UniformNames.ViewPosition].value = camera.transform.worldMatrix.position;
            // }

            // TODO: material 側でやった方がよい？
            targetMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            targetMaterial.updateUniform(UniformNames.ViewMatrix, camera.viewMatrix);
            targetMaterial.updateUniform(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            targetMaterial.updateUniform(UniformNames.NormalMatrix, actor.transform.worldMatrix.clone().invert().transpose());
            targetMaterial.updateUniform(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意 
            lightActors.forEach(light => {
                if (targetMaterial.uniforms.uDirectionalLight) {
                    // targetMaterial.uniforms.uDirectionalLight = {
                    //     type: UniformTypes.Struct,
                    //     value: {
                    //         direction: {
                    //             type: UniformTypes.Vector3,
                    //             value: light.transform.position,
                    //         },
                    //         intensity: {
                    //             type: UniformTypes.Float,
                    //             value: light.intensity,
                    //         },
                    //         color: {
                    //             type: UniformTypes.Color,
                    //             value: light.color
                    //         }
                    //     }
                    // }
                    targetMaterial.updateUniform("uDirectionalLight", {
                        direction: {
                            type: UniformTypes.Vector3,
                            value: light.transform.position,
                        },
                        intensity: {
                            type: UniformTypes.Float,
                            value: light.intensity,
                        },
                        color: {
                            type: UniformTypes.Color,
                            value: light.color
                        }
                    });
                }

                if (
                    targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix] &&
                    targetMaterial.receiveShadow &&
                    light.castShadow &&
                    light.shadowCamera &&
                    light.shadowMap
                ) {
                    // clip coord (-1 ~ 1) to uv (0 ~ 1)
                    const textureMatrix = new Matrix4(
                        0.5, 0, 0, 0.5,
                        0, 0.5, 0, 0.5,
                        0, 0, 0.5, 0.5,
                        0, 0, 0, 1
                    );
                    const textureProjectionMatrix = Matrix4.multiplyMatrices(
                        textureMatrix,
                        light.shadowCamera.projectionMatrix.clone(),
                        light.shadowCamera.viewMatrix.clone()
                    );

                    // // TODO:
                    // // - directional light の構造体に持たせた方がいいかもしれない
                    // if(targetMaterial.uniforms[UniformNames.ShadowMap]) {
                    //     targetMaterial.uniforms[UniformNames.ShadowMap].value = light.shadowMap.read.texture;
                    // }
                    // if(targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix]) {
                    //     targetMaterial.uniforms[UniformNames.ShadowMapProjectionMatrix].value = textureProjectionMatrix;
                    // }
                    targetMaterial.updateUniform(UniformNames.ShadowMap, light.shadowMap.read.depthTexture);
                    targetMaterial.updateUniform(UniformNames.ShadowMapProjectionMatrix, textureProjectionMatrix);
                }
            });

            this.renderMesh(actor.geometry, targetMaterial);
        });
    }

    render(scene: Scene, camera: Camera, {useShadowPass = true, clearScene = true}) {
        const renderMeshInfoEachQueue: RenderMeshInfoEachQueue = {
            [RenderQueueType.Skybox]: [],
            [RenderQueueType.Opaque]: [],
            [RenderQueueType.AlphaTest]: [],
            [RenderQueueType.Transparent]: [],
        };
        const lightActors: Light[] = [];

        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(this.#buildRenderMeshInfo(actor as Mesh));
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    (actor as Mesh).materials.forEach((material, i) => {
                        if (!!material.alphaTest) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(this.#buildRenderMeshInfo(actor as Mesh, i));
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                renderMeshInfoEachQueue[RenderQueueType.Opaque].push(this.#buildRenderMeshInfo(actor as Mesh, i));
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                renderMeshInfoEachQueue[RenderQueueType.Transparent].push(this.#buildRenderMeshInfo(actor as Mesh, i));
                                return;
                            default:
                                throw "[Renderer.render] invalid blend type";
                        }
                    });
                    break;

                case ActorTypes.Light:
                    lightActors.push(actor as Light);
                    break;
            }
        });

        // TODO: depth sort 

        // sort by render queue
        const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) => a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;
        // default
        // const sortedRenderMeshInfos = Object.keys(renderMeshInfoEachQueue).map(key => (renderMeshInfoEachQueue[key].sort(sortRenderQueueCompareFunc))).flat().filter(actor => actor.enabled);

        // ts
        const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
            // .map(key => renderMeshInfoEachQueue[key].sort(sortRenderQueueCompareFunc)) // default
            .map(key => {
                const renderQueueType = key as RenderQueueType;
                const info = renderMeshInfoEachQueue[renderQueueType];
                return info.sort(sortRenderQueueCompareFunc);
            })
            .flat()
            .filter(({actor}) => actor.enabled);

        // ------------------------------------------------------------------------------
        // 1. shadow pass
        // ------------------------------------------------------------------------------

        const castShadowLightActors = lightActors.filter(lightActor => lightActor.castShadow && lightActor.enabled);

        if (castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedRenderMeshInfos.filter(({actor}) => {
                if (actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            if (useShadowPass) {
                this.#shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
            }
        }

        // ------------------------------------------------------------------------------
        // 2. scene pass
        // ------------------------------------------------------------------------------

        // postprocessはrendererから外した方がよさそう  
        // if (camera.enabledPostProcess) {
        //     this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : camera.postProcess.renderTarget.write);
        // } else {
        //     this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : null);
        // }
        this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : null);

        this.#scenePass(sortedRenderMeshInfos, camera, lightActors, clearScene);

        // if (camera.enabledPostProcess) {
        //     camera.postProcess.render({
        //         gpu: this.gpu,
        //         renderer: this,
        //         camera
        //     });
        // }
    }

    renderMesh(geometry: Geometry, material: Material) {
        geometry.update();

        if (this.#stats) {
            this.#stats.addDrawVertexCount(geometry);
            this.#stats.incrementDrawCall();
        }

        // vertex
        this.gpu.setVertexArrayObject(geometry.vertexArrayObject);
        // material
        if(!material.shader)
        {
            throw "invalid material shader";
        }
        this.gpu.setShader(material.shader);
        // uniforms
        this.gpu.setUniforms(material.uniforms);

        // setup depth write (depth mask)
        let depthWrite;
        if (material.depthWrite !== null) {
            depthWrite = material.depthWrite;
        } else {
            switch (material.blendType) {
                case BlendTypes.Opaque:
                    depthWrite = true;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    depthWrite = false;
                    break;
                default:
                    throw "invalid depth write";
            }
        }

        // setup depth test
        const depthTest = !!material.depthTest;

        // draw
        this.gpu.draw(
            geometry.drawCount,
            material.primitiveType,
            depthTest,
            depthWrite,
            material.blendType,
            material.faceSide,
            geometry.instanceCount
        );
    }
}
