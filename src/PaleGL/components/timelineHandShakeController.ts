import { NeedsShorten } from '@/Marionetter/types';
import { Component, createComponent } from '@/PaleGL/components/component.ts';
import { setTranslation } from '@/PaleGL/core/transform.ts';
import { createVector3Zero, setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';

export type TimelineHandShakeController = Component & {};

export const AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'a' : 'amplitude';
export const SPEED_PROPERTY_NAME = NeedsShorten ? 's' : 'speed';
export const OFFSET_PROPERTY_NAME = NeedsShorten ? 'o' : 'offset';

// timeline から操作される
export function createTimelineHandShakeController(args: {
    amplitude: Vector3;
    speed: Vector3;
    offset: Vector3;
}): TimelineHandShakeController {
    const amplitude: Vector3 = args.amplitude;
    const speed: Vector3 = args.speed;
    const offset: Vector3 = args.offset;
    const currentV: Vector3 = createVector3Zero();

    return createComponent({
        name: 'TimelineHandShakeController',
        // onFilterPropertyBinder: () => console.log("hoge"),
        onUpdateCallback: (actor, _a, _b, time) => {
            const x = Math.sin(time * v3x(speed) + v3x(offset)) * v3x(amplitude);
            const y = Math.sin(time * v3y(speed) + v3y(offset)) * v3y(amplitude);
            const z = Math.sin(time * v3z(speed) + v3z(offset)) * v3z(amplitude);
            setV3x(currentV, x);
            setV3y(currentV, y);
            setV3z(currentV, z);
            setTranslation(actor.transform, currentV);
        },
    });
}
