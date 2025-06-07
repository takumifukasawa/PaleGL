import {
    createRenderTarget,
    createRenderTargetBase,
    RenderTarget,
    RenderTargetBase,
    RenderTargetOptions, setRenderTargetSize,
} from '@/PaleGL/core/renderTarget.ts';
import { RenderTargetKinds } from '@/PaleGL/constants.ts';
import {
    createMultipleRenderTargets,
    MultipleRenderTarget,
    MultipleRenderTargetOptions
} from "@/PaleGL/core/multipleRenderTargets.ts";

export type DoubleBufferBase = {
    currentReadIndex: number;
}

export type DoubleBuffer = DoubleBufferBase & RenderTargetBase & {
    renderTargets: RenderTarget[];
};

export type MRTDoubleBuffer = DoubleBufferBase & RenderTargetBase & {
    multipleRenderTargets: MultipleRenderTarget[];
}

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

export function createMRTDoubleBuffer(renderTargetOptions: MultipleRenderTargetOptions): MRTDoubleBuffer {
    const multipleRenderTargets: MultipleRenderTarget[] = [];

    for (let i = 0; i < 2; i++) {
        const options: MultipleRenderTargetOptions = { ...renderTargetOptions, ...{ name: `mrt-double-buffer_${i}` } };
        multipleRenderTargets.push(createMultipleRenderTargets(options));
    }

    return {
        ...createRenderTargetBase(RenderTargetKinds.MRT, true),
        currentReadIndex: 0,
        multipleRenderTargets,
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
