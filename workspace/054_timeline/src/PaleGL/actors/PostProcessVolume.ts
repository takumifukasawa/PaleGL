import { Volume } from '@/PaleGL/actors/Volume.ts';
import { ActorTypes, PostProcessPassType } from '@/PaleGL/constants.ts';
import { PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBase.ts';
import { ActorArgs } from '@/PaleGL/actors/Actor.ts';

export type PostProcessVolumeParameterSet = {
    type: PostProcessPassType;
    parameters: PostProcessPassParametersBase;
};

type PostProcessVolumeArgs = ActorArgs & {
    parameters: PostProcessVolumeParameterSet[];
};

// TODO: 本当はpassそのものを持たせるのがよい気がするが・・・
export class PostProcessVolume extends Volume {
    parameters: PostProcessVolumeParameterSet[] = [];

    // passes: IPostProcessPass[] = [];
    constructor(args: PostProcessVolumeArgs) {
        super({
            ...args,
            type: ActorTypes.PostProcessVolume,
        });
        this.parameters = args.parameters || [];
    }

    findParameter<T extends PostProcessPassParametersBase>(type: PostProcessPassType): T | null {
        const result = this.parameters.find((value) => value?.type === type);
        if (!result) {
            return null;
        }
        return result.parameters as T;
    }

    // setParameter<T>(type: PostProcessPassType, parameter: PostProcessPassBase) {
    // }

    // updateParameter<T extends PostProcessPassParametersBase>(type: PostProcessPassType, newParameter: T): void {
    //     const targetParameter = this.findParameter(type);
    //     targetParameter?.update?.(newParameter);
    // }
}
