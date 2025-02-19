import { GPU } from '@/PaleGL/core/GPU.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
// import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { ActorUpdateArgs } from '@/PaleGL/actors/Actor.ts';
// import {GBufferMaterial} from "@/PaleGL/materials/GBufferMaterial.ts";

const UNIFORM_NAME_PERSPECTIVE_FLAG = 'uIsPerspective';

type ObjectSpaceRaymarchMeshArgs = {
    name?: string;
    gpu: GPU;
    size?: number;
    // fragmentShader: string;
    // depthFragmentShader: string;
    // uniforms?: UniformsData;

    // 1: materialを渡す場合
    materials?: ObjectSpaceRaymarchMaterial[];

    // 2: templateとcontentを渡す場合
    fragmentShaderTemplate?: string;
    fragmentShaderContent?: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent?: string;
    materialArgs?: ObjectSpaceRaymarchMaterialArgs;
} & MeshOptionsArgs;

// NOTE: 今はbox限定. sphereも対応したい
export class ObjectSpaceRaymarchMesh extends Mesh {
    constructor(args: ObjectSpaceRaymarchMeshArgs) {
        const { gpu, name, materialArgs, castShadow, size } = args;
        const geometry = new BoxGeometry({ gpu, size });

        const materials = args.materials
            ? args.materials
            : [
                  createObjectSpaceRaymarchMaterial({
                      fragmentShaderContent: args.fragmentShaderContent!,
                      depthFragmentShaderContent: args.depthFragmentShaderContent!,
                      materialArgs: materialArgs!,
                  }),
              ];

        // NOTE
        // const material = new GBufferMaterial({
        //     metallic: 0,
        //     roughness: 1,
        //     receiveShadow: true,
        //     isSkinning: false,
        //     gpuSkinning: false,
        //     isInstancing: true,
        //     useInstanceLookDirection: true,
        //     useVertexColor: true,
        //     faceSide: FaceSide.Double,
        //     primitiveType: PrimitiveTypes.Triangles,
        // });

        super({ name, geometry, materials, castShadow });
    }

    update(args: ActorUpdateArgs) {
        super.update(args);

        // for debug
        // console.log("============")
        // console.log(this.name)
        // this.transform.scale.log()
        // this.parent?.transform.scale.log()
        // this.transform.getWorldScale().log();
        // console.log("============")
        
        this.materials.forEach((material) => {
            // local
            material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
            // wp
            // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
        });
        this.depthMaterials.forEach((material) => {
            // local
            material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
            // wp
            // material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.getWorldScale());
        });
    }

    updateMaterial({ camera }: { camera: Camera }) {
        super.updateMaterial({ camera });
        this.materials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_NAME_PERSPECTIVE_FLAG, camera.isPerspective() ? 1 : 0);
        });
    }

    updateDepthMaterial({ camera }: { camera: Camera }) {
        super.updateDepthMaterial({ camera });
        this.depthMaterials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_NAME_PERSPECTIVE_FLAG, camera.isPerspective() ? 1 : 0);
        });
    }
    
    setUseWorldSpace(flag: boolean) {
        this.setUniformValueToAllMaterials("uUseWorld", flag ? 1 : 0);
    }
}
