import {
    createRenderTarget,
    createRenderTargetBase,
    RenderTarget,
    RenderTargetBase,
    RenderTargetOptions, setRenderTargetSize,
} from '@/PaleGL/core/renderTarget.ts';
import { RenderTargetKinds } from '@/PaleGL/constants.ts';

export type DoubleBuffer = RenderTargetBase & {
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
