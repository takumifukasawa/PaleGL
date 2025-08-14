import { createVolume, Volume } from '@/PaleGL/actors/volumes/volume.ts';
import { ActorTypes, PostProcessPassType } from '@/PaleGL/constants.ts';
import { PostProcessPassBase } from '@/PaleGL/postprocess/postProcessPassBase.ts';
import { ActorArgs } from '@/PaleGL/actors/actor.ts';

export type PostProcessVolumeParameterSet = {
    type: PostProcessPassType;
    // parameters: PostProcessPassParametersBase;
};

type PostProcessVolumeArgs = ActorArgs & {
    // parameters: PostProcessVolumeParameterSet[];
};

export type PostProcessVolume = Volume & ReturnType<typeof createPostProcessVolume>;

// TODO: 本当はpassそのものを持たせるのがよい気がするが・・・
export function createPostProcessVolume(args: PostProcessVolumeArgs) {
    const parameters: PostProcessVolumeParameterSet[] = [];

    const volume = createVolume({
        ...args,
        type: ActorTypes.PostProcessVolume,
    });

    return { ...volume, parameters };
}

export const findPostProcessParameter = <T extends PostProcessPassBase>(
    pp: PostProcessVolume,
    type: PostProcessPassType
): T | null => {
    const result = pp.parameters.find((value) => value?.type === type);
    if (!result) {
        return null;
    }
    // return result.parameters as T;
    return result as T;
};
