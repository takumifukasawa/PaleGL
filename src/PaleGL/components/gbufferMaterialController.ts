import { MarionetterGBufferMaterialControllerComponentInfoProperty } from '@/Marionetter/types';
import { createMaterialController, MaterialController } from '@/PaleGL/components/materialController.ts';
import { UniformNames } from '@/PaleGL/constants.ts';

const bindings = new Map([
    // prettier-ignore
    [
        MarionetterGBufferMaterialControllerComponentInfoProperty.emissiveColor,
        UniformNames.EmissiveColor
    ],
]);

// timeline から操作される
export function createGBufferMaterialController(): MaterialController {
    return createMaterialController(bindings);
}
