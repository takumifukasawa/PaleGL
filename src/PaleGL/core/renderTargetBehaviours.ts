import { RenderTargetBase, setRenderTargetSize } from '@/PaleGL/core/renderTarget.ts';
import { RenderTargetKind, RENDER_TARGET_KIND_DEFAULT, RENDER_TARGET_KIND_G_BUFFER } from '@/PaleGL/constants.ts';
import { setGBufferRenderTargetsSize } from '@/PaleGL/core/gBufferRenderTargets.ts';

export type SetRenderTargetSizeFunc = (renderTargetBase: RenderTargetBase, width: number, height: number) => void;

const setRenderTargetSizeFunc: Partial<Record<RenderTargetKind, SetRenderTargetSizeFunc>> = {
    [RENDER_TARGET_KIND_DEFAULT]: setRenderTargetSize,
    [RENDER_TARGET_KIND_G_BUFFER]: setGBufferRenderTargetsSize,
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
