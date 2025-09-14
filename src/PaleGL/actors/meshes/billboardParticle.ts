import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import {
    AttributeNames, BlendType,
    BlendTypes,
    FragmentShaderModifiers,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
    VertexShaderModifiers,
} from '@/PaleGL/constants.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Color, getColorRange } from '@/PaleGL/math/color.ts';
import { createMaterial } from '@/PaleGL/materials/material.ts';
import { createVector2, isVector2, v2x, v2y, Vector2 } from '@/PaleGL/math/vector2.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { random, randomRange } from '@/PaleGL/utilities/mathUtilities.ts';
import { v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';
import { Texture } from '@/PaleGL/core/texture.ts';

export type BillboardParticle = Mesh;

export type BillboardParticleArgs = {
    gpu: Gpu;
    vertexShader: string;
    fragmentShader: string;
    minPosition: Vector3;
    maxPosition: Vector3;
    minSize: Vector2 | number;
    maxSize: Vector2 | number;
    minColor: Color;
    maxColor: Color;
    particleNum: number;
    particleMap?: Texture;
    blendType?: BlendType;
    vertexShaderModifiers?: VertexShaderModifiers;
    fragmentShaderModifiers?: FragmentShaderModifiers;
};

export const createBillboardParticle = (args: BillboardParticleArgs) => {
    const {
        gpu,
        particleMap = null,
        vertexShader,
        fragmentShader,
        particleNum,
        minPosition,
        maxPosition,
        minSize,
        maxSize,
        minColor,
        maxColor,
        blendType = BlendTypes.Transparent,
        vertexShaderModifiers = [],
        fragmentShaderModifiers = [],
    } = args;
    const particleGeometry = createGeometry({
        gpu,
        attributes: [
            createAttribute(
                AttributeNames.Position.toString(),
                // dummy data
                new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const x = randomRange(v3x(minPosition), v3x(maxPosition));
                            const y = randomRange(v3y(minPosition), v3y(maxPosition));
                            const z = randomRange(v3z(minPosition), v3z(maxPosition));
                            // prettier-ignore
                            return [
                                x, y, z,
                                x, y, z,
                                x, y, z,
                                x, y, z,
                            ];
                        })
                        .flat()
                ),
                3
            ),
            createAttribute(
                AttributeNames.Uv.toString(),
                new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() =>
                            // prettier-ignore
                            [
                                0, 1,
                                0, 0,
                                1, 1,
                                1, 0,
                            ]
                        )
                        .flat()
                ),
                2
            ),
            createAttribute(
                AttributeNames.Color.toString(),
                new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const c = getColorRange(minColor, maxColor);
                            return [
                                // prettier-ignore
                                ...c.e,
                                ...c.e,
                                ...c.e,
                                ...c.e,
                            ];
                        })
                        .flat()
                ),
                4
            ),
            createAttribute(
                'aBillboardSize',
                new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            let sx,
                                sy = 0;
                            if (isVector2(minSize) && isVector2(maxSize)) {
                                sx = randomRange(v2x(minSize as Vector2), v2x(maxSize as Vector2));
                                sy = randomRange(v2y(minSize as Vector2), v2y(maxSize as Vector2));
                            } else {
                                const s = randomRange(minSize as number, maxSize as number);
                                sx = s;
                                sy = s;
                            }
                            // prettier-ignore
                            return [
                                sx, sy,
                                sx, sy,
                                sx, sy,
                                sx, sy
                            ];
                        })
                        .flat()
                ),
                2
            ),
            createAttribute(
                'aBillboardCycleOffset',
                new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const r = random();
                            return [
                                // prettier-ignore
                                r,
                                r,
                                r,
                                r,
                            ];
                        })
                        .flat()
                ),
                1
            ),
        ],
        indices: maton
            .range(particleNum)
            .map((_, i) => {
                const offset = i * 4;
                // prettier-ignore
                const index = [
                    0 + offset, 1 + offset, 2 + offset,
                    2 + offset, 1 + offset, 3 + offset
                ];
                return index;
            })
            .flat(),
        drawCount: particleNum * 6,
    });
    const particleMaterial = createMaterial({
        // gpu,
        vertexShader,
        fragmentShader,
        uniforms: [
            {
                name: 'uParticleMap',
                type: UniformTypes.Texture,
                value: particleMap,
            },
            {
                name: 'uBillboardPositionConverters',
                type: UniformTypes.Vector2Array,
                value: [
                    // prettier-ignore
                    createVector2(-1, 1),
                    createVector2(-1, -1),
                    createVector2(1, 1),
                    createVector2(1, -1),
                ],
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
        ],
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Camera],
        // blendType: BlendTypes.Additive
        vertexShaderModifiers,
        fragmentShaderModifiers,
        blendType,
        depthWrite: false,
    });
    const particleMesh = createMesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });

    return particleMesh;
};
