import { NeedsShorten } from '@/Marionetter/types';
import { ComponentBehaviour, ComponentModel, createComponent } from '@/PaleGL/components/component.ts';
import { createVector3Zero, setV3x, setV3y, setV3z, v3x, v3y, v3z, Vector3 } from '@/PaleGL/math/vector3.ts';
import { subscribeActorProcessPropertyBinder } from '@/PaleGL/actors/actor.ts';

export type HandShakeControllerModel = ComponentModel & {
    positionAmplitude: Vector3;
    positionSpeed: Vector3;
    positionOffset: Vector3;
    lookAtAmplitude: Vector3;
    lookAtSpeed: Vector3;
    lookAtOffset: Vector3;
};

export type HandShakeController = [HandShakeControllerModel, ComponentBehaviour];

export const HAND_SHAKE_POSITION_AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'hs_pa' : 'handShakeAmplitude';
export const HAND_SHAKE_POSITION_SPEED_PROPERTY_NAME = NeedsShorten ? 'hs_ps' : 'handShakeSpeed';
export const HAND_SHAKE_POSITION_OFFSET_PROPERTY_NAME = NeedsShorten ? 'hs_os' : 'handShakeOffset';
export const HAND_SHAKE_LOOK_AT_AMPLITUDE_PROPERTY_NAME = NeedsShorten ? 'hs_la' : 'handShakeAmplitude';
export const HAND_SHAKE_LOOK_AT_SPEED_PROPERTY_NAME = NeedsShorten ? 'hs_ls' : 'handShakeSpeed';
export const HAND_SHAKE_LOOK_AT_OFFSET_PROPERTY_NAME = NeedsShorten ? 'hs_lo' : 'handShakeOffset';

type Args = {
    positionAmplitude?: Vector3;
    positionSpeed?: Vector3;
    positionOffset?: Vector3;
    lookAtAmplitude?: Vector3;
    lookAtSpeed?: Vector3;
    lookAtOffset?: Vector3;
    updateCb?: (currentPositionOffset: Vector3, currentLookAtOffset: Vector3) => void;
};

// timeline から操作される
export function createHandShakeController(args: Args = {}): HandShakeController {
    const { updateCb = () => {} } = args;
    const {
        positionAmplitude = createVector3Zero(),
        positionSpeed = createVector3Zero(),
        positionOffset = createVector3Zero(),
        lookAtAmplitude = createVector3Zero(),
        lookAtSpeed = createVector3Zero(),
        lookAtOffset = createVector3Zero(),
    } = args;

    const currentPositionOffset = createVector3Zero();
    const currentLookAtOffset = createVector3Zero();
    
    const component = {
        ...createComponent({
            onPostProcessTimeline: (_a, _b, time) => {
                const px = Math.sin(time * v3x(positionSpeed) + v3x(positionOffset)) * v3x(positionAmplitude);
                const py = Math.sin(time * v3y(positionSpeed) + v3y(positionOffset)) * v3y(positionAmplitude);
                const pz = Math.sin(time * v3z(positionSpeed) + v3z(positionOffset)) * v3z(positionAmplitude);
                const lx = Math.sin(time * v3x(lookAtSpeed) + v3x(lookAtOffset)) * v3x(lookAtAmplitude);
                const ly = Math.sin(time * v3y(lookAtSpeed) + v3y(lookAtOffset)) * v3y(lookAtAmplitude);
                const lz = Math.sin(time * v3z(lookAtSpeed) + v3z(lookAtOffset)) * v3z(lookAtAmplitude);
                setV3x(currentPositionOffset, px);
                setV3y(currentPositionOffset, py);
                setV3z(currentPositionOffset, pz);
                setV3x(currentLookAtOffset, lx);
                setV3y(currentLookAtOffset, ly);
                setV3z(currentLookAtOffset, lz);
                updateCb(currentPositionOffset, currentLookAtOffset);
                // console.log(currentPositionOffset, currentLookAtOffset);
            },
        }),
    };

    return [
        {
            ...component[0],
            positionAmplitude: positionAmplitude,
            positionSpeed: positionSpeed,
            positionOffset: positionOffset,
            lookAtAmplitude: lookAtAmplitude,
            lookAtSpeed: lookAtSpeed,
            lookAtOffset: lookAtOffset,
        },
        component[1],
    ];
}
