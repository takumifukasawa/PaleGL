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
    
    #depthMaterial;
    // #depthMaterialAlphaTestQueue;

    constructor({gpu, canvas, pixelRatio = 1}) {
        this.#gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;

        this.#depthMaterial = new Material({
            gpu,
            vertexShader: `#version 300 es
            layout (location = 0) in vec3 aPosition;
            uniform mat4 uWorldMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aPosition, 1.);
            }
            `,
            fragmentShader: generateDepthFragmentShader({ alphaTest: false })
        });
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

    setSize(width, height) {
        this.#realWidth = Math.floor(width * this.pixelRatio);
        this.#realHeight = Math.floor(height * this.pixelRatio);
        this.canvas.width = this.#realWidth;
        this.canvas.height = this.#realHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
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

    #shadowPass(castShadowLightActors, castShadowMeshActors) {
        castShadowLightActors.forEach(lightActor => {
            this.setRenderTarget(lightActor.shadowMap.write);
            this.clear(0, 0, 0, 1);

            castShadowMeshActors.forEach(meshActor => {
                // const targetMaterial = meshActor.depthMaterial || this.#depthMaterial;

                const targetMaterial = meshActor.depthMaterial;
                
                // let targetMaterial = this.#depthMaterial;
                // if(meshActor.depthMaterial) {
                //     targetMaterial = meshActor.depthMaterial;
                // } else {
                //     if(meshActor.material.alphaTest) {
                //         targetMaterial = this.#depthMaterialAlphaTestQueue;
                //     }
                // }

                // TODO: material 側でやった方がよい？
                if (targetMaterial.uniforms.uWorldMatrix) {
                    targetMaterial.uniforms.uWorldMatrix.value = meshActor.transform.worldMatrix;
                }
                if (targetMaterial.uniforms.uViewMatrix) {
                    targetMaterial.uniforms.uViewMatrix.value = lightActor.shadowCamera.viewMatrix;
                }
                if (targetMaterial.uniforms.uProjectionMatrix) {
                    targetMaterial.uniforms.uProjectionMatrix.value = lightActor.shadowCamera.projectionMatrix;
                }
                
                this.renderMesh(meshActor.geometry, targetMaterial);
            });
        });
    }
    
    #scenePass(sortedMeshActors, camera, lightActors) {

        // TODO: refactor
        this.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );

        sortedMeshActors.forEach(meshActor => {
            switch (meshActor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    meshActor.updateTransform(camera);
                    break;
            }

            const targetMaterial = meshActor.material;

            // reset
            // NOTE: 余計なresetとかしない方がいい気がする
            // if(targetMaterial.uniforms.uShadowMap) {
            //     targetMaterial.uniforms.uShadowMap.value = null;
            // }

            // TODO: material 側でやった方がよい？
            if (targetMaterial.uniforms.uWorldMatrix) {
                targetMaterial.uniforms.uWorldMatrix.value = meshActor.transform.worldMatrix;
            }
            if (targetMaterial.uniforms.uViewMatrix) {
                targetMaterial.uniforms.uViewMatrix.value = camera.viewMatrix;
            }
            if (targetMaterial.uniforms.uProjectionMatrix) {
                targetMaterial.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
            }
            if (targetMaterial.uniforms.uNormalMatrix) {
                targetMaterial.uniforms.uNormalMatrix.value = meshActor.transform.worldMatrix.clone().invert().transpose();
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

            this.renderMesh(meshActor.geometry, meshActor.material);
        });
    }

    render(scene, camera) {
        const meshActorsEachQueue = {
            skybox: [], // maybe only one
            opaque: [],
            alphaTest: [],
            transparent: [],
        };
        const lightActors = [];

        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    meshActorsEachQueue.skybox.push(actor);
                    // actor.transform.parent = camera.transform;
                    return;

                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    switch(actor.material.queue) {
                        case RenderQueues.AlphaTest:
                            meshActorsEachQueue.alphaTest.push(actor);
                            return;
                    }
                    switch (actor.material.blendType) {
                        case BlendTypes.Opaque:
                            meshActorsEachQueue.opaque.push(actor);
                            return;
                        case BlendTypes.Transparent:
                        case BlendTypes.Additive:
                            meshActorsEachQueue.transparent.push(actor);
                            return;
                        default:
                            throw "invalid blend type";
                    }
                    break;

                case ActorTypes.Light:
                    lightActors.push(actor);
                    break;
            }
        });

        // TODO: depth sort 

        // sort by render queue
        const sortRenderQueueCompareFunc = (a, b) => a.material.renderQueue - b.material.renderQueue;
        const sortedMeshActors = Object.keys(meshActorsEachQueue).map(key => (meshActorsEachQueue[key].sort(sortRenderQueueCompareFunc))).flat();
        
        // ------------------------------------------------------------------------------
        // 1. shadow pass
        // ------------------------------------------------------------------------------
      
        const castShadowLightActors = lightActors.filter(lightActor => lightActor.castShadow);
        
        if(castShadowLightActors.length > 0) {
            const castShadowMeshActors = sortedMeshActors.filter(meshActor => {
                if(meshActor.type === ActorTypes.Skybox) {
                    return false;
                }
                return meshActor.castShadow;
            });
            if(castShadowMeshActors.length > 0) {
                this.#shadowPass(castShadowLightActors, castShadowMeshActors);
            }
        }

        // ------------------------------------------------------------------------------
        // 2. scene pass
        // ------------------------------------------------------------------------------
        
        if (camera.enabledPostProcess) {
            this.setRenderTarget(camera.postProcess.renderTarget.write);
        } else {
            this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write : null);
        }
       
        this.#scenePass(sortedMeshActors, camera, lightActors);

        if (camera.enabledPostProcess) {
            camera.postProcess.render(this, camera);
        }

        // NOTE: ない方がよい？
        // this.setRenderTarget(null);
    }

    renderMesh(geometry, material) {
        geometry.update();

        // vertex
        this.#gpu.setVertexArrayObject(geometry.vertexArrayObject);
        this.#gpu.setIndexBufferObject(geometry.indexBufferObject);
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
        );
    }
}