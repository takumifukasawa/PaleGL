import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Camera } from '@/PaleGL/actors/Camera';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { GPU } from '@/PaleGL/core/GPU';
import { Renderer } from '@/PaleGL/core/Renderer';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets.ts';
// import {PostProcessUniformNames} from "@/PaleGL/constants.ts";
// import {Matrix4} from "@/PaleGL/math/Matrix4.ts";

// TODO: actorを継承してもいいかもしれない
export class PostProcess {
    passes: IPostProcessPass[] = [];
    // renderTarget;
    #camera: Camera;

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

    set enabled(value) {
        this.#selfEnabled = value;
    }

    // constructor({gpu}: {gpu: GPU}) {
    constructor() {
        // // TODO: renderTargetがいらない時もあるので出し分けたい
        // this.renderTarget = new RenderTarget({
        //     gpu,
        //     name: "PostProcess RenderTarget",
        //     type: RenderTargetTypes.RGBA,
        //     writeDepthTexture: true, // TODO: 必要ないかもしれないので出し分けたい
        //     width: 1, height: 1,
        // });

        this.#camera = new OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this.#camera.transform.setTranslation(new Vector3(0, 0, 1));
    }

    setSize(width: number, height: number) {
        this.#camera.setSize(width, height);
        // this.renderTarget.setSize(width, height);
        this.passes.forEach((pass) => pass.setSize(width, height));
    }

    addPass(pass: IPostProcessPass) {
        this.passes.push(pass);
    }

    render({
        gpu,
        renderer,
        sceneRenderTarget,
        gBufferRenderTargets,
        sceneCamera,
        time,
    }: {
        gpu: GPU;
        renderer: Renderer;
        sceneRenderTarget: RenderTarget | null;
        gBufferRenderTargets?: GBufferRenderTargets | null;
        sceneCamera: Camera;
        time: number;
    }) {
        if (!sceneRenderTarget) {
            throw '[PostProcess.render] scene render target is empty.';
        }

        this.#camera.updateTransform();
        // TODO: render target を外から渡したほうが分かりやすいかも
        // let prevRenderTarget = sceneRenderTarget || this.renderTarget;
        let prevRenderTarget = sceneRenderTarget;
        if (!prevRenderTarget) {
            console.error('[PostProcess.render] scene render target is empty.');
        }

        const enabledPasses = this.passes.filter((pass) => pass.enabled);
        enabledPasses.forEach((pass, i) => {
            const isLastPass = i === enabledPasses.length - 1;

            // pass.materials.forEach((passMaterial) => {
            //     // TODO: postprocess側でセットした方が効率がよいが...
            //     // TODO: 今、passごとにセットすればいい値も入ってしまっている
            //     passMaterial.updateUniform('uTime', time);
            //     passMaterial.updateUniform(PostProcessUniformNames.CameraNear, sceneCamera.near);
            //     passMaterial.updateUniform(PostProcessUniformNames.CameraFar, sceneCamera.far);
            //     passMaterial.updateUniform('uProjectionMatrix', sceneCamera.projectionMatrix);
            //     const inverseViewProjectionMatrix = Matrix4.multiplyMatrices(
            //         sceneCamera.projectionMatrix,
            //         sceneCamera.viewMatrix
            //     ).invert();
            //     passMaterial.updateUniform('uInverseViewProjectionMatrix', inverseViewProjectionMatrix);
            //     const inverseProjectionMatrix = sceneCamera.projectionMatrix.clone().invert();
            //     passMaterial.updateUniform('uInverseProjectionMatrix', inverseProjectionMatrix);
            //     passMaterial.updateUniform('uViewMatrix', sceneCamera.viewMatrix);
            //     passMaterial.updateUniform('uTransposeInverseViewMatrix', sceneCamera.viewMatrix.clone().invert().transpose());
            //     if (gBufferRenderTargets) {
            //         passMaterial.updateUniform('uBaseColorTexture', gBufferRenderTargets.baseColorTexture);
            //         passMaterial.updateUniform('uNormalTexture', gBufferRenderTargets.normalTexture);
            //         passMaterial.updateUniform('uDepthTexture', gBufferRenderTargets.depthTexture);
            //     }
            // });

            pass.render({
                gpu,
                renderer,
                camera: this.#camera,
                prevRenderTarget,
                isLastPass,
                sceneCamera,
                gBufferRenderTargets,
                time,
            });

            prevRenderTarget = pass.renderTarget;
        });
    }
}
