import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { ATTRIBUTE_NAME_POSITION, ATTRIBUTE_NAME_UV } from '@/PaleGL/constants.ts';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { createGeometry } from '@/PaleGL/geometries/geometry.ts';
import { v2x, v2y, Vector2 } from '@/PaleGL/math/vector2.ts';

export type Billboard = Mesh;

export type BillboardArgs = {
    gpu: Gpu;
    size: Vector2;
};

export const createBillboardGeometry = (args: BillboardArgs) => {
    const { gpu, size } = args;
    const geometry = createGeometry({
        gpu,
        attributes: [
            createAttribute(
                ATTRIBUTE_NAME_POSITION,
                // dummy data
                // prettier-ignore
                new Float32Array([
                    0, 0, 0,
                    0, 0, 0,
                    0, 0, 0,
                    0, 0, 0,
                ]),
                3
            ),
            createAttribute(
                ATTRIBUTE_NAME_UV,
                // prettier-ignore
                new Float32Array([
                    0, 1,
                    0, 0,
                    1, 1,
                    1, 0,
                ]),
                2
            ),
            createAttribute(
                'aBillboardSize',
                // prettier-ignore
                new Float32Array([
                    v2x(size) / 2,
                    v2y(size) / 2,
                    v2x(size) / 2,
                    v2y(size) / 2,
                    v2x(size) / 2,
                    v2y(size) / 2,
                    v2x(size) / 2,
                    v2y(size) / 2,
                ]),
                2
            ),
        ],
        indices: [
            // prettier-ignore
            0, 1, 2, 2, 1, 3,
        ],
        drawCount: 6,
    });

    return geometry;
};
