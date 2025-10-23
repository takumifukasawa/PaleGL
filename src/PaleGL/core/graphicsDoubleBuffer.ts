import {
    UniformBlockName,
    UniformBlockNames,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR2,

} from '@/PaleGL/constants.ts';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createVector2 } from '@/PaleGL/math/vector2.ts';
import baseVertexShader from '@/PaleGL/shaders/postprocess-pass-vertex.glsl';

const targetWidthUniformName = 'uTargetWidth';
const targetHeightUniformName = 'uTargetHeight';
const texelSizeUniformName = 'uTexelSize';

export const createGraphicsDoubleBufferMaterial = (
    fragmentShader: string,
    width: number,
    height: number,
    uniforms: UniformsData = [],
    uniformBlockNames: UniformBlockName[] = []
) => {
    return createMaterial({
        vertexShader: baseVertexShader,
        fragmentShader,
        uniforms: [
            ...uniforms,
            // {
            //     name: prevMapUniformName,
            //     type: UNIFORM_TYPE_TEXTURE,
            //     value: null,
            // },
            {
                name: targetWidthUniformName,
                type: UNIFORM_TYPE_FLOAT,
                value: width,
            },
            {
                name: targetHeightUniformName,
                type: UNIFORM_TYPE_FLOAT,
                value: height,
            },
            {
                name: texelSizeUniformName,
                type: UNIFORM_TYPE_VECTOR2,
                value: createVector2(1 / width, 1 / height),
            },
        ] as UniformsData,
        uniformBlockNames: [...uniformBlockNames, UniformBlockNames.Common],
    });
};
