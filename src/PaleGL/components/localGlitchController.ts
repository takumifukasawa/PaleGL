import { NeedsShorten, TimelinePropertyValue } from '@/Marionetter/types';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import { setUniformValueToAllMeshMaterials } from '@/PaleGL/actors/meshes/meshBehaviours.ts';
import {
    createMaterialController,
    MaterialController,
    MaterialTimelineBindings,
} from '@/PaleGL/components/materialController.ts';
import {
    UNIFORM_NAME_BILLBOARD_OFFSET,
    UNIFORM_NAME_BILLBOARD_SIZE,
    UNIFORM_NAME_BLEND_RATE,
} from '@/PaleGL/constants';
import { numToBool } from '@/PaleGL/utilities/mathUtilities.ts';

const GLITCH_BLEND_RATE_PROPERTY_NAME = NeedsShorten ? 'lg_br' : 'BlendRate';
const GLITCH_BILLBOARD_SIZE_PROPERTY_NAME = NeedsShorten ? 'lg_bs' : 'BillboardSize';
const GLITCH_BILLBOARD_OFFSET_PROPERTY_NAME = NeedsShorten ? 'lg_bo' : 'BillboardOffset';

const GLITCH_BILLBOARD_ENABLED_PROPERTY_NAME = NeedsShorten ? 'lg_be' : 'BillboardEnabled';

const bindings: MaterialTimelineBindings = new Map([
    // prettier-ignore
    [
        GLITCH_BLEND_RATE_PROPERTY_NAME,
        [UNIFORM_NAME_BLEND_RATE]
    ],
    [GLITCH_BILLBOARD_SIZE_PROPERTY_NAME, [UNIFORM_NAME_BILLBOARD_SIZE]],
    [GLITCH_BILLBOARD_OFFSET_PROPERTY_NAME, [UNIFORM_NAME_BILLBOARD_OFFSET]],
]);

// timeline から操作される
export const createLocalGlitchController = (mesh: Mesh): MaterialController => {
    const controller = createMaterialController(mesh, bindings);

    return controller;
};

export const injectLocalGlitchBillboardProperties = (mesh: Mesh, key: string, value: TimelinePropertyValue) => {
    // switch (key) {
    //     case UNIFORM_NAME_BLEND_RATE:
    //         if (mesh !== null) {
    //             setUniformValueToAllMeshMaterials(mesh, UNIFORM_NAME_BLEND_RATE, value as number);
    //         }
    //         break;
    // }a
    if (bindings.has(key)) {
        const binding = bindings.get(key)!;
        const [uniformName] = binding;
        setUniformValueToAllMeshMaterials(mesh, uniformName, value);
        return;
    }

    if (key === GLITCH_BILLBOARD_ENABLED_PROPERTY_NAME) {
        mesh.enabled = numToBool(value as number);
    }
};
