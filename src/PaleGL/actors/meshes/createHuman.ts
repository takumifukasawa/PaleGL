import { createObjectSpaceRaymarchMesh } from '@/PaleGL/actors/meshes/objectSpaceRaymarchMesh.ts';
import { Gpu } from '@/PaleGL/core/gpu.ts';
import { setScaling, setTranslation } from '@/PaleGL/core/transform.ts';
import { createObjectSpaceRaymarchGBufferMaterial } from '@/PaleGL/materials/objectSpaceRaymarchGBufferMaterial.ts';
import { createVector3 } from '@/PaleGL/math/vector3.ts';
import { Player } from '@/Player/player.ts';

export const createHuman = (
    // prettier-ignore
    gpu: Gpu,
    // player: Player,
    objectSpaceRaymarchFragContent: string = `vec2 dfScene(vec3 p) { return vec2(length(p) - 1.0, 0.); }` // fallback
) => {
    // TODO:
    const mesh = createObjectSpaceRaymarchMesh({
        name: 'object-space-raymarch-mesh',
        gpu,
        // size: createVector3(0.6, 1.8, 0.6),
        // size: createVector3(1, 1, 1),
        materials: [
            createObjectSpaceRaymarchGBufferMaterial({
                fragmentShaderContent: objectSpaceRaymarchFragContent,
                depthFragmentShaderContent: objectSpaceRaymarchFragContent,
                metallic: 0,
                roughness: 0,
                // receiveShadow: false,
            }),
            // createObjectSpaceRaymarchGlassMaterial({
            //     fragmentShaderContent: objectSpaceRaymarchFragContent,
            //     depthFragmentShaderContent: objectSpaceRaymarchFragContent,
            //     receiveShadow: false,
            //     renderQueueType: RenderQueueType.Transparent,
            //     blendType: BlendTypes.Transparent,
            //     depthTest: true,
            //     depthWrite: true,
            //     depthFuncType: DepthFuncTypes.Lequal,
            //     faceSide: FaceSide.Front,
            //     uniforms: [
            //         {
            //             name: UniformNames.SceneTexture,
            //             type: UniformTypes.Texture,
            //             value: null,
            //         },
            //         {
            //             name: 'uMorphRate',
            //             type: UniformTypes.Float,
            //             value: 0,
            //         },
            //     ],
            // }),
        ],
        castShadow: true,
    });
    // subscribeActorOnUpdate(objectSpaceRaymarchMesh, (args) => {
    //     const { time } = args;
    //     // console.log(time);
    //     const morphRate = debuggerStates.morphingEnabled ? time : debuggerStates.morphRate;
    //     setUniformValueToAllMeshMaterials(objectSpaceRaymarchMesh, 'uMorphRate', morphRate);
    // });
    // setScaling(objectSpaceRaymarchMesh.transform, createVector3(0.6, 1.8, 0.6));
    setScaling(mesh.transform, createVector3(3, 3, 3));
    setTranslation(mesh.transform, createVector3(0, 1.5, 0));
    // // setUseWorldSpaceToObjectSpaceRaymarchMesh(objectSpaceRaymarchMesh, true);

    // addActorToScene(player.scene, mesh);

    return mesh;
};
