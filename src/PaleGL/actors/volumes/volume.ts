import {Actor, ActorArgs, createActor} from '@/PaleGL/actors/actor.ts';

export type Volume = Actor;

export function createVolume(args: ActorArgs): Volume {
    return createActor(args);
}
