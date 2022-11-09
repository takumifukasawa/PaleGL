import {ActorTypes, BlendTypes, UniformTypes} from "./../constants.js";
import {Vector3} from "../math/Vector3.js";
import {Matrix4} from "../math/Matrix4.js";
import {Material} from "../materials/Material.js";

export class ForwardRenderer {
    #gpu;
    canvas;
    pixelRatio;
    #realWidth;
    #realHeight;
    #shadowMaterial;

    constructor({gpu, canvas, pixelRatio = 1}) {
        this.#gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
        
        this.#shadowMaterial = new Material({
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
            fragmentShader: `#version 300 es
            precision mediump float;
            out vec4 outColor;
            void main() {
                outColor = vec4(1., 1., 1., 1.);
            }
            `
        })
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
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.framebuffer.glObject);
            gl.viewport(0, 0, renderTarget.width, renderTarget.height);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.#realWidth, this.#realHeight);
        }
    }

    flush() {
        this.#gpu.flush();
    }

    clear(r, g, b, a) {
        this.#gpu.clear(r, g, b, a);
    }

    render(scene, camera) {
       
        const meshActorsEachQueue = {
            skybox: [], // maybe only one
            opaque: [],
            transparent: [],
        };
        const lightActors = [];

        scene.traverse((actor) => {
            switch(actor.type) {
                case ActorTypes.Skybox:
                    meshActorsEachQueue.skybox.push(actor);
                    // actor.transform.parent = camera.transform;
                    break;
                case ActorTypes.Mesh:
                    switch (actor.material.blendType) {
                        case BlendTypes.Opaque:
                            meshActorsEachQueue.opaque.push(actor);
                            break;
                        case BlendTypes.Transparent:
                        case BlendTypes.Additive:
                            meshActorsEachQueue.transparent.push(actor);
                            break;
                        default:
                            throw "invalid blend type";
                    }
                    break;
                case ActorTypes.Light:
                    lightActors.push(actor);
                    break;
            }
        });

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        scene.traverse((actor) => actor.update({ gpu: this.#gpu }));

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        scene.traverse((actor) => actor.updateTransform());

        scene.traverse((actor) => actor.afterUpdatedTransform());
        
        // TODO: depth sort 

        // sort by render queue
        const sortRenderQueueCompareFunc = (a, b) => a.material.renderQueue - b.material.renderQueue;
        const sortedMeshActors = Object.keys(meshActorsEachQueue).map(key => (meshActorsEachQueue[key].sort(sortRenderQueueCompareFunc))).flat();
        
        // ------------------------------------------------------------------------------
        // shadow pass
        // ------------------------------------------------------------------------------

        lightActors.forEach(lightActor => {
            if(!lightActor.castShadow) {
                return;
            }
            this.setRenderTarget(lightActor.shadowMap.write());
            // console.log(lightActor.shadowMap.write())
            this.clear(0, 0, 0, 1);
            
            meshActorsEachQueue.opaque.forEach(meshActor => {
                // skybox は shadowmapに描画しない
                switch(meshActor.type) {
                    case ActorTypes.Skybox:
                        return;
                        break;
                }
                
                // const material = meshActor.material;
                const targetMaterial = this.#shadowMaterial;
               
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
               
                this.renderMesh(meshActor.geometry, this.#shadowMaterial);
                // this.renderMesh(meshActor.geometry, meshActor.material);
            });
            if(lightActor.shadowMap.isSwappable) lightActor.shadowMap.swap();
        });

        // ------------------------------------------------------------------------------
        // scene pass
        // ------------------------------------------------------------------------------
     
        if (camera.enabledPostProcess) {
            this.setRenderTarget(camera.postProcess.renderTarget.write());
        } else {
            this.setRenderTarget(camera.renderTarget ? camera.renderTarget.write() : null);
        }

        // TODO: refactor
        this.clear(
            camera.clearColor.x,
            camera.clearColor.y,
            camera.clearColor.z,
            camera.clearColor.w
        );
        
        sortedMeshActors.forEach(meshActor => {
            switch(meshActor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    meshActor.updateTransform(camera);
                    break;
            }
            
            const targetMaterial = meshActor.material;
            
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
            if(targetMaterial.uniforms.uViewPosition) {
                targetMaterial.uniforms.uViewPosition.value = camera.transform.worldMatrix.position;
            }

            // TODO: light actor の中で lightの種類別に処理を分ける
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
                
                if(targetMaterial.uniforms.uTextureProjectionMatrix && light.shadowCamera) {
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
                     
                    targetMaterial.uniforms.uTextureProjectionMatrix.value = textureProjectionMatrix;
                }
            });

            this.renderMesh(meshActor.geometry, meshActor.material);
        });

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
        if (geometry.indexBufferObject) {
            this.#gpu.setIndexBufferObject(geometry.indexBufferObject);
        }
        // material
        this.#gpu.setShader(material.shader);
        // uniforms
        this.#gpu.setUniforms(material.uniforms);
      
        // setup depth write (depth mask)
        let depthWrite;
        if(material.depthWrite !== null) {
            depthWrite = material.depthWrite;
        } else {
            switch(material.blendType) {
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