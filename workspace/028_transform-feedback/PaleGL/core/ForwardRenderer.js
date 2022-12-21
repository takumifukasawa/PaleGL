import {ActorTypes, BlendTypes, RenderQueues, UniformTypes} from "./../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {Material} from "../materials/Material.js";
import {generateDepthVertexShader} from "../shaders/generateVertexShader.js";
import {generateDepthFragmentShader} from "../shaders/generateFragmentShader.js";

export class ForwardRenderer {
    #gpu;
    canvas;
    pixelRatio;
    #realWidth;
    #realHeight;
    
    // #depthMaterial;
    // #depthMaterialAlphaTestQueue;

    constructor({gpu, canvas, pixelRatio = 1.5}) {
        this.#gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;

        // this.#depthMaterial = new Material({
        //     gpu,
        //     vertexShader: `#version 300 es
        //     layout (location = 0) in vec3 aPosition;
        //     uniform mat4 uWorldMatrix;
        //     uniform mat4 uViewMatrix;
        //     uniform mat4 uProjectionMatrix;
        //     void main() {
        //         gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
        //     }
        //     `,
        //     fragmentShader: generateDepthFragmentShader({ alphaTest: false })
        // });
        // this.#depthMaterial.start({ gpu })
        // this.#depthMaterialAlphaTestQueue = new Material({
        //     gpu,
        //     vertexShader: `#version 300 es
        //     layout (location = 0) in vec3 aPosition;
        //     uniform mat4 uWorldMatrix;
        //     uniform mat4 uViewMatrix;
        //     uniform mat4 uProjectionMatrix;
        //     void main() {
        //         gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
        //     }
        //     `,
        //     fragmentShader: generateDepthFragmentShader({ alphaTest: true })
        // });
        // console.log(generateDepthFragmentShader({ alphaTest: true }))
    }

