import {
    ActorTypes,
    BlendTypes,
    LightTypes,
    RenderQueueType,
    RenderTargetTypes,
    UniformNames,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Stats } from '@/PaleGL/utilities/Stats';
import { Light } from '@/PaleGL/actors/Light';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { Scene } from '@/PaleGL/core/Scene';
import { Camera, CameraRenderTargetType } from '@/PaleGL/actors/Camera';
import { Material } from '@/PaleGL/materials/Material';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
// import {PostProcessPassBase} from "@/PaleGL/postprocess/PostProcessPassBase";
// import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
// import {Skybox} from "@/PaleGL/actors/Skybox";
// import {GBufferRenderTargets} from "@/PaleGL/core/GBufferRenderTargets";
// import {RenderTarget} from "@/PaleGL/core/RenderTarget";
// import deferredShadingFragmentShader from '@/PaleGL/shaders/deferred-shading-fragment.glsl';
// import { Vector3 } from '@/PaleGL/math/Vector3';
// import { Color } from '@/PaleGL/math/Color';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { DeferredShadingPass } from '@/PaleGL/postprocess/DeferredShadingPass';
// import { CubeMap } from '@/PaleGL/core/CubeMap';
import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
import { ToneMappingPass } from '@/PaleGL/postprocess/ToneMappingPass';
import { BloomPass } from '@/PaleGL/postprocess/BloomPass';
import { DepthOfFieldPass } from '@/PaleGL/postprocess/DepthOfFieldPass';
import { LightShaftPass } from '@/PaleGL/postprocess/LightShaftPass.ts';
import { FogPass } from '@/PaleGL/postprocess/FogPass.ts';

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType };

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
 * TODO:
 * - offscreen rendering
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
    constructor({ gpu, canvas, pixelRatio = 1.5 }: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
        this.gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
        this._scenePostProcess = new PostProcess(this.screenQuadCamera);
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
        // this._ambientOcclusionRenderTarget = new RenderTarget({
        //     gpu,
        //     type: RenderTargetTypes.RGBA,
        //     width: 1,
        //     height: 1,
        //     name: 'ambient occlusion render target',
        // });
        // console.log(this._gBufferRenderTarget)
        this._afterDeferredShadingRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'after g-buffer render target',
        });
        // console.log(this._afterDeferredShadingRenderTarget)
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

        this._ambientOcclusionPass = new SSAOPass({ gpu });
        this._deferredShadingPass = new DeferredShadingPass({ gpu });
        this._ssrPass = new SSRPass({ gpu });
        this._lightShaftPass = new LightShaftPass({ gpu });
        this._fogPass = new FogPass({ gpu });

        this._depthOfFieldPass = new DepthOfFieldPass({ gpu });
        this._depthOfFieldPass.enabled = false;
        this._scenePostProcess.addPass(this._depthOfFieldPass);

        this._bloomPass = new BloomPass({
            gpu,
        });
        // this._bloomPass.enabled = false;
        this._scenePostProcess.addPass(this._bloomPass);

        this._toneMappingPass = new ToneMappingPass({ gpu });
        this._scenePostProcess.addPass(this._toneMappingPass);
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

    // get scenePostProcess() {
    //     return this._scenePostProcess;
    // }

    // get ambientOcclusionRenderTarget() {
    //     // return this._ambientOcclusionRenderTarget;
    //     return this._ambientOcclusionPass.renderTarget;
    // }

    // get deferredShadingPass() {
    //     return this._deferredShadingPass;
    // }

    get ambientOcclusionPass() {
        return this._ambientOcclusionPass;
    }

    get ssrPass() {
        return this._ssrPass;
    }

    get deferredShadingPass() {
        return this._deferredShadingPass;
    }

    get lightShaftPass() {
        return this._lightShaftPass;
    }

    get fogPass() {
        return this._fogPass;
    }

    get depthOfFieldPass() {
        return this._depthOfFieldPass;
    }

    get bloomPass() {
        return this._bloomPass;
    }

    // get toneMappingRenderTarget() {
    //     return this._toneMappingPass.renderTarget;
    // }

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
        this.realWidth = realWidth;
        this.realHeight = realHeight;
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHeight;

        this.gpu.setSize(0, 0, this.realWidth, this.realHeight);

        // render targets
        this._depthPrePassRenderTarget.setSize(realWidth, realHeight);
        this._gBufferRenderTargets.setSize(realWidth, realHeight);
        this._afterDeferredShadingRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthSourceRenderTarget.setSize(realWidth, realHeight);
        this._copyDepthDestRenderTarget.setSize(realWidth, realHeight);
        // passes
        this._ambientOcclusionPass.setSize(realWidth, realHeight);
        this._deferredShadingPass.setSize(realWidth, realHeight);
        this._ssrPass.setSize(realWidth, realHeight);
        this._lightShaftPass.setSize(realWidth, realHeight);
        this._fogPass.setSize(realWidth, realHeight);
        this._depthOfFieldPass.setSize(realWidth, realHeight);
        this._bloomPass.setSize(realWidth, realHeight);
        this._toneMappingPass.setSize(realWidth, realHeight);
    }

    /**
     *
     * @param renderTarget
     * @param clearColor
     * @param clearDepth
     */
    // TODO: 本当はclearcolorの色も渡せるとよい
    setRenderTarget(renderTarget: CameraRenderTargetType, clearColor: boolean = false, clearDepth: boolean = false) {
        if (renderTarget) {
            this.gpu.setFramebuffer(renderTarget.framebuffer);
            this.gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.gpu.setFramebuffer(null);
            this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
        }
        if (clearColor) {
            this.gpu.clearColor(0, 0, 0, 0);
        }
        if (clearDepth) {
            this.gpu.clearDepth(1, 1, 1, 1);
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
    clearColor(r: number, g: number, b: number, a: number) {
        this.gpu.clearColor(r, g, b, a);
    }

    clearDepth(r: number, g: number, b: number, a: number) {
        this.gpu.clearDepth(r, g, b, a);
    }

    /**
     *
     * @param scene
     * @param camera
     * @param time
     * @param deltaTime
     * @param onBeforePostProcess
     */
    // render(scene: Scene, camera: Camera, {useShadowPass = true, clearScene = true}) {
    render(
        scene: Scene,
        camera: Camera,
        {
            time,
            onBeforePostProcess,
        }: {
            time: number;
            deltaTime?: number;
            onBeforePostProcess?: () => void;
        }
    ) {
        // ------------------------------------------------------------------------------
        // transform feedback
        // ------------------------------------------------------------------------------

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
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
                        this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox)
                    );
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
            .filter(({ actor }) => actor.enabled);

        // skybox
        const sortedSkyboxRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return renderMeshInfo.queue === RenderQueueType.Skybox;
        });

        // base pass mesh infos
        const sortedBasePassRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return (
                renderMeshInfo.queue === RenderQueueType.Skybox ||
                renderMeshInfo.queue === RenderQueueType.Opaque ||
                renderMeshInfo.queue === RenderQueueType.AlphaTest
            );
        });

        // transparent mesh infos
        const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(
            (renderMeshInfo) => renderMeshInfo.queue === RenderQueueType.Transparent
        );

        // ------------------------------------------------------------------------------
        // depth pre-pass
        // ------------------------------------------------------------------------------

        const depthPrePassRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
            if (actor.type === ActorTypes.Skybox) {
                return false;
            }
            return actor;
        });
        this.depthPrePass(depthPrePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // g-buffer opaque pass
        // ------------------------------------------------------------------------------

        this.copyDepthTexture();

        this.scenePass(sortedBasePassRenderMeshInfos, camera, lightActors);

        // ------------------------------------------------------------------------------
        // shadow pass
        // ------------------------------------------------------------------------------

        const castShadowLightActors = lightActors.filter((lightActor) => lightActor.castShadow && lightActor.enabled);

        if (castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
                if (actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            this.shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
        }

        // ------------------------------------------------------------------------------
        // ambient occlusion pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ambientOcclusionPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // return;

        // ------------------------------------------------------------------------------
        // deferred lighting pass
        // ------------------------------------------------------------------------------

        // update cubemap to deferred lighting pass
        // TODO: skyboxは一個だけ想定のいいはず
        sortedSkyboxRenderMeshInfos.forEach((skyboxRenderMeshInfo) => {
            const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
            // const cubeMap: CubeMap = skyboxActor.cubeMap;
            // this._deferredShadingPass.material.updateUniform('uEnvMap', cubeMap);
            this._deferredShadingPass.updateSkyboxUniforms(skyboxActor);
        });

        // update lights to deferred lighting pass
        // TODO: ここでライティングのパスが必要
        // TODO: - light actor の中で lightの種類別に処理を分ける
        // TODO: - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
        lightActors.forEach((light) => {
            const targetMaterial = this._deferredShadingPass.material;
            light.applyUniformsValues(targetMaterial);
        });

        // set ao texture
        this._deferredShadingPass.material.uniforms.setValue(
            'uAmbientOcclusionTexture',
            this._ambientOcclusionPass.renderTarget.read.texture
        );

        PostProcess.renderPass({
            pass: this._deferredShadingPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            lightActors,
        });
        // console.log(this._deferredShadingPass.material.getUniform(UniformNames.InverseProjectionMatrix))

        // ------------------------------------------------------------------------------
        // ssr pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ssrPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: this._deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // light shaft pass
        // ------------------------------------------------------------------------------

        // PostProcess.updatePassMaterial({
        //     pass: this._lightShaftPass,
        //     renderer: this,
        //     targetCamera: this._scenePostProcess.postProcessCamera,
        //     time,
        //     lightActors,
        // });

        // this._lightShaftPass.materials.forEach((mat) => {
        //     mat.updateUniform(
        //         UniformNames.DepthTexture,
        //         this._depthPrePassRenderTarget.depthTexture
        //         // this._copyDepthDestRenderTarget.depthTexture
        //     );
        // });

        // TODO: directional light がない場合の対応
        const directionalLight = lightActors.find((light) => light.lightType === LightTypes.Directional) || null;
        if (directionalLight) {
            this._lightShaftPass.setDirectionalLight(directionalLight);
            PostProcess.renderPass({
                pass: this._lightShaftPass,
                renderer: this,
                targetCamera: camera,
                gpu: this.gpu,
                camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
                // lightActors,
            });
        }

        // ------------------------------------------------------------------------------
        // height fog pass
        // ------------------------------------------------------------------------------

        // PostProcess.updatePassMaterial({
        //     pass: this._fogPass,
        //     renderer: this,
        //     targetCamera: this._scenePostProcess.postProcessCamera,
        //     time,
        //     lightActors,
        // });

        this._fogPass.setLightShaftMap(this._lightShaftPass.renderTarget);

        PostProcess.renderPass({
            pass: this._fogPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            // prevRenderTarget: this._deferredShadingPass.renderTarget,
            prevRenderTarget: this._ssrPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // transparent pass
        // ------------------------------------------------------------------------------

        // TODO: 直前のパスを明示的に指定する必要があるのはめんどうなのでうまいこと管理したい
        // this._afterDeferredShadingRenderTarget.setTexture(this._deferredShadingPass.renderTarget.texture!);
        // this._afterDeferredShadingRenderTarget.setTexture(this._gBufferRenderTargets.baseColorTexture);
        // this._afterDeferredShadingRenderTarget.setTexture(this._lightShaftPass.renderTarget.texture!);
        this._afterDeferredShadingRenderTarget.setTexture(this._fogPass.renderTarget.read.texture!);

        // pattern1: g-buffer depth
        // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture);
        // pattern2: depth prepass
        this._afterDeferredShadingRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.copyDepthTexture();
        // this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);
        // RenderTarget.blitDepth({
        //     gpu: this.gpu,
        //     sourceRenderTarget: this._copyDepthSourceRenderTarget,
        //     destRenderTarget: this._copyDepthDestRenderTarget,
        //     width: this.realWidth,
        //     height: this.realHeight,
        // });

        // TODO: set depth to transparent meshes
        sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
            renderMeshInfo.actor.material.uniforms.setValue(
                UniformNames.DepthTexture,
                this._copyDepthDestRenderTarget.depthTexture
            );
        });

        // TODO: colorだけクリアするべきのはず？
        this.setRenderTarget(this._afterDeferredShadingRenderTarget.write);

        // this.transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors, false);
        this.transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors);

        // ------------------------------------------------------------------------------
        // full screen pass
        // TODO: mainCameraかつcameraにpostProcessがあるときの対応
        // ------------------------------------------------------------------------------

        if (onBeforePostProcess) {
            onBeforePostProcess();
        }

        if (!this._scenePostProcess.hasEnabledPass) {
            // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
            throw 'invalid postprocess';
        }

        // console.log("--------- postprocess pass ---------");

        let prevRenderTarget: RenderTarget = this._afterDeferredShadingRenderTarget;
        const isCameraLastPassAndHasNotPostProcess = !camera.renderTarget && !camera.hasEnabledPostProcessPass;
        this._scenePostProcess.render({
            gpu: this.gpu,
            renderer: this,
            prevRenderTarget,
            gBufferRenderTargets: this._gBufferRenderTargets,
            targetCamera: camera,
            time, // TODO: engineから渡したい
            isCameraLastPass: isCameraLastPassAndHasNotPostProcess,
            // lightActors,
        });

        if (isCameraLastPassAndHasNotPostProcess) {
            return;
        }

        prevRenderTarget = this._scenePostProcess.lastRenderTarget!;

        if (camera.hasEnabledPostProcessPass) {
            camera.postProcess!.render({
                gpu: this.gpu,
                renderer: this,
                prevRenderTarget,
                // tone mapping 挟む場合
                // prevRenderTarget: this._toneMappingPass.renderTarget,
                gBufferRenderTargets: this._gBufferRenderTargets,
                targetCamera: camera,
                time, // TODO: engineから渡したい
                isCameraLastPass: !camera.renderTarget,
                lightActors,
            });
        }
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

        // depth func type
        const depthFuncType = material.depthFuncType;

        // draw
        this.gpu.draw(
            geometry.drawCount,
            material.primitiveType,
            depthTest,
            depthWrite,
            depthFuncType,
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
    // internal cmmera
    private screenQuadCamera: Camera = OrthographicCamera.CreateFullQuadOrthographicCamera();
    // render targets
    private _depthPrePassRenderTarget: RenderTarget;
    private _gBufferRenderTargets: GBufferRenderTargets;
    // private _ambientOcclusionRenderTarget: RenderTarget;
    private _afterDeferredShadingRenderTarget: RenderTarget;
    private _copyDepthSourceRenderTarget: RenderTarget;
    private _copyDepthDestRenderTarget: RenderTarget;
    // pass
    private _ambientOcclusionPass: SSAOPass;
    private _deferredShadingPass: DeferredShadingPass;
    private _ssrPass: SSRPass;
    private _lightShaftPass: LightShaftPass;
    private _fogPass: FogPass;
    private _depthOfFieldPass: DepthOfFieldPass;
    private _bloomPass: BloomPass;
    private _toneMappingPass: ToneMappingPass;

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
        // console.log("--------- depth pre pass ---------");

        this.setRenderTarget(this._depthPrePassRenderTarget, false, true);
        this.gpu.clearDepth(0, 0, 0, 1);

        depthPrePassRenderMeshInfos.forEach(({ actor }) => {
            const depthMaterial = actor.depthMaterial;

            if (!depthMaterial) {
                throw '[Renderer.depthPrePass] invalid depth material';
            }

            if (actor.mainMaterial.skipDepthPrePass) {
                return;
            }

            // console.log(depthMaterial.name, depthMaterial.depthTest, depthMaterial.depthWrite, depthMaterial.depthFuncType)

            depthMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
            depthMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            depthMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);
            depthMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            depthMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);

            this.renderMesh(actor.geometry, depthMaterial);

            if (this.stats) {
                this.stats.addPassInfo('depth pre pass', actor.name, actor.geometry);
            }
        });
    }

    private copyDepthTexture() {
        this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);
        RenderTarget.blitDepth({
            gpu: this.gpu,
            sourceRenderTarget: this._copyDepthSourceRenderTarget,
            destRenderTarget: this._copyDepthDestRenderTarget,
            width: this.realWidth,
            height: this.realHeight,
        });
    }

    /**
     *
     * @param castShadowLightActors
     * @param castShadowRenderMeshInfos
     * @private
     */
    private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        // console.log("--------- shadow pass ---------");

        castShadowLightActors.forEach((lightActor) => {
            if (!lightActor.shadowMap) {
                throw 'invalid shadow pass';
                // return;
            }
            if (!lightActor.shadowCamera) {
                throw 'invalid shadow camera';
                // return;
            }
            this.setRenderTarget(lightActor.shadowMap.write, false, true);
            // this.clear(0, 0, 0, 1);
            // this.gpu.clearDepth(0, 0, 0, 1);

            if (castShadowRenderMeshInfos.length < 1) {
                return;
            }

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                const targetMaterial = actor.depthMaterial;

                // TODO: material 側でやった方がよい？
                if (!targetMaterial) {
                    throw 'invalid target material';
                }

                // 先頭でガードしてるので shadow camera はあるはず。
                targetMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
                targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
                targetMaterial.uniforms.setValue(
                    UniformNames.ViewPosition,
                    lightActor.shadowCamera!.transform.worldMatrix.position
                );
                targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, lightActor.shadowCamera!.viewMatrix);
                targetMaterial.uniforms.setValue(
                    UniformNames.ProjectionMatrix,
                    lightActor.shadowCamera!.projectionMatrix
                );
                this.renderMesh(actor.geometry, targetMaterial);

                if (this.stats) {
                    this.stats.addPassInfo('shadow pass', actor.name, actor.geometry);
                }
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
    private scenePass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: Light[]
        // clear: boolean = true
    ) {
        // console.log("--------- scene pass ---------");

        // NOTE: DepthTextureはあるはず
        this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.setRenderTarget(this._gBufferRenderTargets.write, true);
        // this.clearDepth(0, 0, 0, 1);
        // this.clearColor(0, 0, 0, 1);

        // TODO: depth prepass しない場合は必要
        // if (clear) {
        //     this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }
        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    // TODO: engineでやるべき
                    actor.updateTransform(camera);
                    break;
            }

            const targetMaterial = actor.materials[materialIndex];

            // TODO: material 側でやった方がよい？
            targetMaterial.uniforms.setValue(UniformNames.InverseWorldMatrix, actor.transform.inverseWorldMatrix);
            targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            targetMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            targetMaterial.uniforms.setValue(
                UniformNames.NormalMatrix,
                actor.transform.worldMatrix.clone().invert().transpose()
            );
            targetMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            targetMaterial.uniforms.setValue(UniformNames.DepthTexture, this._copyDepthDestRenderTarget.depthTexture!);
            targetMaterial.uniforms.setValue(UniformNames.CameraNear, camera.near);
            targetMaterial.uniforms.setValue(UniformNames.CameraFar, camera.far);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            lightActors.forEach((light) => {
                light.applyUniformsValues(targetMaterial);
            });

            this.renderMesh(actor.geometry, targetMaterial);

            if (this.stats) {
                this.stats.addPassInfo('scene pass', actor.name, actor.geometry);
            }
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
    private transparentPass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: Light[]
        // clear: boolean
    ) {
        // console.log("--------- transparent pass ---------");

        // TODO: 常にclearしない、で良い気がする
        // if (clear) {
        //     // this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        //     this.gpu.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            const targetMaterial = actor.materials[materialIndex];

            targetMaterial.uniforms.setValue(UniformNames.WorldMatrix, actor.transform.worldMatrix);
            targetMaterial.uniforms.setValue(UniformNames.ViewMatrix, camera.viewMatrix);
            targetMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, camera.projectionMatrix);
            targetMaterial.uniforms.setValue(
                UniformNames.NormalMatrix,
                actor.transform.worldMatrix.clone().invert().transpose()
            );
            targetMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // - opaqueと共通処理なのでまとめたい
            lightActors.forEach((light) => {
                light.applyUniformsValues(targetMaterial);
            });

            this.renderMesh(actor.geometry, targetMaterial);

            if (this.stats) {
                this.stats.addPassInfo('transparent pass', actor.name, actor.geometry);
            }
        });
    }
}
