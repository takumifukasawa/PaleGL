import {createTimeSkipper} from '@/PaleGL/utilities/timeSkipper.ts';
import { ActorTypes } from '@/PaleGL/constants';
import {createStats, Stats} from '@/PaleGL/utilities/stats.ts';
import { GPU } from '@/PaleGL/core/GPU';
import { Scene } from '@/PaleGL/core/scene.ts';
import { Renderer } from '@/PaleGL/core/Renderer';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { createSharedTextures, SharedTextures } from '@/PaleGL/core/createSharedTextures.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';
import {createTimeAccumulator} from "@/PaleGL/utilities/timeAccumulator.ts";

type EngineOnStartCallbackArgs = void;

type EngineOnBeforeFixedUpdateCallbackArgs = {
    fixedTime: number;
    fixedDeltaTime: number;
};

type EngineOnBeforeUpdateCallbackArgs = {
    time: number;
    deltaTime: number;
};

type EngineOnLastUpdateCallbackArgs = {
    time: number;
    deltaTime: number;
};

export type EngineOnBeforeStartCallback = () => void;
export type EngineOnStartCallback = (args: EngineOnStartCallbackArgs) => void;
export type EngineOnAfterStartCallback = () => void;
export type EngineOnBeforeFixedUpdateCallback = (args: EngineOnBeforeFixedUpdateCallbackArgs) => void;
export type EngineOnBeforeUpdateCallback = (args: EngineOnBeforeUpdateCallbackArgs) => void;
export type EngineOnLastUpdateCallback = (args: EngineOnLastUpdateCallbackArgs) => void;

export type EngineOnRenderCallback = (time: number, deltaTime: number) => void;

