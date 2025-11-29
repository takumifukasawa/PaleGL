import { NeedsShorten } from '@/Marionetter/types';
import { Mesh } from '@/PaleGL/actors/meshes/mesh.ts';
import {
    createMaterialController,
    MaterialController,
    MaterialTimelineBindings,
} from '@/PaleGL/components/materialController.ts';
import { UNIFORM_NAME_BLEND_RATE } from '@/PaleGL/constants';

const GLITCH_BLEND_RATE_PROPERTY_NAME = NeedsShorten ? 'lg_br' : 'BlendRate';

const bindings: MaterialTimelineBindings = new Map([
    // prettier-ignore
    [
        GLITCH_BLEND_RATE_PROPERTY_NAME,
        [UNIFORM_NAME_BLEND_RATE]
    ],
]);

// timeline から操作される
export const createLocalGlitchController = (mesh: Mesh): MaterialController => {
    const controller = createMaterialController(mesh, bindings);

    return controller;
};
