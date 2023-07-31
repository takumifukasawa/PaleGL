import {
    ActorTypes,
    BlendTypes,
    RenderQueueType,
    RenderTargetTypes,
    UniformNames,
    UniformTypes
} from '@/PaleGL/constants';
import {Matrix4} from '@/PaleGL/math/Matrix4';
import {GPU} from '@/PaleGL/core/GPU';
import {Stats} from '@/PaleGL/utilities/Stats';
import {Light} from '@/PaleGL/actors/Light';
import {Mesh} from '@/PaleGL/actors/Mesh';
import {Scene} from '@/PaleGL/core/Scene';
import {Camera, CameraRenderTargetType} from '@/PaleGL/actors/Camera';
import {Material} from '@/PaleGL/materials/Material';
import {Geometry} from '@/PaleGL/geometries/Geometry';
import {PostProcess} from "@/PaleGL/postprocess/PostProcess.ts";
import {RenderTarget} from "@/PaleGL/core/RenderTarget.ts";
import {GBufferRenderTargets} from "@/PaleGL/core/GBufferRenderTargets.ts";
import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase.ts";
// import {Skybox} from "@/PaleGL/actors/Skybox.ts";
// import {GBufferRenderTargets} from "@/PaleGL/core/GBufferRenderTargets.ts";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget.ts";

type RenderMeshInfo = { actor: Mesh; materialIndex: number, queue: RenderQueueType };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[];
};

/**
 * 描画パイプライン的な役割
 * TODO: pass
 * - depth pre-pass
 * - g-buffer pass (color, normal, material info)
 * - ao pass
 * - shading pass
 * - post process pass
 * TODO:
 * - depth prepass 使わない場合。offscreen する時とか
 */
export class Renderer {
    // --------------------------------------------------------------
    // constructor
    // --------------------------------------------------------------

