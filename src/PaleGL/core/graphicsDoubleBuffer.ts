import {
    createDoubleBuffer,
    DoubleBuffer, DoubleBufferBase,
    getReadRenderTargetOfDoubleBuffer, getWriteMultipleRenderTargetOfMRTDoubleBuffer,
    getWriteRenderTargetOfDoubleBuffer, MRTDoubleBuffer,
    swapDoubleBuffer,
} from '@/PaleGL/core/doubleBuffer.ts';
import { createMaterial, Material } from '@/PaleGL/materials/material.ts';
import baseVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import { Geometry } from '@/PaleGL/geometries/geometry.ts';
import {blitRenderTarget, Renderer, renderRenderer} from '@/PaleGL/core/renderer.ts';
import { setUniformValue, UniformsData } from '@/PaleGL/core/uniforms.ts';
import { TextureFilterTypes, UniformBlockName, UniformBlockNames, UniformTypes } from '@/PaleGL/constants.ts';
import { RenderTargetOptions } from '@/PaleGL/core/renderTarget.ts';
import { RequiredProperty } from '@/PaleGL/types/type-utilities.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import {Gpu} from "@/PaleGL/core/gpu.ts";

export type GraphicsDoubleBuffer = {
    doubleBuffer: DoubleBufferBase;
    geometry: Geometry;
    material: Material;
};

// export type GraphicsDoubleBufferArgs = RenderTargetOptions & {
//     vertexShader?: string;
//     fragmentShader: string;
//     uniforms?: UniformsData;
//     uniformBlockNames?: UniformBlockName[];
// } & RequiredProperty<RenderTargetOptions, 'width' | 'height'>;

export type GraphicsDoubleBufferArgs = {
    gpu: Gpu,
    vertexShader?: string;
    fragmentShader: string;
    uniforms?: UniformsData;
    uniformBlockNames?: UniformBlockName[];
    doubleBuffer: DoubleBufferBase,
    width: number;
    height: number;
};

const prevMapUniformName = 'uPrevMap';
const targetWidthUniformName = 'uTargetWidth';
const targetHeightUniformName = 'uTargetHeight';
const texelSizeUniformName = 'uTexelSize';

export const createGraphicsDoubleBuffer = (args: GraphicsDoubleBufferArgs): GraphicsDoubleBuffer => {
    const {
        gpu,
        width,
        height,
        vertexShader = baseVertexShader,
        fragmentShader,
        uniforms = [],
        uniformBlockNames = [],
        doubleBuffer,
    } = args;

    const geometry = createPlaneGeometry({ gpu });
    const material = createMaterial({
        vertexShader,
        fragmentShader,
        uniforms: [
            ...uniforms,
            {
                name: prevMapUniformName,
                type: UniformTypes.Texture,
                value: null,
            },
            {
                name: targetWidthUniformName,
                type: UniformTypes.Float,
                value: width,
            },
            {
                name: targetHeightUniformName,
                type: UniformTypes.Float,
                value: height,
            },
            {
                name: texelSizeUniformName,
                type: UniformTypes.Vector2,
                value: createVector2(1 / width, 1 / height),
            },
        ],
        uniformBlockNames: [...uniformBlockNames, UniformBlockNames.Common],
    });
    return {
        doubleBuffer,
        geometry,
        material,
    };
};

export const updateGraphicsDoubleBuffer = (renderer: Renderer, graphicsDoubleBuffer: GraphicsDoubleBuffer) => {
    const { doubleBuffer, geometry, material } = graphicsDoubleBuffer;
    setUniformValue(material.uniforms, prevMapUniformName, getReadRenderTargetOfDoubleBuffer(doubleBuffer as DoubleBuffer).texture);
    blitRenderTarget(renderer, getWriteRenderTargetOfDoubleBuffer(doubleBuffer as DoubleBuffer), geometry, material);
    // render target に焼く
    // swap して焼いたものを read にする
    swapDoubleBuffer(doubleBuffer);
};

export const updateMRTGraphicsDoubleBuffer = (renderer: Renderer, graphicsDoubleBuffer: GraphicsDoubleBuffer) => {
    const {doubleBuffer, geometry, material} = graphicsDoubleBuffer;
    blitRenderTarget(renderer, getWriteMultipleRenderTargetOfMRTDoubleBuffer(doubleBuffer as MRTDoubleBuffer), geometry, material);
    // render target に焼く
    // swap して焼いたものを read にする
    swapDoubleBuffer(doubleBuffer);
}