// export class Engine {
//     _gpu: GPU;
//     _stats: Stats | null = null;
//     _renderer: Renderer;
//     _scene: Scene | null = null;
//     // _scenes: Scene[] = [];
//     // timers
//     _fixedUpdateFrameTimer: TimeAccumulator;
//     _updateFrameTimer: TimeSkipper;
//     // callbacks
//     _onBeforeStart: EngineOnBeforeStartCallback | null = null;
//     _onAfterStart: EngineOnAfterStartCallback | null = null;
//     _onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null = null;
//     _onBeforeUpdate: EngineOnBeforeUpdateCallback | null = null;
//     _onLastUpdate: EngineOnLastUpdateCallback | null = null;
//     _onRender: EngineOnRenderCallback | null = null;
//     _sharedTextures: SharedTextures;
// 
//     get renderer() {
//         return _renderer;
//     }
// 
//     get sharedTextures() {
//         return _sharedTexturess;
//     }
// 
//     set onBeforeStart(cb: EngineOnBeforeStartCallback) {
//         _onBeforeStart = cb;
//     }
// 
//     set onAfterStart(cb: EngineOnAfterStartCallback) {
//         _onAfterStart = cb;
//     }
// 
//     set onBeforeUpdate(cb: EngineOnBeforeUpdateCallback) {
//         _onBeforeUpdate = cb;
//     }
// 
//     set onBeforeFixedUpdate(cb: EngineOnBeforeFixedUpdateCallback) {
//         _onBeforeFixedUpdate = cb;
//     }
// 
//     set onRender(cb: EngineOnRenderCallback) {
//         _onRender = cb;
//     }
// 
//     /**
//      *
//      * @param gpu
//      * @param renderer
//      * @param onBeforeFixedUpdate
//      * @param onBeforeUpdate
//      * @param onRender
//      * @param showStats
//      */
//     constructor({
//         gpu,
//         renderer,
//         fixedUpdateFps = 60,
//         updateFps = 60,
//         onBeforeFixedUpdate,
//         onBeforeUpdate,
//         onRender,
//         showStats = false,
//     }: {
//         gpu: GPU;
//         renderer: Renderer;
//         fixedUpdateFps?: number;
//         updateFps?: number;
//         // renderFps?: number;
//         onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback;
//         onBeforeUpdate?: EngineOnBeforeUpdateCallback;
//         onRender?: EngineOnRenderCallback;
//         showStats?: boolean;
//     }) {
//         _gpu = gpu;
//         _renderer = renderer;
// 
//         _stats = new Stats({ showStats, showPipeline: false }); // 一旦手動で
//         _renderer.setStats(_stats);
// 
//         // TODO: 外からfps変えられるようにしたい
//         _fixedUpdateFrameTimer = new TimeAccumulator(fixedUpdateFps, fixedUpdate.bind(this));
//         _updateFrameTimer = new TimeSkipper(updateFps, update.bind(this));
// 
//         _onBeforeFixedUpdate = onBeforeFixedUpdate || null;
//         _onBeforeUpdate = onBeforeUpdate || null;
//         _onRender = onRender || null;
// 
//         _sharedTexturess = createSharedTextures({ gpu, renderer });
//     }
// 
//     /**
//      *
//      * @param scene
//      */
//     setScene(scene: Scene) {
//         _scene = scene;
//         // _scenes.push(scene);
//     }
// 
//     /**
//      *
//      */
//     start() {
//         if (_onBeforeStart) {
//             _onBeforeStart();
//         }
//         const t = performance.now() / 1000;
//         _fixedUpdateFrameTimer.$start(t);
//         _updateFrameTimer.$start(t);
//         if (_onAfterStart) {
//             _onAfterStart();
//         }
//     }
// 
//     /**
//      *
//      * @param width
//      * @param height
//      */
//     setSize(width: number, height: number) {
//         const rw = width * _renderer.pixelRatio;
//         const rh = height * _renderer.pixelRatio;
//         const w = Math.floor(rw);
//         const h = Math.floor(rh);
//         _scene?.traverse((actor) => {
//             actor.setSize(w, h);
//         });
//         // _scenes.forEach((scene) => {
//         //     scene.traverse((actor) => actor.setSize(w, h));
//         // });
//         // _renderer.setSize(w, h, rw, rh);
//         _renderer.setSize(rw, rh);
//     }
// 
//     /**
//      *
//      * @param fixedTime
//      * @param fixedDeltaTime
//      */
//     fixedUpdate(fixedTime: number, fixedDeltaTime: number) {
//         if (_onBeforeFixedUpdate) {
//             _onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
//         }
// 
//         _scene?.traverse((actor) =>
//             actor.fixedUpdate({
//                 gpu: _gpu,
//                 scene: _scene!,
//                 fixedTime,
//                 fixedDeltaTime,
//             })
//         );
//         // _scenes.forEach((scene) => {
//         //     scene.traverse((actor) => actor.fixedUpdate({ gpu: _gpu, fixedTime, fixedDeltaTime }));
//         // });
// 
//         // update all actors matrix
//         // TODO
//         // - scene 側でやった方がよい？
//         // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
//         // - やっぱりcomponentシステムにした方が良い気もする
//         _scene?.traverse((actor) => {
//             actor.$updateTransform();
//         });
//         // _scenes.forEach((scene) => {
//         //     scene.traverse((actor) => actor.updateTransform());
//         // });
//     }
// 
//     /**
//      *
//      * @param time
//      * @param deltaTime
//      */
//     update(time: number, deltaTime: number) {
//         //
//         // before update
//         //
// 
//         if (_onBeforeUpdate) {
//             _onBeforeUpdate({ time, deltaTime });
//         }
// 
//         //
//         // update and before render
//         //
// 
//         // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
//         _scene?.traverse((actor) => {
//             actor.update({ gpu: _gpu, scene: _scene!, time, deltaTime });
//             switch (actor.type) {
//                 case ActorTypes.Skybox:
//                 case ActorTypes.Mesh:
//                 case ActorTypes.SkinnedMesh:
//                     actor.beforeRender({ gpu: _gpu });
//                     const mesh = actor as Mesh;
//                     mesh.materials.forEach((mat) => {
//                         _renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
//                     });
//                     mesh.depthMaterials.forEach((mat) => {
//                         _renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
//                     });
//                     break;
//                 default:
//                     break;
//             }
//         });
// 
//         //
//         // last update
//         //
// 
//         if (_onLastUpdate) {
//             _onLastUpdate({ time, deltaTime });
//         }
//         _scene?.traverse((actor) => {
//             actor.lastUpdate({ gpu: _gpu, scene: _scene!, time, deltaTime });
//         });
// 
//         //
//         // update transform
//         //
// 
//         _scene?.traverse((actor) => {
//             actor.$updateTransform();
//         });
// 
//         //
//         // render
//         //
// 
//         render(time, deltaTime);
//     }
// 
//     /**
//      *
//      * @param time
//      * @param deltaTime
//      */
//     lastUpdate(time: number, deltaTime: number) {
//         _scene?.traverse((actor) => actor.lastUpdate({ gpu: _gpu, scene: _scene!, time, deltaTime }));
//     }
// 
//     /**
//      *
//      * @param time[sec]
//      * @param deltaTime[sec]
//      */
//     render(time: number, deltaTime: number) {
//         // for debug
//         // console.log(`[Engine.render]`);
// 
//         _stats?.clear();
// 
//         _renderer.beforeRender(time, deltaTime);
// 
//         // update and render shared textures
//         Object.values(_sharedTexturess).forEach((obj) => {
//             obj.update(time);
//             obj.render();
//         });
// 
//         if (_onRender) {
//             _onRender(time, deltaTime);
//         }
// 
//         // TODO: ここにrenderer.renderを書く
//         // _renderer.renderScene(_scene!);
// 
//         _stats?.update(time);
//     }
// 
//     warmRender() {
//         // for debug
//         // console.log(`[Engine.warmRender]`);
// 
//         // 描画させたいので全部中央に置いちゃう
//         const tmpTransformPair: { actor: Actor; p: Vector3; r: Rotator }[] = [];
//         _scene?.traverse((actor) => {
//             const tmpP = actor.transform.getPosition().clone();
//             const tmpR = actor.transform.getRotation().clone();
//             // TODO: mainカメラだけ抽出したい
//             if (actor.type === ActorTypes.Camera) {
//                 actor.transform.setPosition(new Vector3(0, 0, 10));
//                 actor.transform.setRotation(Rotator.fromQuaternion(Quaternion.fromEulerDegrees(0, 180, 0)));
//             } else {
//                 actor.transform.setPosition(Vector3.zero);
//             }
//             tmpTransformPair.push({ actor, p: tmpP, r: tmpR });
//         });
// 
//         fixedUpdate(0, 0);
//         update(0, 0);
// 
//         tmpTransformPair.forEach((pair) => {
//             pair.actor.transform.setPosition(pair.p);
//             pair.actor.transform.setRotation(pair.r);
//         });
//     }
// 
//     // time[sec]
//     run(time: number) {
//         _fixedUpdateFrameTimer.$exec(time / 1000);
//         _updateFrameTimer.$exec(time / 1000);
//     }
// }

