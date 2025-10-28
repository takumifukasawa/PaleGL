import {
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_COMPONENT_INFO_PROPERTY_BASE_COLOR,
    MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_COMPONENT_INFO_PROPERTY_EMISSIVE_COLOR,
} from '@/Marionetter/types';
import { createMaterialController, MaterialController } from '@/PaleGL/components/materialController.ts';
import { UNIFORM_NAME_BASE_COLOR, UNIFORM_NAME_EMISSIVE_COLOR } from '@/PaleGL/constants';

const bindings = new Map([
    // prettier-ignore
    [
        MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_COMPONENT_INFO_PROPERTY_BASE_COLOR,
        UNIFORM_NAME_BASE_COLOR
    ],
    [
        MARIONETTER_GBUFFER_MATERIAL_CONTROLLER_COMPONENT_INFO_PROPERTY_EMISSIVE_COLOR,
        UNIFORM_NAME_EMISSIVE_COLOR
    ],
]);

// timeline から操作される
export const createGBufferMaterialController = (): MaterialController => {
    return createMaterialController("GBufferMaterialController", bindings);
}
