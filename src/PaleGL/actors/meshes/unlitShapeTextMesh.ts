import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { createUnlitShapeCharMesh } from '@/PaleGL/actors/meshes/unlitShapeCharMesh.ts';
import {
    DEPTH_FUNC_TYPE_LEQUAL,
    MESH_TYPE_TEXT,
    PRIMITIVE_TYPE_TRIANGLES,
    SHADING_MODEL_ID_UNLIT,
    UI_QUEUE_TYPE_NONE,
    UNIFORM_BLOCK_NAME_COMMON,
    UNIFORM_BLOCK_NAME_TRANSFORMATIONS,
    UNIFORM_BLOCK_NAME_CAMERA,
    UNIFORM_NAME_FONT_MAP,
    UNIFORM_NAME_FONT_TILING,
    UNIFORM_NAME_SHADING_MODEL_ID,
    UNIFORM_TYPE_TEXTURE,
    UNIFORM_TYPE_FLOAT,
    UNIFORM_TYPE_VECTOR4,
    UNIFORM_TYPE_INT,
    UNIFORM_TYPE_COLOR,

} from '@/PaleGL/constants.ts';
import { TextAlignType } from '@/PaleGL/actors/meshes/textMesh.ts';
import { setV3x, setV3y } from '@/PaleGL/math/vector3.ts';
import { createActor } from '@/PaleGL/actors/actor.ts';
import { ShapeTextMesh } from '@/PaleGL/actors/meshes/shapeTextMesh.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import gBufferVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import unlitShapeTextFrag from '@/PaleGL/shaders/unlit-shape-text-fragment.glsl';
import unlitShapeTextDepthFrag from '@/PaleGL/shaders/unlit-shape-text-depth-fragment.glsl';
import { UniformsData } from '@/PaleGL/core/uniforms.ts';
import { createColorWhite } from '@/PaleGL/math/color.ts';
import { createVector4 } from '@/PaleGL/math/vector4.ts';

export function createUnlitShapeTextMesh<T, U extends ShapeFontBase<T>>(
    options: ShapeTextMeshArgs<T, U>
): ShapeTextMesh<T, U> {
    const {
        align,
        characterSpacing = 0,
        uniforms = [],
        color = createColorWhite(),
        shapeFontTexture,
        shapeFontRenderer,
    } = options;

    const actor = options.actor || createActor({
        // CUSTOM_BEGIN comment out
        // name: 'unlit-shape-text-mesh'
        // CUSTOM_END
    });

    const baseUniforms: UniformsData = [
        ['uColor', UNIFORM_TYPE_COLOR, color],
        [UNIFORM_NAME_FONT_MAP, UNIFORM_TYPE_TEXTURE, shapeFontTexture],
        [UNIFORM_NAME_FONT_TILING, UNIFORM_TYPE_VECTOR4, createVector4(1, 1, 0, 0)],
        ['uFontAspect', UNIFORM_TYPE_FLOAT, shapeFontRenderer.shapeFontAtlas.aspect],
    ];

    const mergedUniforms: UniformsData = [
        ...baseUniforms,
        [UNIFORM_NAME_SHADING_MODEL_ID, UNIFORM_TYPE_INT, SHADING_MODEL_ID_UNLIT],
        ...(uniforms || []),
    ];

    const depthUniforms: UniformsData = [...baseUniforms, ...(uniforms || [])];

    const material = createMaterial({
        // CUSTOM_BEGIN comment out
        // name: 'shapeCharMeshMaterial',
        // CUSTOM_END
        vertexShader: gBufferVert,
        fragmentShader: unlitShapeTextFrag,
        depthFragmentShader: unlitShapeTextDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        alphaTest: 0.5,
        depthTest: true,
        depthWrite: false,
        // receiveShadow: !!receiveShadow,
        primitiveType: PRIMITIVE_TYPE_TRIANGLES,
        depthFuncType: DEPTH_FUNC_TYPE_LEQUAL,
        uniformBlockNames: [UNIFORM_BLOCK_NAME_COMMON, UNIFORM_BLOCK_NAME_TRANSFORMATIONS, UNIFORM_BLOCK_NAME_CAMERA],
    });

    const shapeText = createShapeTextMeshBase({
        ...options,
        actor,
        createCharMeshFunc: createUnlitShapeCharMesh,
        uiQueueType: UI_QUEUE_TYPE_NONE,
        meshType: MESH_TYPE_TEXT,
        material,
    });

    const { shapeCharMeshes } = shapeText;

    let accWidth = 0;
    let originX = 0;

    for (let i = 0; i < shapeCharMeshes.length; i++) {
        const mesh = shapeCharMeshes[i];
        accWidth += mesh.charWidth;
    }

    switch (align) {
        case TextAlignType.Center:
            originX -= accWidth / 2 + (characterSpacing * (shapeCharMeshes.length - 1)) / 2;
            break;
    }

    for (let i = 0; i < shapeCharMeshes.length; i++) {
        const mesh = shapeCharMeshes[i];
        originX += mesh.charWidth / 2;
        setV3x(mesh.transform.position, originX);
        const offsetY = -mesh.charHeight * 0.5;
        setV3y(mesh.transform.position, offsetY);
        originX += mesh.charWidth / 2 + characterSpacing;
    }

    return { ...actor, ...shapeText };
}
