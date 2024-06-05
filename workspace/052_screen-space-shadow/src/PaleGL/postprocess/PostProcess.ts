import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
// import {Vector3} from '@/PaleGL/math/Vector3';
import { Camera } from '@/PaleGL/actors/Camera';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { GPU } from '@/PaleGL/core/GPU';
import { applyLightShadowMapUniformValues, LightActors, Renderer } from '@/PaleGL/core/Renderer';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
// import { Light } from '@/PaleGL/actors/Light.ts';
// import {Matrix4} from "@/PaleGL/math/Matrix4.ts";
// import {PostProcessUniformNames} from "@/PaleGL/constants.ts";
// import {Matrix4} from "@/PaleGL/math/Matrix4.ts";

type PostProcessRenderArgs = {
    gpu: GPU;
    renderer: Renderer;
    prevRenderTarget: RenderTarget | null;
    gBufferRenderTargets?: GBufferRenderTargets | null;
    targetCamera: Camera;
    time: number;
    isCameraLastPass: boolean;
    lightActors?: LightActors
};

// TODO: actorを継承してもいいかもしれない
export class PostProcess {
    passes: IPostProcessPass[] = [];
    // renderTarget;
    #postProcessCamera: Camera;

    #selfEnabled = true;

    get enabled() {
        if (!this.#selfEnabled) {
            return false;
        }

        for (let i = 0; i < this.passes.length; i++) {
            if (this.passes[i].enabled) {
                return true;
            }
        }

        return false;
    }

    get postProcessCamera() {
        return this.#postProcessCamera;
    }

    set enabled(value) {
        this.#selfEnabled = value;
    }

    get hasEnabledPass() {
        for (let i = 0; i < this.passes.length; i++) {
            if (this.passes[i].enabled) {
                return true;
            }
        }
        return false;
    }

    get lastRenderTarget() {
        let lastPass: IPostProcessPass | null = null;
        for (let i = this.passes.length - 1; i >= 0; i--) {
            if (this.passes[i].enabled) {
                lastPass = this.passes[i];
                break;
            }
        }
        if (lastPass == null) {
            return null;
        }
        return lastPass.renderTarget;
    }

    // constructor({gpu}: {gpu: GPU}) {
    constructor(postProcessCamera?: Camera) {
        // // TODO: renderTargetがいらない時もあるので出し分けたい
        // this.renderTarget = new RenderTarget({
        //     gpu,
        //     name: "PostProcess RenderTarget",
        //     type: RenderTargetTypes.RGBA,
        //     writeDepthTexture: true, // TODO: 必要ないかもしれないので出し分けたい
        //     width: 1, height: 1,
        // });

        if (postProcessCamera) {
            this.#postProcessCamera = postProcessCamera;
        } else {
            this.#postProcessCamera = OrthographicCamera.CreateFullQuadOrthographicCamera();
        }
    }

    /**
     *
     * @param width
     * @param height
     */
    setSize(width: number, height: number) {
        this.#postProcessCamera.setSize(width, height);
        // this.renderTarget.setSize(width, height);
        this.passes.forEach((pass) => pass.setSize(width, height));
    }

    /**
     *
     * @param pass
     */
    addPass(pass: IPostProcessPass) {
        this.passes.push(pass);
    }

    /**
     * 
     */
    update() {
        this.passes.forEach(pass => {
            pass.update();
        });
    }

