import { ShapeFontBase } from '@/PaleGL/shapeFont/shapeFont.ts';
import { createShapeTextMeshBase, ShapeTextMeshArgs } from '@/PaleGL/actors/meshes/shapeTextMeshBase.ts';
import { createUnlitShapeCharMesh } from '@/PaleGL/actors/meshes/unlitShapeCharMesh.ts';
import {
    DepthFuncTypes,
    MeshTypes,
    PrimitiveTypes,
    ShadingModelIds,
    UIQueueTypes,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
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

    const actor = options.actor || createActor({ name: 'unlit-shape-text-mesh' });

    const baseUniforms: UniformsData = [
        {
            name: 'uColor',
            type: UniformTypes.Color,
            value: color,
        },
        {
            name: UniformNames.FontMap,
            type: UniformTypes.Texture,
            value: shapeFontTexture,
        },
        {
            name: UniformNames.FontTiling,
            type: UniformTypes.Vector4,
            // value: tilingOffset,
            value: createVector4(1, 1, 0, 0),
        },
        {
            name: 'uFontAspect',
            type: UniformTypes.Float,
            value: shapeFontRenderer.shapeFontAtlas.aspect,
        },
    ];

    const mergedUniforms: UniformsData = [
        ...baseUniforms,
        {
            name: UniformNames.ShadingModelId,
            type: UniformTypes.Int,
            value: ShadingModelIds.Unlit,
        },
        ...(uniforms || []),
    ];

    const depthUniforms: UniformsData = [...baseUniforms, ...(uniforms || [])];

    const material = createMaterial({
        name: 'shapeCharMeshMaterial',
        vertexShader: gBufferVert,
        fragmentShader: unlitShapeTextFrag,
        depthFragmentShader: unlitShapeTextDepthFrag,
        uniforms: mergedUniforms,
        depthUniforms,
        alphaTest: 0.5,
        depthTest: true,
        depthWrite: false,
        // receiveShadow: !!receiveShadow,
        primitiveType: PrimitiveTypes.Triangles,
        depthFuncType: DepthFuncTypes.Equal,
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
    });

    const shapeText = createShapeTextMeshBase({
        ...options,
        actor,
        createCharMeshFunc: createUnlitShapeCharMesh,
        uiQueueType: UIQueueTypes.None,
        meshType: MeshTypes.Default,
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
