import { NeedsShorten } from '@/Marionetter/types';
import {
    COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
    ComponentBehaviour,
    ComponentModel,
    createComponent,
} from '@/PaleGL/components/component.ts';
import { createVector3Zero, setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

export type HandShakeControllerModel = ComponentModel & {
    params: {
        amplitude: Vector3;
        speed: Vector3;
        offset: Vector3;
    };
};

export type HandShakeController = [HandShakeControllerModel, ComponentBehaviour];

export const HAND_SHAKE_AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'hsa' : 'handShakeAmplitude';
export const HAND_SHAKE_SPEED_PROPERTY_NAME = NeedsShorten ? 'hss' : 'handShakeSpeed';
export const HAND_SHAKE_OFFSET_PROPERTY_NAME = NeedsShorten ? 'hso' : 'handShakeOffset';

// timeline から操作される
export function createHandShakeController(
    args: {
        amplitude?: Vector3;
        speed?: Vector3;
        offset?: Vector3;
        updateCb?: (currentV: Vector3) => void;
    } = {
        amplitude: createVector3Zero(),
        speed: createVector3Zero(),
        offset: createVector3Zero(),
        updateCb: () => {},
    }
): HandShakeController {
    const { updateCb = () => {} } = args;
    let { amplitude = createVector3Zero(), speed = createVector3Zero(), offset = createVector3Zero() } = args;
    // const amplitude: Vector3 = args.amplitude;
    // const speed: Vector3 = args.speed;
    // const offset: Vector3 = args.offset;
    // const currentV: Vector3 = createVector3Zero();

    const params = {
        amplitude,
        speed,
        offset,
        currentOffset: createVector3Zero(),
    };

    const component = {
        ...createComponent({
            type: COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
            // name: 'HandShakeController',
            // onFilterPropertyBinder: () => console.log("hoge"),
            onUpdateCallback: (actor, _a, _b, time) => {
                const x = Math.sin(time * v3x(params.speed) + v3x(params.offset)) * v3x(params.amplitude);
                const y = Math.sin(time * v3y(params.speed) + v3y(params.offset)) * v3y(params.amplitude);
                const z = Math.sin(time * v3z(params.speed) + v3z(params.offset)) * v3z(params.amplitude);
                setV3x(params.currentOffset, x);
                setV3y(params.currentOffset, y);
                setV3z(params.currentOffset, z);
                // setTranslation(actor.transform, currentV);
                updateCb(params.currentOffset);
            },
            // onProcessPropertyBinder: (actor, _, key, value) => {
            //     console.log(key,  value);
            // }
        }),
    };

    return [
        {
            ...component[0],
            params,
        },
        component[1],
    ];
}
