import { Volume } from '@/PaleGL/actors/Volume.ts';
import { ActorTypes } from '@/PaleGL/constants.ts';
import {IPostProcessPass} from "@/PaleGL/postprocess/IPostProcessPass.ts";

export class PostProcessVolume extends Volume {
    passes: IPostProcessPass[] = [];
    constructor({ name }: { name?: string }) {
        super({
            name: name || name,
            type: ActorTypes.PostProcessVolume,
        });
    }
}