    setSize(width, height, realWidth, realHeight) {
        this.#realWidth = realWidth;
        this.#realHeight = realHeight;
        // this.#realWidth = Math.floor(width * this.pixelRatio);
        // this.#realHeight = Math.floor(height * this.pixelRatio);
        this.canvas.width = this.#realWidth;
        this.canvas.height = this.#realHeight;
        // this.canvas.style.width = `${width}px`;
        // this.canvas.style.height = `${height}px`;
        this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight);
    }

    setRenderTarget(renderTarget) {
        const gl = this.#gpu.gl;

        if (renderTarget) {
            this.#gpu.setFramebuffer(renderTarget.framebuffer)
            this.#gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.#gpu.setFramebuffer(null)
            this.#gpu.setSize(0, 0, this.#realWidth, this.#realHeight);
        }
    }

    flush() {
        this.#gpu.flush();
    }

    clear(r, g, b, a) {
        this.#gpu.clear(r, g, b, a);
    }

    #shadowPass(castShadowLightActors, castShadowRenderMeshInfos) {
        castShadowLightActors.forEach(lightActor => {
            this.setRenderTarget(lightActor.shadowMap.write);
            this.clear(0, 0, 0, 1);

            if(castShadowRenderMeshInfos.length < 1) {
                return;
            }

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                const targetMaterial = actor.depthMaterial;
                
                // TODO: material 側でやった方がよい？
                if (targetMaterial.uniforms.uWorldMatrix) {
                    targetMaterial.uniforms.uWorldMatrix.value = actor.transform.worldMatrix;
                }
                if (targetMaterial.uniforms.uViewMatrix) {
                    targetMaterial.uniforms.uViewMatrix.value = lightActor.shadowCamera.viewMatrix;
                }
                if (targetMaterial.uniforms.uProjectionMatrix) {
                    targetMaterial.uniforms.uProjectionMatrix.value = lightActor.shadowCamera.projectionMatrix;
                }
              
                this.renderMesh(actor.geometry, targetMaterial);
            });
        });
    }
    
   #buildRenderMeshInfo(actor, materialIndex = 0) {
        return {
            actor,
            materialIndex
        }
    }

    #scenePass(sortedRenderMeshInfos, camera, lightActors) {

        // TODO: refactor
        this.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            // reset
            // NOTE: 余計なresetとかしない方がいい気がする
            // if(targetMaterial.uniforms.uShadowMap) {
            //     targetMaterial.uniforms.uShadowMap.value = null;
            // }

            // TODO: material 側でやった方がよい？
            if (targetMaterial.uniforms.uWorldMatrix) {
                targetMaterial.uniforms.uWorldMatrix.value = actor.transform.worldMatrix;
            }
            if (targetMaterial.uniforms.uViewMatrix) {
                targetMaterial.uniforms.uViewMatrix.value = camera.viewMatrix;
            }
            if (targetMaterial.uniforms.uProjectionMatrix) {
                targetMaterial.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
            }
            if (targetMaterial.uniforms.uNormalMatrix) {
                targetMaterial.uniforms.uNormalMatrix.value = actor.transform.worldMatrix.clone().invert().transpose();
            }
            if (targetMaterial.uniforms.uViewPosition) {
                targetMaterial.uniforms.uViewPosition.value = camera.transform.worldMatrix.position;
            }

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意 
            lightActors.forEach(light => {
                if (targetMaterial.uniforms.uDirectionalLight) {
                    targetMaterial.uniforms.uDirectionalLight = {
                        type: UniformTypes.Struct,
                        value: {
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
                        }
                    }
                }

                if (
                    targetMaterial.uniforms.uShadowMapProjectionMatrix &&
                    targetMaterial.receiveShadow &&
                    light.castShadow
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

                    // TODO:
                    // - directional light の構造体に持たせた方がいいかもしれない
                    if(targetMaterial.uniforms.uShadowMap) {
                        targetMaterial.uniforms.uShadowMap.value = light.shadowMap.read.texture;
                    }
                    if(targetMaterial.uniforms.uShadowMapProjectionMatrix) {
                        targetMaterial.uniforms.uShadowMapProjectionMatrix.value = textureProjectionMatrix;
                    }
                }
            });

            this.renderMesh(actor.geometry, targetMaterial);
        });
    }
    
    render(scene, camera) {
        const renderMeshInfoEachQueue = {
            opaque: [],
            skybox: [], // maybe only one
            alphaTest: [],
            transparent: [],
        };
        const lightActors = [];
        
       
        // TODO: 複数material対応
        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // renderMeshInfoEachQueue.skybox.push(actor);
                    renderMeshInfoEachQueue.skybox.push(this.#buildRenderMeshInfo(actor));
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.materials.forEach((material, i) => {
                        if(!!material.alphaTest) {
                            // renderMeshInfoEachQueue.alphaTest.push(actor);
                            renderMeshInfoEachQueue.alphaTest.push(this.#buildRenderMeshInfo(actor, i));
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                // renderMeshInfoEachQueue.opaque.push(actor);
                                renderMeshInfoEachQueue.opaque.push(this.#buildRenderMeshInfo(actor, i));
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                // renderMeshInfoEachQueue.transparent.push(actor);
                                renderMeshInfoEachQueue.transparent.push(this.#buildRenderMeshInfo(actor, i));
                                return;
                            default:
                                throw "invalid blend type";
                        }
                    });
                    break;

                case ActorTypes.Light:
                    lightActors.push(actor);
                    break;
            }
        });

        // TODO: depth sort 

        // sort by render queue
        const sortRenderQueueCompareFunc = (a, b) => a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;
        const sortedRenderMeshInfos = Object.keys(renderMeshInfoEachQueue).map(key => (renderMeshInfoEachQueue[key].sort(sortRenderQueueCompareFunc))).flat();
        
        // ------------------------------------------------------------------------------
        // 1. shadow pass
        // ------------------------------------------------------------------------------
      
        const castShadowLightActors = lightActors.filter(lightActor => lightActor.castShadow);
        
        if(castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedRenderMeshInfos.filter(({ actor }) => {
                if(actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            // if(castShadowRenderMeshInfos.length > 0) {
            //     this.#shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
            // }
            this.#shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
        }

        // ------------------------------------------------------------------------------
        // 2. scene pass
        // ------------------------------------------------------------------------------
       
        if (camera.enabledPostProcess) {
            this.setRenderTarget(camera.postProcess.renderTarget.write);
        } else {
            this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : null);
        }
       
        this.#scenePass(sortedRenderMeshInfos, camera, lightActors);

        if (camera.enabledPostProcess) {
            camera.postProcess.render({
                gpu: this.#gpu,
                renderer: this,
                camera
            });
        }

        // NOTE: ない方がよい？
        // this.setRenderTarget(null);
    }

    renderMesh(geometry, material) {
        geometry.update();

        // vertex
        this.#gpu.setVertexArrayObject(geometry.vertexArrayObject);
        // this.#gpu.setIndexBufferObject(geometry.indexBufferObject);
        // material
        this.#gpu.setShader(material.shader);
        // uniforms
        this.#gpu.setUniforms(material.uniforms);

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
        const depthTest = material.depthTest;
       
        // draw
        this.#gpu.draw(
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