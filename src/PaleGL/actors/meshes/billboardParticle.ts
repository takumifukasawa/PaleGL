import { createMesh, Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import {
    AttributeNames,
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
import { createVector2 } from '@/PaleGL/math/vector2.ts';
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
    minSize: number;
    maxSize: number;
    minColor: Color;
    maxColor: Color;
    particleNum: number;
    particleMap?: Texture;
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
        vertexShaderModifiers = [],
        fragmentShaderModifiers = [],
    } = args;
    const particleGeometry = createGeometry({
        gpu,
        attributes: [
            createAttribute({
                name: AttributeNames.Position.toString(),
                // dummy data
                data: new Float32Array(
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
                size: 3,
            }),
            createAttribute({
                name: AttributeNames.Uv.toString(),
                data: new Float32Array(
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
                size: 2,
            }),
            createAttribute({
                name: AttributeNames.Color.toString(),
                data: new Float32Array(
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
                size: 4,
            }),
            createAttribute({
                name: 'aBillboardSize',
                data: new Float32Array(
                    maton
                        .range(particleNum)
                        .map(() => {
                            const s = randomRange(minSize, maxSize);
                            return [
                                // prettier-ignore
                                s,
                                s,
                                s,
                                s,
                            ];
                        })
                        .flat()
                ),
                size: 1,
            }),
            createAttribute({
                name: 'aBillboardRateOffset',
                data: new Float32Array(
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
                size: 1,
            }),
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
        blendType: BlendTypes.Transparent,
        depthWrite: false,
    });
    const particleMesh = createMesh({
        geometry: particleGeometry,
        material: particleMaterial,
    });

    console.log(vertexShader, fragmentShader, particleMesh.materials);

    return particleMesh;
};
