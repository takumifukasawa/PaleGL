import { MarionetterGBufferMaterialControllerComponentInfoProperty } from '@/Marionetter/types';
import { createMaterialController, MaterialController } from '@/PaleGL/components/materialController.ts';
import { UNIFORM_NAME_BASE_COLOR, UNIFORM_NAME_EMISSIVE_COLOR } from '@/PaleGL/constants';

const bindings = new Map([
    // prettier-ignore
    [
        MarionetterGBufferMaterialControllerComponentInfoProperty.baseColor,
        UNIFORM_NAME_BASE_COLOR
    ],
    [
        MarionetterGBufferMaterialControllerComponentInfoProperty.emissiveColor,
        UNIFORM_NAME_EMISSIVE_COLOR
    ],
]);

// timeline から操作される
export function createGBufferMaterialController(): MaterialController {
    return createMaterialController("GBufferMaterialController", bindings);
}
