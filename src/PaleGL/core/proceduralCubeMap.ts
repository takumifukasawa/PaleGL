import {
    BLEND_TYPE_OPAQUE,
    DEPTH_FUNC_TYPE_LEQUAL,
    FACE_SIDE_FRONT,
    GL_COLOR_ATTACHMENT0,
    GL_FRAMEBUFFER,
    GL_TEXTURE_CUBE_MAP,
    GL_TEXTURE_CUBE_MAP_POSITIVE_X,
    PRIMITIVE_TYPE_TRIANGLES,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_TYPE_INT,
} from '@/PaleGL/constants.ts';
import { createEmptyCubeMap, CubeMap } from '@/PaleGL/core/cubeMap.ts';
import { bindFramebuffer, createFramebuffer, Framebuffer, unbindFramebuffer } from '@/PaleGL/core/framebuffer.ts';
import { drawGPU, setGPUShader, setGPUUniforms, setGPUVertexArrayObject } from '@/PaleGL/core/gpu.ts';
import { Renderer, setRenderTargetToRendererAndClear, tryStartMaterial } from '@/PaleGL/core/renderer.ts';
import type { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { setUniformValue } from '@/PaleGL/core/uniforms.ts';
import { createPlaneGeometry } from '@/PaleGL/geometries/planeGeometry.ts';
import type { Geometry } from '@/PaleGL/geometries/geometry.ts';
import { createMaterial, type Material } from '@/PaleGL/materials/material.ts';
import proceduralCubeMapFragmentShader from '@/PaleGL/shaders/procedural-cubemap-fragment.glsl';
import proceduralCubeMapVertexShader from '@/PaleGL/shaders/procedural-cubemap-vertex.glsl';

export type CubeMapUpdateContext = {
    material: Material;
    geometry: Geometry;
    framebuffer: Framebuffer;
    size: number;
    updateInterval: number;
};

export type CubeMapWithUpdateContext = {
    cubeMap: CubeMap;
    updateContext: CubeMapUpdateContext;
};

export function createProceduralCubeMap(
    renderer: Renderer,
    size: number = 256,
    updateInterval: number = 2,
    fragmentShader: string = proceduralCubeMapFragmentShader,
    additionalUniforms: UniformsData = []
): CubeMapWithUpdateContext {
    const { gpu } = renderer;
    const gl = gpu.gl;

    const cubeMap = createEmptyCubeMap(gpu, size, size);

    const framebuffer = createFramebuffer({ gpu });

    const planeGeometry = createPlaneGeometry({ gpu });

    const uniforms: UniformsData = [['uFaceIndex', UNIFORM_TYPE_INT, 0], ...additionalUniforms];

    const material = createMaterial({
        vertexShader: proceduralCubeMapVertexShader,
        fragmentShader,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        uniforms,
        uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON],
    });

    tryStartMaterial(gpu, renderer, renderer.sharedQuad, material);

    if (!material.shader) {
        console.error('[proceduralCubeMap] Shader compilation failed!');
    }

    // 6面をレンダリング
    bindFramebuffer(framebuffer);
    gl.viewport(0, 0, size, size);

    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        gl.framebufferTexture2D(
            GL_FRAMEBUFFER,
            GL_COLOR_ATTACHMENT0,
            GL_TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
            cubeMap.glObject,
            0
        );

        setUniformValue(material.uniforms, 'uFaceIndex', faceIndex);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        setGPUVertexArrayObject(gpu, planeGeometry.vertexArrayObject);
        setGPUShader(gpu, material.shader!);
        setGPUUniforms(gpu, material.uniforms);

        drawGPU(
            gpu,
            planeGeometry.drawCount,
            material.primitiveType,
            false, // depthTest
            false, // depthWrite
            DEPTH_FUNC_TYPE_LEQUAL,
            BLEND_TYPE_OPAQUE,
            FACE_SIDE_FRONT,
            null // instanceCount (nullで通常描画)
        );
    }

    unbindFramebuffer(framebuffer);

    gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeMap.glObject);
    gl.generateMipmap(GL_TEXTURE_CUBE_MAP);
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);

    return {
        cubeMap,
        updateContext: {
            material,
            geometry: planeGeometry,
            framebuffer,
            size,
            updateInterval,
        },
    };
}

export function updateProceduralCubeMap(renderer: Renderer, cubeMap: CubeMap, updateContext: CubeMapUpdateContext) {
    const { gpu } = renderer;
    const gl = gpu.gl;
    const { material, geometry, framebuffer, size } = updateContext;

    if (!material.shader) {
        console.error('[updateProceduralCubeMap] Shader not compiled!');
        return;
    }

    bindFramebuffer(framebuffer);
    gl.viewport(0, 0, size, size);

    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        gl.framebufferTexture2D(
            GL_FRAMEBUFFER,
            GL_COLOR_ATTACHMENT0,
            GL_TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
            cubeMap.glObject,
            0
        );

        setUniformValue(material.uniforms, 'uFaceIndex', faceIndex);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        setGPUVertexArrayObject(gpu, geometry.vertexArrayObject);
        setGPUShader(gpu, material.shader!);
        setGPUUniforms(gpu, material.uniforms);

        drawGPU(
            gpu,
            geometry.drawCount,
            material.primitiveType,
            false, // depthTest
            false, // depthWrite
            DEPTH_FUNC_TYPE_LEQUAL,
            BLEND_TYPE_OPAQUE,
            FACE_SIDE_FRONT,
            null // instanceCount (nullで通常描画)
        );
    }

    unbindFramebuffer(framebuffer);

    // mipmapを再生成
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeMap.glObject);
    gl.generateMipmap(GL_TEXTURE_CUBE_MAP);
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
}
