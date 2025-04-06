import { tryParseJsonString } from '@/Marionetter/buildMarionetterScene.ts';
import { Marionetter, MarionetterArgs, MarionetterReceiveData, MarionetterReceiveDataType } from '@/Marionetter/types';

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
}: MarionetterArgs = {}): Marionetter {
    let currentTime: number = 0;
    let onHotReloadCallback: (() => void) | null = null;

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
                case MarionetterReceiveDataType.SeekTimeline:
                    currentTime = json.currentTime;
                    if (showLog) {
                        console.log(`[marionetter] seekTimeline: ${currentTime}`);
                    }
                    onSeek?.(currentTime);
                    break;
                case MarionetterReceiveDataType.PlayTimeline:
                    currentTime = json.currentTime;
                    if (showLog) {
                        console.log(`[marionetter] playTimeline: ${currentTime}`);
                    }
                    onPlay?.(currentTime);
                    break;
                case MarionetterReceiveDataType.StopTimeline:
                    if (showLog) {
                        console.log(`[marionetter] stopTimeline`);
                    }
                    onStop?.();
                    break;
                case MarionetterReceiveDataType.ExportScene:
                    if (showLog) {
                        console.log(`[marionetter] exportScene`);
                    }
                    break;
                case MarionetterReceiveDataType.ExportHotReloadScene:
                    if (showLog) {
                        console.log(`[marionetter] hotReloadScene`);
                    }
                    onHotReloadCallback?.();
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

    return { connect, getCurrentTime, setCurrentTime, setHotReloadCallback };
}
