import { UIAnchorType, UIAnchorTypes } from '@/PaleGL/constants.ts';
import { Actor, ActorArgs, createActor } from '@/PaleGL/actors/actor.ts';

export type UiActor = Actor & {
    anchor: UIAnchorType;
    // uiQueueType: UIQueueType;
};

export type UIActorArgs = ActorArgs & {
    anchor?: UIAnchorType;
    // uiQueueType?: UIQueueType;
};

export function createUIActor(args: UIActorArgs): UiActor {
    const { anchor = UIAnchorTypes.Center } = args;
    return {
        ...createActor(args),
        anchor,
        // uiQueueType
    };
}
