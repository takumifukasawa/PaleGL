import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
// import {Vector3} from '@/PaleGL/math/Vector3';
import { Camera } from '@/PaleGL/actors/Camera';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { GPU } from '@/PaleGL/core/GPU';
import { Renderer } from '@/PaleGL/core/Renderer';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { PostProcessPassRenderArgs } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { Light } from '@/PaleGL/actors/Light.ts';
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
    lightActors?: Light[];
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
     * @param pass
     * @param renderer
     * @param targetCamera
     * @param time
     * @param lightActors
     */
    // TODO: ここでuniform更新するの分かりづらい気がするがどう？一つにまとめた方がよい？
    static updatePassMaterial({
        pass,
        renderer,
        targetCamera,
        time,
        lightActors,
    }: {
        pass: IPostProcessPass;
        renderer: Renderer;
        targetCamera: Camera;
        time: number;
        lightActors?: Light[];
    }) {
        pass.materials.forEach((passMaterial) => {
            //
            // light
            //
            if (lightActors) {
                // TODO: light情報はまとめてから渡したい
                lightActors.forEach((light) => {
                    light.updateUniform(passMaterial);
                });
            }

            //
            // basic
            //

            passMaterial.updateUniform(UniformNames.CameraNear, targetCamera.near);
            passMaterial.updateUniform(UniformNames.CameraFar, targetCamera.far);
            passMaterial.updateUniform(UniformNames.Time, time);
            passMaterial.updateUniform(UniformNames.ViewPosition, targetCamera.transform.position);
            passMaterial.updateUniform(UniformNames.ProjectionMatrix, targetCamera.projectionMatrix);
            passMaterial.updateUniform(UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
            passMaterial.updateUniform(
                UniformNames.InverseViewProjectionMatrix,
                targetCamera.inverseViewProjectionMatrix
            );
            passMaterial.updateUniform(UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
            passMaterial.updateUniform(UniformNames.InverseProjectionMatrix, targetCamera.inverseProjectionMatrix);
            passMaterial.updateUniform(UniformNames.ViewMatrix, targetCamera.viewMatrix);
            passMaterial.updateUniform(
                UniformNames.TransposeInverseViewMatrix,
                targetCamera.viewMatrix.clone().invert().transpose()
            );
            // g-buffers
            passMaterial.updateUniform(UniformNames.GBufferATexture, renderer.gBufferRenderTargets.gBufferATexture);
            passMaterial.updateUniform(UniformNames.GBufferBTexture, renderer.gBufferRenderTargets.gBufferBTexture);
            passMaterial.updateUniform(UniformNames.GBufferCTexture, renderer.gBufferRenderTargets.gBufferCTexture);
            // passMaterial.updateUniform(UniformNames.DepthTexture, renderer.gBufferRenderTargets.depthTexture);
            passMaterial.updateUniform(UniformNames.DepthTexture, renderer.depthPrePassRenderTarget.depthTexture);
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
            time,
            lightActors
        });
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
