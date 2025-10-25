import { Marionetter, MarionetterScene } from '@/Marionetter/types';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { optimizeJsonData } from '../../plugins/json-optimizer';

export const initHotReloadAndParseScene = (
    hotReloadUrl: string,
    marionetter: Marionetter,
    // _marionetterSceneStructure: MarionetterSceneStructure,
    // captureScene: Scene,
    onHotReload: (sceneJson: MarionetterScene) => void
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
                const optimizedSceneJson = optimizeJsonData(sceneJson) as unknown as MarionetterScene;
                console.log('hot reload scene', optimizedSceneJson);
                // if (marionetterSceneStructure) {
                // console.log('hot reload: marionetterSceneStructure', marionetterSceneStructure);
                onHotReload(optimizedSceneJson);
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
