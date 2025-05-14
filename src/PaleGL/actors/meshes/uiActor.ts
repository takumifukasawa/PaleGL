import { UIAnchorType, UIAnchorTypes, UIQueueType } from '@/PaleGL/constants.ts';
import { Actor, ActorArgs, createActor } from '@/PaleGL/actors/actor.ts';

export type UIActor = Actor & {
    anchor: UIAnchorType;
    // uiQueueType: UIQueueType;
};

export type UIActorArgs = ActorArgs & {
    anchor?: UIAnchorType;
    uiQueueType?: UIQueueType;
};

export function createUIActor(args: UIActorArgs): UIActor {
    const { anchor = UIAnchorTypes.Center /*, uiQueueType = UIQueueTypes.Overlay*/ } = args;
    return {
        ...createActor(args),
        anchor,
        // uiQueueType,
    };
}
