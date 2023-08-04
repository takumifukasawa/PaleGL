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

    setSize(width: number, height: number) {
        this.#postProcessCamera.setSize(width, height);
        // this.renderTarget.setSize(width, height);
        this.passes.forEach((pass) => pass.setSize(width, height));
    }

    addPass(pass: IPostProcessPass) {
        this.passes.push(pass);
    }

    /**
     *
     * @param pass
     * @param renderer
     * @param targetCamera
     * @param time
     */
    static updatePassMaterial({
        pass,
        renderer,
        targetCamera,
        time,
    }: {
        pass: IPostProcessPass;
        renderer: Renderer;
        targetCamera: Camera;
        time: number;
    }) {
        pass.materials.forEach((passMaterial) => {
            passMaterial.updateUniform(UniformNames.CameraNear, targetCamera.near);
            passMaterial.updateUniform(UniformNames.CameraFar, targetCamera.far);
            passMaterial.updateUniform(UniformNames.Time, time);
            passMaterial.updateUniform(UniformNames.ViewPosition, targetCamera.transform.position);
            passMaterial.updateUniform(UniformNames.ProjectionMatrix, targetCamera.projectionMatrix);
            passMaterial.updateUniform(
                UniformNames.InverseViewProjectionMatrix,
                targetCamera.inverseViewProjectionMatrix
            );
            passMaterial.updateUniform(UniformNames.InverseProjectionMatrix, targetCamera.inverseProjectionMatrix);
            passMaterial.updateUniform(UniformNames.ViewMatrix, targetCamera.viewMatrix);
            passMaterial.updateUniform(
                UniformNames.TransposeInverseViewMatrix,
                targetCamera.viewMatrix.clone().invert().transpose()
            );
            passMaterial.updateUniform(UniformNames.GBufferATexture, renderer.gBufferRenderTargets.gBufferATexture);
            passMaterial.updateUniform(UniformNames.GBufferBTexture, renderer.gBufferRenderTargets.gBufferBTexture);
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
    }: PostProcessPassRenderArgs & { pass: IPostProcessPass; camera: Camera; isLastPass: boolean }) {
        PostProcess.updatePassMaterial({ pass, renderer, targetCamera, time });
        pass.render({
            gpu,
            renderer,
            camera,
            prevRenderTarget,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    }

    render({
        gpu,
        renderer,
        prevRenderTarget,
        gBufferRenderTargets,
        targetCamera,
        time,
        isCameraLastPass,
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
            });

            prevRenderTarget = pass.renderTarget;
        });
    }
}
