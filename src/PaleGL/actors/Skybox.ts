import { Mesh } from '@/PaleGL/actors/Mesh';
import {
    UniformTypes,
    PrimitiveTypes,
    ActorTypes,
    AttributeNames,
    UniformNames,
    ShadingModelIds,
    UniformBlockNames,
} from '@/PaleGL/constants';
import { Material } from '@/PaleGL/materials/Material';
import { parseObj } from '@/PaleGL/loaders/loadObj';
import { Geometry } from '@/PaleGL/geometries/Geometry';
// import { Matrix4 } from '@/PaleGL/math/Matrix4';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { CubeMap } from '@/PaleGL/core/CubeMap';
import { createAttribute } from '@/PaleGL/core/attribute.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import skyboxVertexShader from '@/PaleGL/shaders/skybox-vertex.glsl';
import skyboxFragmentShader from '@/PaleGL/shaders/skybox-fragment.glsl';

// 法線が内側を向いた単位立方体
const skyboxGeometryObjText: string = `
# Blender 3.3.1
# www.blender.org
mtllib skybox-cube.mtl
v -1.000000 -1.000000 1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 -1.000000
v 1.000000 -1.000000 1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 -1.000000
vn 0.5774 0.5774 0.5774
vn 0.5774 -0.5774 -0.5774
vn 0.5774 0.5774 -0.5774
vn -0.5774 0.5774 0.5774
vn 0.5774 -0.5774 0.5774
vn -0.5774 0.5774 -0.5774
vn -0.5774 -0.5774 0.5774
vn -0.5774 -0.5774 -0.5774
vt 0.375000 0.000000
vt 0.375000 1.000000
vt 0.125000 0.750000
vt 0.625000 0.000000
vt 0.625000 1.000000
vt 0.875000 0.750000
vt 0.125000 0.500000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.875000 0.500000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.375000 0.500000
vt 0.625000 0.500000
s 1
f 3/8/1 2/4/2 1/1/3
f 7/13/4 4/9/5 3/8/1
f 5/11/6 8/14/7 7/13/4
f 1/2/3 6/12/8 5/11/6
f 1/3/3 7/13/4 3/7/1
f 6/12/8 4/10/5 8/14/7
f 3/8/1 4/9/5 2/4/2
f 7/13/4 8/14/7 4/9/5
f 5/11/6 6/12/8 8/14/7
f 1/2/3 2/5/2 6/12/8
f 1/3/3 5/11/6 7/13/4
f 6/12/8 2/6/2 4/10/5
`;

type SkyboxArgs = {
    gpu: GPU;
    cubeMap: CubeMap;
    diffuseIntensity: number;
    specularIntensity: number;
    rotationOffset?: number;
    renderMesh?: boolean;
};

export class Skybox extends Mesh {
    cubeMap: CubeMap;
    diffuseIntensity: number = 1;
    specularIntensity: number = 1;
    rotationOffset: number = 0;
    renderMesh: boolean = true;

    constructor({
        gpu,
        cubeMap,
        diffuseIntensity,
        specularIntensity,
        rotationOffset = 0,
        renderMesh = true,
    }: SkyboxArgs) {
        const skyboxObjData = parseObj(skyboxGeometryObjText);
        const geometry = new Geometry({
            gpu,
            attributes: [
                createAttribute({
                    name: AttributeNames.Position,
                    data: new Float32Array(skyboxObjData.positions),
                    size: 3,
                }),
                createAttribute({
                    name: AttributeNames.Uv,
                    data: new Float32Array(skyboxObjData.uvs),
                    size: 2,
                }),
                createAttribute({
                    name: AttributeNames.Normal,
                    data: new Float32Array(skyboxObjData.normals),
                    size: 3,
                }),
            ],
            indices: skyboxObjData.indices,
            drawCount: skyboxObjData.indices.length,
        });

        const material = new Material({
            // gpu,
            name: 'Skybox',
            vertexShader: skyboxVertexShader,
            fragmentShader: skyboxFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            depthTest: true,
            depthWrite: false,
            useEnvMap: true,
            uniforms: [
                {
                    name: UniformNames.CubeTexture,
                    type: UniformTypes.CubeMap,
                    value: cubeMap,
                },
                // {
                //     name: UniformNames.ViewDirectionProjectionInverse,
                //     type: UniformTypes.Matrix4,
                //     value: Matrix4.identity,
                // },
                {
                    name: UniformNames.RotationOffset,
                    type: UniformTypes.Float,
                    value: rotationOffset,
                },
                {
                    name: UniformNames.ShadingModelId,
                    type: UniformTypes.Int,
                    value: ShadingModelIds.Skybox,
                },
            ],
            uniformBlockNames: [UniformBlockNames.Transformations, UniformBlockNames.Camera],
        });

        super({ geometry, material, actorType: ActorTypes.Skybox });

        this.cubeMap = cubeMap;
        this.diffuseIntensity = diffuseIntensity;
        this.specularIntensity = specularIntensity;
        this.rotationOffset = rotationOffset;
        this.renderMesh = renderMesh;
    }

    // TODO: renderer側で2回走らないようにする
    $updateTransform(camera: Camera) {
        if (camera) {
            this.transform.setTranslation(camera.transform.getPosition());
            // 1.733 ... 単位立方体の対角線の長さ sqrt(1 + 1 + 1)
            this.transform.setScaling(Vector3.fill(camera.far / 1.733));
        }
        super.$updateTransform();
    }
}
