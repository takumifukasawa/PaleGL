import { NeedsShorten } from '@/Marionetter/types';
import { Component, COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT, createComponent } from '@/PaleGL/components/component.ts';
import { createVector3Zero, setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

export type HandShakeController = Component & {};

export const AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'a' : 'amplitude';
export const SPEED_PROPERTY_NAME = NeedsShorten ? 's' : 'speed';
export const OFFSET_PROPERTY_NAME = NeedsShorten ? 'o' : 'offset';

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
    const currentV: Vector3 = createVector3Zero();

    return {
        ...createComponent({
            type: COMPONENT_TYPE_OBJECT_MOVE_AND_LOOK_AT,
            // name: 'HandShakeController',
            // onFilterPropertyBinder: () => console.log("hoge"),
            onUpdateCallback: (actor, _a, _b, time) => {
                const x = Math.sin(time * v3x(speed) + v3x(offset)) * v3x(amplitude);
                const y = Math.sin(time * v3y(speed) + v3y(offset)) * v3y(amplitude);
                const z = Math.sin(time * v3z(speed) + v3z(offset)) * v3z(amplitude);
                setV3x(currentV, x);
                setV3y(currentV, y);
                setV3z(currentV, z);
                // setTranslation(actor.transform, currentV);
                updateCb(currentV);
            },
        }),
    };
}
