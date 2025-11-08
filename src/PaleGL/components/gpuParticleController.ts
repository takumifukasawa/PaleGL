import { NeedsShorten } from '@/Marionetter/types';
import { GpuParticle, switchGPUParticleUpdater } from '@/PaleGL/actors/particles/gpuParticle.ts';
import {
    Component,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
    OnProcessPropertyBinderCallback,
} from '@/PaleGL/components/component.ts';
import { COMPONENT_TYPE_GPU_PARTICLE_CONTROLLER } from '@/PaleGL/constants.ts';

const Property = {
    updaterIndex: NeedsShorten ? 'gp_ui' : 'updaterIndex',
} as const;

export type GPUParticleControllerBehaviour = ComponentBehaviour & {
    switchUpdater: (index: number) => void;
};

export type GPUParticleController = Component<ComponentModel, GPUParticleControllerBehaviour>;

export const createGPUParticleController = (gpuParticle: GpuParticle): GPUParticleController => {
    const switchUpdater = (index: number) => {
        switchGPUParticleUpdater(gpuParticle, index);
    };

    const onProcessPropertyBinder: OnProcessPropertyBinderCallback = (actor, componentModel, key, value) => {
        if (key === Property.updaterIndex) {
            // const index = Math.floor((value as number) + 0.001); // TODO: 念のためちょっとオフセット. 本当に必要？
            switchUpdater(value as number);
        }
    };

    return createComponent(
        { type: COMPONENT_TYPE_GPU_PARTICLE_CONTROLLER, onProcessPropertyBinder },
        { switchUpdater }
    );
};
