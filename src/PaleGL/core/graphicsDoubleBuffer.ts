import { UniformBlockName, UniformBlockNames, UniformTypes } from '@/PaleGL/constants.ts';
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
            //     type: UniformTypes.Texture,
            //     value: null,
            // },
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
};
