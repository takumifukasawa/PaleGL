import {
    createDoubleBuffer,
    DoubleBuffer,
    getWriteRenderTargetOfDoubleBuffer,
    swapDoubleBuffer,
} from '@/PaleGL/core/doubleBuffer.ts';
import { createMaterial, Material } from '@/PaleGL/materials/material.ts';
import vertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { blitRenderTarget, Renderer } from '@/PaleGL/core/renderer.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { UniformBlockName, UniformBlockNames } from '@/PaleGL/constants.ts';

export type GraphicsDoubleBuffer = {
    doubleBuffer: DoubleBuffer;
    geometry: Geometry;
    material: Material;
};

export const createGraphicsDoubleBuffer: (
    gpu: Gpu,
    fragmentShader: string,
    uniforms: UniformsData,
    uniformBlockNames: UniformBlockName[]
) => GraphicsDoubleBuffer = (
    // prettier-ignore
    gpu,
    fragmentShader,
    uniforms = [],
    uniformBlockNames = []
) => {
    const geometry = createPlaneGeometry({ gpu });
    const material = createMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        uniformBlockNames: [...uniformBlockNames, UniformBlockNames.Common],
    });
    const doubleBuffer = createDoubleBuffer({ gpu });
    return {
        doubleBuffer,
        geometry,
        material,
    };
};

export const updateGraphicsDoubleBuffer = (renderer: Renderer, graphicsDoubleBuffer: GraphicsDoubleBuffer) => {
    const { doubleBuffer, geometry, material } = graphicsDoubleBuffer;
    blitRenderTarget(renderer, getWriteRenderTargetOfDoubleBuffer(doubleBuffer), geometry, material);
    // render target に焼く
    // swap して焼いたものを read にする
    swapDoubleBuffer(doubleBuffer);
};
