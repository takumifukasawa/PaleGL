import { GPU } from '@/PaleGL/core/GPU.ts';
import { PrimitiveTypes } from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { ObjectSpaceRaymarchMaterial } from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';

type ObjectSpaceRaymarchMeshArgs = {
    gpu: GPU;
    fragmentShader: string;
    depthFragmentShader: string;
    uniforms?: UniformsData;
} & MeshOptionsArgs;

// NOTE: 今はbox限定. sphereも対応したい
export class ObjectSpaceRaymarchMesh extends Mesh {
    constructor(args: ObjectSpaceRaymarchMeshArgs) {
        const { gpu, fragmentShader, depthFragmentShader, uniforms = [], castShadow } = args;
        const geometry = new BoxGeometry({ gpu });
        const material = new ObjectSpaceRaymarchMaterial({
            fragmentShader,
            depthFragmentShader,
            uniforms,
            // receiveShadow: !!receiveShadow,
            primitiveType: PrimitiveTypes.Triangles,
        });

        super({ geometry, material, castShadow });
    }
}