    /**
     *
     * @param pass
     * @param renderer
     * @param targetCamera
     * @param time
     * @param lightActors
     */
    // TODO: ここでuniform更新するの分かりづらい気がするがどう？一つにまとめた方がよい？
    private static updatePassMaterial({
        pass,
        renderer,
        targetCamera,
        // time,
        lightActors,
    }: {
        pass: IPostProcessPass;
        renderer: Renderer;
        targetCamera: Camera;
        // time: number;
        lightActors?: LightActors;
    }) {
        pass.materials.forEach((passMaterial) => {
            //
            // light
            //
            // if (lightActors) {
            //     // TODO: light情報はまとめてから渡したい
            //     lightActors.forEach((light) => {
            //         light.applyUniformsValues(passMaterial);
            //     });
            // }
            // TODO: 必要なのだけ割り当てたいが・・・
            if (lightActors) {
                applyLightShadowMapUniformValues(passMaterial, lightActors);
            }

            //
            // basic
            //

            // passMaterial.uniforms.setValue(UniformNames.CameraNear, targetCamera.near);
            // passMaterial.uniforms.setValue(UniformNames.CameraFar, targetCamera.far);
            // passMaterial.uniforms.setValue(UniformNames.ViewPosition, targetCamera.transform.position);
            // passMaterial.uniforms.setValue(UniformNames.ViewMatrix, targetCamera.viewMatrix);
            // passMaterial.uniforms.setValue(UniformNames.ProjectionMatrix, targetCamera.projectionMatrix);
            
            passMaterial.uniforms.setValue(UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
            passMaterial.uniforms.setValue(
                UniformNames.InverseViewProjectionMatrix,
                targetCamera.inverseViewProjectionMatrix
            );
            passMaterial.uniforms.setValue(UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
            passMaterial.uniforms.setValue(UniformNames.InverseProjectionMatrix, targetCamera.inverseProjectionMatrix);
            passMaterial.uniforms.setValue(
                UniformNames.TransposeInverseViewMatrix,
                targetCamera.viewMatrix.clone().invert().transpose()
            );
            
            // passMaterial.uniforms.setValue(UniformNames.Time, time);
            
            // g-buffers
            passMaterial.uniforms.setValue(UniformNames.GBufferATexture, renderer.gBufferRenderTargets.gBufferATexture);
            passMaterial.uniforms.setValue(UniformNames.GBufferBTexture, renderer.gBufferRenderTargets.gBufferBTexture);
            passMaterial.uniforms.setValue(UniformNames.GBufferCTexture, renderer.gBufferRenderTargets.gBufferCTexture);
            passMaterial.uniforms.setValue(UniformNames.GBufferDTexture, renderer.gBufferRenderTargets.gBufferDTexture);
            // passMaterial.uniforms.setValue(UniformNames.DepthTexture, renderer.gBufferRenderTargets.depthTexture);
            passMaterial.uniforms.setValue(UniformNames.DepthTexture, renderer.depthPrePassRenderTarget.depthTexture);
        });
    }

    /**
     *
     * @param pass
     * @param gpu
     * @param renderer
     * @param camera
     * @param prevRenderTarget
     * @param targetCamera
     * @param gBufferRenderTargets
     * @param time
     * @param isLastPass
     * @param lightActors
     */
    static renderPass({
        pass,
        gpu,
        renderer,
        camera,
        prevRenderTarget,
        targetCamera,
        gBufferRenderTargets,
        time,
        isLastPass,
        lightActors,
    }: PostProcessPassRenderArgs & { pass: IPostProcessPass; camera: Camera; isLastPass: boolean }) {
        PostProcess.updatePassMaterial({
            pass,
            renderer,
            targetCamera,
            // time,
            lightActors,
        });

        //
        // camera
        //

        renderer.updateCameraUniforms(targetCamera);

        pass.render({
            gpu,
            renderer,
            camera,
            prevRenderTarget,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
            lightActors,
        });
    }

    /**
     *
     * @param gpu
     * @param renderer
     * @param prevRenderTarget
     * @param gBufferRenderTargets
     * @param targetCamera
     * @param time
     * @param isCameraLastPass
     * @param lightActors
     */
    render({
        gpu,
        renderer,
        prevRenderTarget, // TODO: このパラメーターなくしたい
        gBufferRenderTargets,
        targetCamera,
        time,
        isCameraLastPass,
        lightActors,
    }: PostProcessRenderArgs) {
        // if (!sceneRenderTarget) {
        //     throw '[PostProcess.render] scene render target is empty.';
        // }

        this.#postProcessCamera.updateTransform();
        // TODO: render target を外から渡したほうが分かりやすいかも
        // let prevRenderTarget = sceneRenderTarget || this.renderTarget;
        // let prevRenderTarget = sceneRenderTarget;
        if (!prevRenderTarget) {
            console.error('[PostProcess.render] scene render target is empty.');
        }

        // const inverseViewProjectionMatrix = Matrix4.multiplyMatrices(
        //     targetCamera.projectionMatrix,
        //     targetCamera.viewMatrix
        // ).invert();
        // const inverseProjectionMatrix = targetCamera.projectionMatrix.clone().invert();

        // set uniform and render pass
        const enabledPasses = this.passes.filter((pass) => pass.enabled);

        enabledPasses.forEach((pass, i) => {
            const isLastPass = isCameraLastPass && i === enabledPasses.length - 1;

            // this.updatePassMaterial({pass, renderer, targetCamera, time});
            // pass.render({
            //     gpu,
            //     renderer,
            //     camera: this.#postProcessCamera,
            //     prevRenderTarget,
            //     isLastPass,
            //     targetCamera,
            //     gBufferRenderTargets,
            //     time,
            // });

            PostProcess.renderPass({
                pass,
                gpu,
                renderer,
                camera: this.#postProcessCamera,
                prevRenderTarget,
                isLastPass,
                targetCamera,
                gBufferRenderTargets,
                time,
                lightActors,
            });

            prevRenderTarget = pass.renderTarget;
        });
    }
}
