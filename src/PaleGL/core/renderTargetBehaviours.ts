import { RenderTargetBase, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { RenderTargetKind, RenderTargetKinds } from '@/PaleGL/constants.ts';
import { setGBufferRenderTargetsSize } from '@/PaleGL/core/gBufferRenderTargets.ts';

export type SetRenderTargetSizeFunc = (renderTargetBase: RenderTargetBase, width: number, height: number) => void;

const setRenderTargetSizeFunc: Partial<Record<RenderTargetKind, SetRenderTargetSizeFunc>> = {
    [RenderTargetKinds.Default]: setRenderTargetSize,
    [RenderTargetKinds.GBuffer]: setGBufferRenderTargetsSize,
};

export function setRenderTargetSizeBehaviour(renderTargetBase: RenderTargetBase, width: number, height: number) {
    setRenderTargetSizeFunc[renderTargetBase.renderTargetKind]?.(renderTargetBase, width, height);
}

// TODO: fixme
export function getWriteRenderTarget(renderTarget: RenderTargetBase) {
    console.error('getWriteRenderTarget is deprecated');
    // return renderTarget.write;
    // return renderTarget as RenderTargetBase;
    return renderTarget;
}
