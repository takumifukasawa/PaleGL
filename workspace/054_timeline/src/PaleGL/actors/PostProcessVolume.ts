import { Volume } from '@/PaleGL/actors/Volume.ts';
import { ActorTypes, PostProcessPassType } from '@/PaleGL/constants.ts';
import { PostProcessPassBase, PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { ActorArgs } from '@/PaleGL/actors/Actor.ts';

type PostProcessVolumeParameterSet = { type: PostProcessPassType; parameter: PostProcessPassParametersBase };

type PostProcessVolumeArgs = ActorArgs & {
    parameters: PostProcessVolumeParameterSet[];
};

// TODO: 本当はpassそのものを持たせるのがよい気がするが・・・
export class PostProcessVolume extends Volume {
    parameters: (PostProcessVolumeParameterSet | null)[];

    // passes: IPostProcessPass[] = [];
    constructor(args: PostProcessVolumeArgs) {
        super({
            ...args,
            type: ActorTypes.PostProcessVolume,
        });
        this.parameters = args.parameters || [];
    }

    findParameter<T>(type: PostProcessPassType): T | null {
        return (this.parameters.find((value) => value?.type === type) as T) || null;
    }

    setParameter<T>(type: PostProcessPassType, parameter: PostProcessPassBase) {
        
    }

    // updateParameter<T>(type: PostProcessPassType): void {
    //     const parameter = this.findParameter<T>(type);
    //     if (parameter) {
    //         parameter.update();
    //     }
    // }
}
