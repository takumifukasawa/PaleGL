import {
    FragmentShaderModifiers,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_NAME_TARGET_HEIGHT,
    UNIFORM_NAME_TARGET_WIDTH,
    UNIFORM_NAME_TEXEL_SIZE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,
    UniformBlockName,
} from '@/PaleGL/constants.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import baseVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';

const targetWidthUniformName = UNIFORM_NAME_TARGET_WIDTH;
const targetHeightUniformName = UNIFORM_NAME_TARGET_HEIGHT;
const texelSizeUniformName = UNIFORM_NAME_TEXEL_SIZE;

export const createGraphicsDoubleBufferMaterial = (
    fragmentShader: string,
    width: number,
    height: number,
    uniforms: UniformsData = [],
    uniformBlockNames: UniformBlockName[] = [],
    fragmentShaderModifiers: FragmentShaderModifiers = []
) => {
    const appendUniforms: UniformsData = [
        [targetWidthUniformName, UNIFORM_TYPE_FLOAT, width],
        [targetHeightUniformName, UNIFORM_TYPE_FLOAT, height],
        [texelSizeUniformName, UNIFORM_TYPE_VECTOR2, createVector2(1 / width, 1 / height)],
    ];

    return createMaterial({
        vertexShader: baseVertexShader,
        fragmentShader,
        uniforms: [...uniforms, ...appendUniforms],
        uniformBlockNames: [...uniformBlockNames, UNIFORM_BLOCK_NAME_COMMON],
        fragmentShaderModifiers,
    });
};
