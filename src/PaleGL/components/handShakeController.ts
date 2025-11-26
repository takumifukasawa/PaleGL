import { NeedsShorten } from '@/Marionetter/types';
import { ComponentBehaviour, ComponentModel, createComponent } from '@/PaleGL/components/component.ts';
import { createVector3Zero, setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

export type HandShakeControllerModel = ComponentModel & {
    amplitude: Vector3;
    speed: Vector3;
    offset: Vector3;
};

export type HandShakeController = [HandShakeControllerModel, ComponentBehaviour];

export const HAND_SHAKE_AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'hsa' : 'handShakeAmplitude';
export const HAND_SHAKE_SPEED_PROPERTY_NAME = NeedsShorten ? 'hss' : 'handShakeSpeed';
export const HAND_SHAKE_OFFSET_PROPERTY_NAME = NeedsShorten ? 'hso' : 'handShakeOffset';

type Args = {
    amplitude?: Vector3;
    speed?: Vector3;
    offset?: Vector3;
    updateCb?: (currentV: Vector3) => void;
};

// timeline から操作される
export function createHandShakeController(args: Args = {}): HandShakeController {
    const { updateCb = () => {} } = args;
    const { amplitude = createVector3Zero(), speed = createVector3Zero(), offset = createVector3Zero() } = args;

    const currentOffset = createVector3Zero();

    const component = {
        ...createComponent({
            onPostProcessTimeline: (_a, _b, time) => {
                const x = Math.sin(time * v3x(speed) + v3x(offset)) * v3x(amplitude);
                const y = Math.sin(time * v3y(speed) + v3y(offset)) * v3y(amplitude);
                const z = Math.sin(time * v3z(speed) + v3z(offset)) * v3z(amplitude);
                setV3x(currentOffset, x);
                setV3y(currentOffset, y);
                setV3z(currentOffset, z);
                updateCb(currentOffset);
            },
        }),
    };

    return [
        {
            ...component[0],
            amplitude,
            speed,
            offset,
        },
        component[1],
    ];
}