export type Engine = ReturnType<typeof createEngine>;

export function createEngine(
    {
        gpu,
        renderer,
        fixedUpdateFps = 60,
        updateFps = 60,
        onBeforeFixedUpdate,
        onBeforeUpdate,
        onRender,
        showStats = false,
    }: {
        gpu: GPU;
        renderer: Renderer;
        fixedUpdateFps?: number;
        updateFps?: number;
        // renderFps?: number;
        onBeforeFixedUpdate?: EngineOnBeforeFixedUpdateCallback;
        onBeforeUpdate?: EngineOnBeforeUpdateCallback;
        onRender?: EngineOnRenderCallback;
        showStats?: boolean;
    }) {
    
    const _gpu: GPU = gpu;
    const _stats: Stats | null = createStats({ showStats, showPipeline: false });
    const _renderer: Renderer = renderer;
    let _scene: Scene | null = null;
    // _scenes: Scene[] = [];
    // timers
    const _fixedUpdateFrameTimer = createTimeAccumulator(fixedUpdateFps, fixedUpdate);
    const _updateFrameTimer = createTimeSkipper(updateFps, update);
    // callbacks
    let _onBeforeStart: EngineOnBeforeStartCallback | null = null;
    let _onAfterStart: EngineOnAfterStartCallback | null = null;
    let _onBeforeFixedUpdate: EngineOnBeforeFixedUpdateCallback | null  = onBeforeFixedUpdate || null;
    let _onBeforeUpdate: EngineOnBeforeUpdateCallback | null =onBeforeUpdate || null;
    let _onLastUpdate: EngineOnLastUpdateCallback | null = null;
    let _onRender: EngineOnRenderCallback | null = onRender || null;
    const _sharedTextures: SharedTextures = createSharedTextures({ gpu, renderer });
    
    _renderer.setStats(_stats);

    const start = () => {
        if (_onBeforeStart) {
            _onBeforeStart();
        }
        const t = performance.now() / 1000;
        _fixedUpdateFrameTimer.start(t);
        _updateFrameTimer.start(t);
        if (_onAfterStart) {
            _onAfterStart();
        }
    }

    const setSize = (width: number, height: number) => {
        const rw = width * _renderer.pixelRatio;
        const rh = height * _renderer.pixelRatio;
        const w = Math.floor(rw);
        const h = Math.floor(rh);
        _scene?.traverse((actor) => {
            actor.setSize(w, h);
        });
        // _scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.setSize(w, h));
        // });
        // _renderer.setSize(w, h, rw, rh);
        _renderer.setSize(rw, rh);
    }

    function fixedUpdate (fixedTime: number, fixedDeltaTime: number) {
        if (_onBeforeFixedUpdate) {
            _onBeforeFixedUpdate({ fixedTime, fixedDeltaTime });
        }

        _scene?.traverse((actor) =>
            actor.fixedUpdate({
                gpu: _gpu,
                scene: _scene!,
                fixedTime,
                fixedDeltaTime,
            })
        );
        // _scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.fixedUpdate({ gpu: _gpu, fixedTime, fixedDeltaTime }));
        // });

        // update all actors matrix
        // TODO
        // - scene 側でやった方がよい？
        // - skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
        // - やっぱりcomponentシステムにした方が良い気もする
        _scene?.traverse((actor) => {
            actor.$updateTransform();
        });
        // _scenes.forEach((scene) => {
        //     scene.traverse((actor) => actor.updateTransform());
        // });
    }

    function update (time: number, deltaTime: number) {
        //
        // before update
        //

        if (_onBeforeUpdate) {
            _onBeforeUpdate({ time, deltaTime });
        }

        //
        // update and before render
        //

        // 本当はあんまりgpu渡したくないけど、渡しちゃったほうがいろいろと楽
        _scene?.traverse((actor) => {
            actor.update({ gpu: _gpu, scene: _scene!, time, deltaTime });
            switch (actor.type) {
                case ActorTypes.Skybox:
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    actor.beforeRender({ gpu: _gpu });
                    const mesh = actor as Mesh;
                    mesh.materials.forEach((mat) => {
                        _renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
                    });
                    mesh.depthMaterials.forEach((mat) => {
                        _renderer.$checkNeedsBindUniformBufferObjectToMaterial(mat);
                    });
                    break;
                default:
                    break;
            }
        });

        //
        // last update
        //

        if (_onLastUpdate) {
            _onLastUpdate({ time, deltaTime });
        }
        _scene?.traverse((actor) => {
            actor.lastUpdate({ gpu: _gpu, scene: _scene!, time, deltaTime });
        });

        //
        // update transform
        //

        _scene?.traverse((actor) => {
            actor.$updateTransform();
        });

        //
        // render
        //

        render(time, deltaTime);
    }


    const lastUpdate = (time: number, deltaTime: number) => {
        _scene?.traverse((actor) => actor.lastUpdate({ gpu: _gpu, scene: _scene!, time, deltaTime }));
    }


    const render = (time: number, deltaTime: number) => {
        // for debug
        // console.log(`[Engine.render]`);

        _stats?.clear();

        _renderer.beforeRender(time, deltaTime);

        // update and render shared textures
        Object.values(_sharedTextures).forEach((obj) => {
            obj.update(time);
            obj.render();
        });

        if (_onRender) {
            _onRender(time, deltaTime);
        }

        // TODO: ここにrenderer.renderを書く
        // _renderer.renderScene(_scene!);

        _stats?.update(time);
    }

    const warmRender = () => {
        // for debug
        // console.log(`[Engine.warmRender]`);

        // 描画させたいので全部中央に置いちゃう
        const tmpTransformPair: { actor: Actor; p: Vector3; r: Rotator }[] = [];
        _scene?.traverse((actor) => {
            const tmpP = actor.transform.getPosition().clone();
            const tmpR = actor.transform.getRotation().clone();
            // TODO: mainカメラだけ抽出したい
            if (actor.type === ActorTypes.Camera) {
                actor.transform.setPosition(new Vector3(0, 0, 10));
                actor.transform.setRotation(Rotator.fromQuaternion(Quaternion.fromEulerDegrees(0, 180, 0)));
            } else {
                actor.transform.setPosition(Vector3.zero);
            }
            tmpTransformPair.push({ actor, p: tmpP, r: tmpR });
        });

        fixedUpdate(0, 0);
        update(0, 0);

        tmpTransformPair.forEach((pair) => {
            pair.actor.transform.setPosition(pair.p);
            pair.actor.transform.setRotation(pair.r);
        });
    }

    // time[sec]
    const run = (time: number) => {
        _fixedUpdateFrameTimer.exec(time / 1000);
        _updateFrameTimer.exec(time / 1000);
    }


    return {
        getRenderer: () => _renderer,
        getSharedTextures: () => _sharedTextures,
        setOnBeforeStart: (cb: EngineOnBeforeStartCallback)=> (_onBeforeStart = cb),
        setOnAfterStart: (cb: EngineOnAfterStartCallback) => (_onAfterStart = cb),
        setOnBeforeUpdate: (cb: EngineOnBeforeUpdateCallback) => (_onBeforeUpdate = cb),
        setOnBeforeFixedUpdate: (cb: EngineOnBeforeFixedUpdateCallback) => (_onBeforeFixedUpdate = cb),
        setOnLastUpdate: (cb: EngineOnLastUpdateCallback) => (_onLastUpdate = cb),
        setOnRender: (cb: EngineOnRenderCallback) => (_onRender = cb),
        setScene: (scene: Scene) => (_scene = scene),
        start,
        setSize,
        fixedUpdate,
        update,
        lastUpdate,
        render,
        warmRender,
        run
    }
}
