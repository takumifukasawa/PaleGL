import { Volume } from '@/PaleGL/actors/Volume.ts';
import {ActorTypes, PostProcessPassType} from '@/PaleGL/constants.ts';
import {PostProcessPassParametersBase} from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { ActorArgs } from '@/PaleGL/actors/Actor.ts';

type PostProcessVolumeArgs = ActorArgs & {
    parameters: PostProcessPassParametersBase[];
};

// TODO: 本当はpassそのものを持たせるのがよい気がするが・・・
export class PostProcessVolume extends Volume {
    parameters: PostProcessPassParametersBase[];

    // passes: IPostProcessPass[] = [];
    constructor(args: PostProcessVolumeArgs) {
        super({
            ...args,
            type: ActorTypes.PostProcessVolume,
        });
        this.parameters = args.parameters || [];
    }
    
    findParameter<T>(type: PostProcessPassType): T | null {
        return this.parameters.find(p => p.type === type) as T || null;
    }
}
