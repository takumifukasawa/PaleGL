import {OrthographicCamera} from "./../actors/OrthographicCamera";
import {RenderTarget} from "../core/RenderTarget";
import {Vector3} from "../math/Vector3";
import {RenderTargetTypes} from "../constants";

// TODO: actorを継承してもいいかもしれない
export class PostProcess {
    passes = [];
    // renderTarget;
    #camera;

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

    constructor({gpu}) {
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

    setSize(width, height) {
        this.#camera.setSize(width, height);
        // this.renderTarget.setSize(width, height);
        this.passes.forEach(pass => pass.setSize(width, height));
    }

    addPass(pass) {
        this.passes.push(pass);
    }

    render({gpu, renderer, sceneRenderTarget}) {
        if (!sceneRenderTarget) {
            throw "[PostProcess.render] scene render target is empty."
        }

        this.#camera.updateTransform();
        // TODO: render target を外から渡したほうが分かりやすいかも
        // let prevRenderTarget = sceneRenderTarget || this.renderTarget;
        let prevRenderTarget = sceneRenderTarget;
        if (!prevRenderTarget) {
            console.error("[PostProcess.render] scene render target is empty.");
        }

        const enabledPasses = this.passes.filter(pass => pass.enabled);
        enabledPasses.forEach((pass, i) => {
            const isLastPass = i === enabledPasses.length - 1;

            pass.render({
                gpu,
                renderer,
                camera: this.#camera,
                prevRenderTarget,
                isLastPass,
            });

            prevRenderTarget = pass.renderTarget;
        });
    }
}
