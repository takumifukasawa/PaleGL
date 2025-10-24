import { tryParseJsonString } from '@/Marionetter/buildMarionetterScene.ts';
import {
    Marionetter,
    MarionetterArgs,
    MarionetterReceiveData,
    MarionetterReceiveSceneViewData,
    MarionetterReceiveSceneViewEnabledData,
    MarionetterReceiveTimeData,
    MARIONETTER_RECEIVE_DATA_TYPE_SEEK_TIMELINE,
    MARIONETTER_RECEIVE_DATA_TYPE_PLAY_TIMELINE,
    MARIONETTER_RECEIVE_DATA_TYPE_STOP_TIMELINE,
    MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_SCENE,
    MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_HOT_RELOAD_SCENE,
    MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_DATA,
    MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_ENABLED,
    MARIONETTER_RECEIVE_DATA_TYPE_BEGIN_PLAYER,
    MARIONETTER_RECEIVE_DATA_TYPE_RELOAD,
} from '@/Marionetter/types';

/**
 *
 * @param port
 * @param showLog
 */
export function createMarionetter({
    port = 8080,
    showLog = false,
    onSeek,
    onPlay,
    onStop,
    // onHotReload,
    onSetSceneViewData,
    onSceneViewEnabled,
    onBeginPlayer,
}: MarionetterArgs = {}): Marionetter {
    let currentTime: number = 0;
    let onHotReloadCallback: (() => void) | null = null;
    // let onSetSceneViewDataCallback: ((data: MarionetterReceiveSceneViewData) => void) | null = null;
    // let onSceneViewEnabledCallback: ((data: MarionetterReceiveSceneViewEnabledData) => void) | null = null;

    const getCurrentTime = () => {
        return currentTime;
    };

    const setCurrentTime = (time: number) => {
        currentTime = time;
    };

    const connect = () => {
        const url = `ws://localhost:${port}`;
        let socket: WebSocket | null = null;

        socket = new WebSocket(url);
        socket.addEventListener('open', () => {
            console.log(`[marionetter] on open: ${url}`);
            const authData = {
                type: 'auth',
                clientType: 'browser',
            };
            socket?.send(JSON.stringify(authData));
        });

        socket.addEventListener('close', () => {
            console.log(`[marionetter] on close: ${url}`);
        });

        socket.addEventListener('message', (event) => {
            if (!event.data) {
                return;
            }

            if (showLog) {
                console.log(`[marionetter] type: ${event.type}, data: ${event.data}`);
            }

            // if (typeof event.data === 'string') {
            //     return;
            // }

            const json = tryParseJsonString<MarionetterReceiveData>(event.data as string);

            if (!json || !json.type) {
                return;
            }

            switch (json.type) {
                case MARIONETTER_RECEIVE_DATA_TYPE_SEEK_TIMELINE:
                    currentTime = (json as MarionetterReceiveTimeData).currentTime;
                    if (showLog) {
                        console.log(`[marionetter] seekTimeline: ${currentTime}`);
                    }
                    onSeek?.(currentTime);
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_PLAY_TIMELINE:
                    currentTime = (json as MarionetterReceiveTimeData).currentTime;
                    if (showLog) {
                        console.log(`[marionetter] playTimeline: ${currentTime}`);
                    }
                    onPlay?.(currentTime);
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_STOP_TIMELINE:
                    if (showLog) {
                        console.log(`[marionetter] stopTimeline`);
                    }
                    onStop?.();
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_SCENE:
                    if (showLog) {
                        console.log(`[marionetter] exportScene`);
                    }
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_EXPORT_HOT_RELOAD_SCENE:
                    if (showLog) {
                        console.log(`[marionetter] hotReloadScene`);
                    }
                    onHotReloadCallback?.();
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_DATA:
                    const sceneViewData = json as MarionetterReceiveSceneViewData;
                    if (showLog) {
                        console.log(`[marionetter] viewScene`);
                    }
                    onSetSceneViewData?.(sceneViewData);
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_SET_SCENE_VIEW_ENABLED:
                    const sceneViewEnabledData = json as MarionetterReceiveSceneViewEnabledData;
                    if (showLog) {
                        console.log(`[marionetter] setSceneViewEnabled: ${sceneViewEnabledData.enabled}`);
                    }
                    onSceneViewEnabled?.(sceneViewEnabledData);
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_BEGIN_PLAYER:
                    if (showLog) {
                        console.log(`[marionetter] beginPlayer`);
                    }
                    onBeginPlayer?.();
                    onPlay?.(0);
                    break;
                case MARIONETTER_RECEIVE_DATA_TYPE_RELOAD:
                    if (showLog) {
                        console.log(`[marionetter] reload`);
                    }
                    window.location.reload();
                    break;
                default:
                    console.warn('invalid type', json.type);
                    break;
            }
        });

        window.addEventListener('beforeunload', () => {
            console.log(`[marionetter] beforeunload: ${url}`);
            if (socket?.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
        });
    };

    const setHotReloadCallback = (callback: () => void) => {
        onHotReloadCallback = callback;
    };

    // const setSceneViewDataCallback = (callback: (data: MarionetterReceiveSceneViewData) => void) => {
    //     onSetSceneViewDataCallback = callback;
    // };

    // const setSceneViewEnabledCallback = (callback: (data: MarionetterReceiveSceneViewEnabledData) => void) => {
    //     onSceneViewEnabledCallback = callback;
    // };

    return {
        connect,
        getCurrentTime,
        setCurrentTime,
        setHotReloadCallback,
        // setSceneViewDataCallback,
        // setSceneViewEnabledCallback,
    };
}
