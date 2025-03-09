// import { RenderTarget, RenderTargetOptions } from '@/PaleGL/core/RenderTarget';
// // import {RenderTargetTypes} from "@/PaleGL/constants";
// import { AbstractRenderTarget } from '@/PaleGL/core/AbstractRenderTarget';
// 
// export class DoubleBuffer extends AbstractRenderTarget {
//     #renderTargets: RenderTarget[] = [];
// 
//     currentReadIndex = 0;
// 
//     constructor(renderTargetOptions: RenderTargetOptions) {
//         super({ isSwappable: true });
//         for (let i = 0; i < 2; i++) {
//             const options: RenderTargetOptions = { ...renderTargetOptions, ...{ name: `double-buffer_${i}` } };
//             this.#renderTargets.push(new RenderTarget(options));
//         }
//     }
// 
//     setSize(width: number, height: number) {
//         this.#renderTargets.forEach((renderTarget) => renderTarget.setSize(width, height));
//     }
// 
//     get read() {
//         return this.#renderTargets[this.currentReadIndex];
//     }
// 
//     get write() {
//         return this.#renderTargets[this.currentReadIndex ^ 1];
//     }
// 
//     swap() {
//         this.currentReadIndex = (this.currentReadIndex + 1) % 2;
//     }
// }

import {
    createRenderTarget,
    createRenderTargetBase,
    RenderTarget,
    RenderTargetBase,
    RenderTargetOptions, setRenderTargetSize,
} from '@/PaleGL/core/renderTarget.ts';
import { RenderTargetKinds } from '@/PaleGL/constants.ts';

type DoubleBuffer = RenderTargetBase & {
    currentReadIndex: number;
    renderTargets: RenderTarget[];
};

export function createDoubleBuffer(renderTargetOptions: RenderTargetOptions): DoubleBuffer {
    const renderTargets: RenderTarget[] = [];

    for (let i = 0; i < 2; i++) {
        const options: RenderTargetOptions = { ...renderTargetOptions, ...{ name: `double-buffer_${i}` } };
        renderTargets.push(createRenderTarget(options));
    }

    return {
        ...createRenderTargetBase(RenderTargetKinds.DoubleBuffer, true),
        currentReadIndex: 0,
        renderTargets: renderTargets,
    };
}

export function setDoubleBufferSize(doubleBuffer: DoubleBuffer, width: number, height: number) {
    doubleBuffer.renderTargets.forEach((renderTarget) => setRenderTargetSize(renderTarget, width, height));
}

export function getReadRenderTargetOfDoubleBuffer(doubleBuffer: DoubleBuffer) {
    return doubleBuffer.renderTargets[doubleBuffer.currentReadIndex];
}

export function getWriteRenderTargetOfDoubleBuffer(doubleBuffer: DoubleBuffer) {
    return doubleBuffer.renderTargets[doubleBuffer.currentReadIndex ^ 1];
}

export function swapDoubleBuffer(doubleBuffer: DoubleBuffer) {
    doubleBuffer.currentReadIndex = (doubleBuffer.currentReadIndex + 1) % 2;
}
