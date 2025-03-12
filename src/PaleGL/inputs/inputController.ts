import { createVector2Zero, Vector2 } from '@/PaleGL/math/vector2.ts';


export const InputControllerTypes = {
    Mouse: 0,
    Touch: 1,
} as const;

export type InputControllerType = (typeof InputControllerTypes)[keyof typeof InputControllerTypes];

export type InputController = {
    type: InputControllerType
    beforeInputPosition: Vector2;
    currentInputPosition: Vector2;
    deltaInputPosition: Vector2;
    deltaNormalizedInputPosition: Vector2;
    normalizedInputPosition: Vector2;
    isPressed: boolean;
    isDown: boolean;
    isReleased: boolean;
    tmpIsDown: boolean;
    tmpInputPosition: Vector2;
    width: number;
    height: number;
};


export function createInputController(type: InputControllerType): InputController {
    const beforeInputPosition = createVector2Zero();
    const currentInputPosition = createVector2Zero();
    const deltaInputPosition = createVector2Zero();
    const deltaNormalizedInputPosition = createVector2Zero();
    const normalizedInputPosition = createVector2Zero();
    const isPressed = false;
    const isDown = false;
    const isReleased = false;
    const tmpIsDown = false;
    const tmpInputPosition = createVector2Zero();
    const width: number = 0;
    const height: number = 0;

    return {
        type,
        beforeInputPosition,
        currentInputPosition,
        deltaInputPosition,
        deltaNormalizedInputPosition,
        normalizedInputPosition,
        isPressed,
        isDown,
        isReleased,
        tmpIsDown,
        tmpInputPosition,
        width,
        height,
    };
}