    /**
     *
     * @param gpu
     * @param canvas
     * @param pixelRatio
     */
    constructor({gpu, canvas, pixelRatio = 1.5}: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
        this.gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
        this._scenePostProcess = new PostProcess();
        this._depthPrePassRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'depth prepass render target',
        });
        this._gBufferRenderTargets = new GBufferRenderTargets({
            gpu,
            width: 1,
            height: 1,
            name: 'g-buffer render target',
        });
        // console.log(this._gBufferRenderTarget)
        this._afterGBufferRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'after g-buffer render target',
        });
        // console.log(this._afterGBufferRenderTarget)
        this._copyDepthSourceRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'copy depth source render target',
        });
        // console.log(this._copyDepthSourceRenderTarget)
        this._copyDepthDestRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'copy depth dest render target',
        });
        // console.log(this._copyDepthDestRenderTarget)
        this._deferredLightingPass = new PostProcessPassBase({
            gpu,
            fragmentShader: `#version 300 es
void main() {
    gl_FragColor = vec4(1., 0., 0., 1.);
}
`
        });
    }

    // --------------------------------------------------------------
    // public
    // --------------------------------------------------------------

    canvas;
    pixelRatio;

    get depthPrePassRenderTarget() {
        return this._depthPrePassRenderTarget;
    }
    
    get gBufferRenderTargets() {
        return this._gBufferRenderTargets;
    }

    get scenePostProcess() {
        return this._scenePostProcess;
    }

    /**
     *
     * @param stats
     */
    setStats(stats: Stats) {
        this.stats = stats;
    }

    /**
     *
     * @param realWidth
     * @param realHeight
     */
    setSize(realWidth: number, realHeight: number) {
        // setSize(width: number, height: number, realWidth: number, realHeight: number) {
        this.realWidth = realWidth;
        this.realHeight = realHeight;
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHeight;

        this.gpu.setSize(0, 0, this.realWidth, this.realHeight);

        this._depthPrePassRenderTarget.setSize(realWidth, realHeight);
        this._gBufferRenderTargets.setSize(realWidth, realHeight);
        this._afterGBufferRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthSourceRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthDestRenderTarget.setSize(realWidth, realHeight);
        this._deferredLightingPass.setSize(realWidth, realHeight);
    }

    /**
     *
     * @param renderTarget
     */
    setRenderTarget(renderTarget: CameraRenderTargetType) {
        if (renderTarget) {
            this.gpu.setFramebuffer(renderTarget.framebuffer);
            this.gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.gpu.setFramebuffer(null);
            this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
        }
    }

    /**
     *
     */
    flush() {
        this.gpu.flush();
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    // TODO: pass Color
    clear(r: number, g: number, b: number, a: number) {
        this.gpu.clear(r, g, b, a);
    }

    /**
     *
     * @param scene
     * @param camera
     * @param useShadowPass
     * @param clearScene
     */
    // render(scene: Scene, camera: Camera, {useShadowPass = true, clearScene = true}) {
    render(scene: Scene, camera: Camera, onBeforePostProcess?: () => void) {
        // ------------------------------------------------------------------------------
        // setup render mesh infos
        // TODO: depth sort
        // ------------------------------------------------------------------------------

        const renderMeshInfoEachQueue: RenderMeshInfoEachQueue = {
            [RenderQueueType.Skybox]: [],
            [RenderQueueType.Opaque]: [],
            [RenderQueueType.AlphaTest]: [],
            [RenderQueueType.Transparent]: [],
        };
        const lightActors: Light[] = [];

        // build render mesh info each queue
        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox));
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    (actor as Mesh).materials.forEach((material, i) => {
                        if (material.alphaTest) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
                                this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.AlphaTest, i)
                            );
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                renderMeshInfoEachQueue[RenderQueueType.Opaque].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Opaque, i)
                                );
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                renderMeshInfoEachQueue[RenderQueueType.Transparent].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Transparent, i)
                                );
                                return;
                            default:
                                throw '[Renderer.render] invalid blend type';
                        }
                    });
                    break;

                case ActorTypes.Light:
                    lightActors.push(actor as Light);
                    break;
            }
        });

        // sort by render queue
        const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) =>
            a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;

        // all mesh infos
        const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
            .map((key) => {
                const renderQueueType = key as RenderQueueType;
                const info = renderMeshInfoEachQueue[renderQueueType];
                return info.sort(sortRenderQueueCompareFunc);
            })
            .flat()
            .filter(({actor}) => actor.enabled);

        // base pass mesh infos
        const sortedBasePassRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(renderMeshInfo => {
            return renderMeshInfo.queue === RenderQueueType.Skybox ||
                renderMeshInfo.queue === RenderQueueType.Opaque ||
                renderMeshInfo.queue === RenderQueueType.AlphaTest
        });

        // transparent mesh infos
        const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(renderMeshInfo => renderMeshInfo.queue === RenderQueueType.Transparent);

        // ------------------------------------------------------------------------------
        // depth pre-pass
        // ------------------------------------------------------------------------------

        const depthPrePassRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({actor}) => {
            if (actor.type === ActorTypes.Skybox) {
                return false;
            }
            return actor;
        });
        this.depthPrePass(depthPrePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // shadow pass
        // ------------------------------------------------------------------------------

        const castShadowLightActors = lightActors.filter((lightActor) => lightActor.castShadow && lightActor.enabled);

        if (castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({actor}) => {
                if (actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            this.shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
        }

        // ------------------------------------------------------------------------------
        // g-buffer opaque pass
        // ------------------------------------------------------------------------------

        // TODO: camera...はなくていいかも
        // camera.setRenderTarget(this._gBufferRenderTargets);
        // this.setRenderTarget(this._gBufferRenderTargets.write);

        this.scenePass(sortedBasePassRenderMeshInfos, camera, lightActors, true);

        // ------------------------------------------------------------------------------
        // deferred lighting pass
        // ------------------------------------------------------------------------------

        // TODO: ここでライティングのパスが必要

        this._deferredLightingPass.render({
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            targetCamera: camera,
            renderer: this,
            prevRenderTarget:  null,
            isLastPass: false,
            time: performance.now()
        });

        // ------------------------------------------------------------------------------
        // transparent pass
        // ------------------------------------------------------------------------------

        this._afterGBufferRenderTarget.setTexture(this._gBufferRenderTargets.baseColorTexture);
        // this._afterGBufferRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture);
        this._afterGBufferRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        // // TODO: copy depth texture
        // this._copyDepthSourceRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture);
        this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);
        RenderTarget.blitDepth({
            gpu: this.gpu,
            sourceRenderTarget: this._copyDepthSourceRenderTarget,
            destRenderTarget: this._copyDepthDestRenderTarget,
            width: this.realWidth,
            height: this.realHeight,
        });
        // TODO: set depth to transparent meshes
        sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
            renderMeshInfo.actor.material.updateUniform(UniformNames.DepthTexture, this._copyDepthDestRenderTarget.depthTexture);
        });

        // return;

        // TODO: camera...はなくていいかも
        // camera.setRenderTarget(this._afterGBufferRenderTarget);
        this.setRenderTarget(this._afterGBufferRenderTarget.write);

        this.transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors, false);

        // ------------------------------------------------------------------------------
        // full screen pass
        // TODO: mainCameraかつcameraにpostProcessがあるときの対応
        // ------------------------------------------------------------------------------

        if (onBeforePostProcess) {
            onBeforePostProcess();
        }

        const targetPostProcesses: PostProcess[] = [];
        if (camera.mainCamera) {
            targetPostProcesses.push(this._scenePostProcess);
        }
        if (camera.postProcess) {
            targetPostProcesses.push(camera.postProcess);
        }

        targetPostProcesses.forEach((postProcess, i) => {
            postProcess.render({
                gpu: this.gpu,
                renderer: this,
                sceneRenderTarget: this._afterGBufferRenderTarget,
                gBufferRenderTargets: this._gBufferRenderTargets,
                targetCamera: camera,
                time: performance.now() / 1000, // TODO: engineから渡したい
                isCameraLastPass: i === targetPostProcesses.length - 1
            });
        });
    }

    /**
     *
     * @param geometry
     * @param material
     */
    renderMesh(geometry: Geometry, material: Material) {
        geometry.update();

        if (this.stats) {
            this.stats.addDrawVertexCount(geometry);
            this.stats.incrementDrawCall();
        }

        // vertex
        this.gpu.setVertexArrayObject(geometry.vertexArrayObject);
        // material
        if (!material.shader) {
            throw 'invalid material shader';
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
                    throw 'invalid depth write';
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

    // --------------------------------------------------------------
    // private 
    // --------------------------------------------------------------

    private gpu;
    private realWidth: number = 1;
    private realHeight: number = 1;
    private stats: Stats | null = null;
    private _scenePostProcess: PostProcess;
    private _depthPrePassRenderTarget: RenderTarget;
    private _gBufferRenderTargets: GBufferRenderTargets;
    private _afterGBufferRenderTarget: RenderTarget;
    private _copyDepthSourceRenderTarget: RenderTarget;
    private _copyDepthDestRenderTarget: RenderTarget;
    private _deferredLightingPass: PostProcessPassBase;

    /**
     *
     * @param actor
     * @param materialIndex
     * @private
     */
    private buildRenderMeshInfo(actor: Mesh, queue: RenderQueueType, materialIndex: number = 0): RenderMeshInfo {
        return {
            actor,
            queue,
            materialIndex,
        };
    }

    /**
     *
     * @param depthPrePassRenderMeshInfos
     * @param camera
     * @private
     */
    private depthPrePass(depthPrePassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
        this.setRenderTarget(this._depthPrePassRenderTarget);

        // depthなのでclear
        this.clear(0, 0, 0, 1);

        depthPrePassRenderMeshInfos.forEach(({actor}) => {
            const depthMaterial = actor.depthMaterial;

            if (!depthMaterial) {
                throw '[Renderer.depthPrePass] invalid depth material';
            }

            depthMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            depthMaterial.updateUniform(UniformNames.ViewMatrix, camera.viewMatrix);
            depthMaterial.updateUniform(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            this.renderMesh(actor.geometry, depthMaterial);
        });
    }

    /**
     *
     * @param castShadowLightActors
     * @param castShadowRenderMeshInfos
     * @private
     */
    private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        castShadowLightActors.forEach((lightActor) => {
            if (!lightActor.shadowMap) {
                throw 'invalid shadow pass';
                // return;
            }
            if (!lightActor.shadowCamera) {
                throw 'invalid shadow camera';
                // return;
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
                    throw 'invalid target material';
                }

                // 先頭でガードしてるので shadow camera はあるはず。
                targetMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
                targetMaterial.updateUniform(UniformNames.ViewMatrix, lightActor.shadowCamera!.viewMatrix);
                targetMaterial.updateUniform(UniformNames.ProjectionMatrix, lightActor.shadowCamera!.projectionMatrix);
                this.renderMesh(actor.geometry, targetMaterial);
            });
        });
    }

    /**
     *
     * @param sortedRenderMeshInfos
     * @param camera
     * @param lightActors
     * @param clear
     * @private
     */
    private scenePass(sortedRenderMeshInfos: RenderMeshInfo[], camera: Camera, lightActors: Light[], clear: boolean = true) {
        // NOTE: DepthTextureはあるはず
        this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.setRenderTarget(this._gBufferRenderTargets.write);

        // TODO: refactor
        if (clear) {
            this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        }

        sortedRenderMeshInfos.forEach(({actor, materialIndex}) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    // TODO: engineでやるべき
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            // TODO: material 側でやった方がよい？
            targetMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            targetMaterial.updateUniform(UniformNames.ViewMatrix, camera.viewMatrix);
            targetMaterial.updateUniform(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            targetMaterial.updateUniform(
                UniformNames.NormalMatrix,
                actor.transform.worldMatrix.clone().invert().transpose()
            );
            targetMaterial.updateUniform(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            lightActors.forEach((light) => {
                if (targetMaterial.uniforms[UniformNames.DirectionalLight]) {
                    targetMaterial.updateUniform(UniformNames.DirectionalLight, {
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
                            value: light.color,
                        },
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
                    const textureMatrix = new Matrix4(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
                    const textureProjectionMatrix = Matrix4.multiplyMatrices(
                        textureMatrix,
                        light.shadowCamera.projectionMatrix.clone(),
                        light.shadowCamera.viewMatrix.clone()
                    );
                    targetMaterial.updateUniform(UniformNames.ShadowMap, light.shadowMap.read.depthTexture);
                    targetMaterial.updateUniform(UniformNames.ShadowMapProjectionMatrix, textureProjectionMatrix);
                }
            });

            this.renderMesh(actor.geometry, targetMaterial);
        });
    }


    /**
     *
     * @param sortedRenderMeshInfos
     * @param camera
     * @param lightActors
     * @param clear
     * @private
     */
    private transparentPass(sortedRenderMeshInfos: RenderMeshInfo[], camera: Camera, lightActors: Light[], clear: boolean) {
        // TODO: refactor
        if (clear) {
            this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        }

        sortedRenderMeshInfos.forEach(({actor, materialIndex}) => {
            const targetMaterial = actor.materials[materialIndex];

            targetMaterial.updateUniform(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            targetMaterial.updateUniform(UniformNames.ViewMatrix, camera.viewMatrix);
            targetMaterial.updateUniform(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            targetMaterial.updateUniform(
                UniformNames.NormalMatrix,
                actor.transform.worldMatrix.clone().invert().transpose()
            );
            targetMaterial.updateUniform(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // - opaqueと共通処理なのでまとめたい
            lightActors.forEach((light) => {
                if (targetMaterial.uniforms[UniformNames.DirectionalLight]) {
                    targetMaterial.updateUniform(UniformNames.DirectionalLight, {
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
                            value: light.color,
                        },
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
                    const textureMatrix = new Matrix4(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
                    const textureProjectionMatrix = Matrix4.multiplyMatrices(
                        textureMatrix,
                        light.shadowCamera.projectionMatrix.clone(),
                        light.shadowCamera.viewMatrix.clone()
                    );

                    targetMaterial.updateUniform(UniformNames.ShadowMap, light.shadowMap.read.depthTexture);
                    targetMaterial.updateUniform(UniformNames.ShadowMapProjectionMatrix, textureProjectionMatrix);
                }
            });

            this.renderMesh(actor.geometry, targetMaterial);
        });
    }
}
