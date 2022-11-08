
import {RenderTarget} from "./RenderTarget.js";
import {RenderTargetTypes} from "../constants.js";
import {AbstractRenderTarget} from "./AbstractRenderTarget.js";

export class DoubleBuffer extends  AbstractRenderTarget {
    #renderTargets = [];
    
    currentReadIndex = 0;
    
    constructor(renderTargetOptions) {
        super({ isSwappable: true });
        for(let i = 0; i < 2; i++) {
            this.#renderTargets.push(new RenderTarget(renderTargetOptions));
        }
    }
    
    setSize(width, height) {
        this.#renderTargets.forEach(renderTarget => renderTarget.setSize(width, height));
    }

    read() {
        return this.#renderTargets[this.currentReadIndex];
    }
    
    write() {
        return this.#renderTargets[this.currentReadIndex ^ 1];
    }

    swap() {
        this.currentReadIndex = (this.currentReadIndex + 1) % 2;
    }
}