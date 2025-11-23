import { Marionetter, MarionetterScene } from '@/Marionetter/types';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { optimizeJsonData } from '../../plugins/json-optimizer';
import { JSON_OPTIMIZER_DEFAULT_OPTIONS } from '../../plugins/json-optimizer-config';

export const initHotReloadAndParseScene = (
    hotReloadUrl: string,
    marionetter: Marionetter,
    // _marionetterSceneStructure: MarionetterSceneStructure,
    // captureScene: Scene,
    onHotReload: (sceneJson: MarionetterScene) => Promise<void>
) => {
    // const marionetterSceneStructure: MarionetterSceneStructure | null = _marionetterSceneStructure;
    const hotReloadScene = () => {
        if (isDevelopment()) {
            const fetchUrl = `${hotReloadUrl}?t=${+new Date()}`;
            console.log('hot reload scene...', fetchUrl);
            void fetch(fetchUrl, {
                cache: 'no-cache',
            }).then(async (res) => {
                const sceneJson = (await res.json()) as unknown as MarionetterScene;
                const optimizedSceneJson = optimizeJsonData({
                    obj: sceneJson,
                    ...JSON_OPTIMIZER_DEFAULT_OPTIONS,
                }) as unknown as MarionetterScene;
                // const optimizedSceneJson = sceneJson as unknown as MarionetterScene;
                console.log('hot reload scene', optimizedSceneJson);
                // if (marionetterSceneStructure) {
                // console.log('hot reload: marionetterSceneStructure', marionetterSceneStructure);
                await onHotReload(optimizedSceneJson);
                // }
            });
        }
    };
    marionetter.setHotReloadCallback(() => {
        hotReloadScene();
    });
    // hotReloadScene();

    // return {
    //     getMarionetterSceneStructure: () => marionetterSceneStructure,
    // };
};
