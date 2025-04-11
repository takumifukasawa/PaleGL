import { Marionetter, MarionetterScene, MarionetterSceneStructure } from '@/Marionetter/types';
import { buildMarionetterTimelineFromScene } from '@/Marionetter/buildMarionetterScene.ts';
import { Scene } from '@/PaleGL/core/scene.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';

export const initHotReloadAndParseScene = (
    marionetter: Marionetter,
    _marionetterSceneStructure: MarionetterSceneStructure,
    captureScene: Scene,
    onHotReload: (structure: MarionetterSceneStructure) => void
) => {
    const marionetterSceneStructure: MarionetterSceneStructure | null = _marionetterSceneStructure;
    const hotReloadScene = () => {
        if (isDevelopment()) {
            console.log('hot reload scene...');
            void fetch('./assets/data/scene-hot-reload.json').then(async (res) => {
                const sceneJson = (await res.json()) as unknown as MarionetterScene;
                console.log('hot reload: scene', sceneJson);
                if (marionetterSceneStructure) {
                    console.log('hot reload: marionetterSceneStructure', marionetterSceneStructure);
                    marionetterSceneStructure.marionetterTimeline = buildMarionetterTimelineFromScene(
                        sceneJson,
                        marionetterSceneStructure.actors
                    );
                    marionetterSceneStructure.marionetterTimeline?.bindActors(captureScene.children);
                    onHotReload(marionetterSceneStructure);
                }
            });
        }
    };
    marionetter.setHotReloadCallback(() => {
        hotReloadScene();
    });
    // hotReloadScene();

    return {
        getMarionetterSceneStructure: () => marionetterSceneStructure,
    };
};
