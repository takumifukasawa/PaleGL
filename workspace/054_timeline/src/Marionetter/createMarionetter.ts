import {tryParseJsonString} from "@/Marionetter/buildMarionetterScene.ts";
import {Marionetter, MarionetterArgs, MarionetterReceiveData, MarionetterReceiveDataType} from "@/Marionetter/types";

/**
 * 
 * @param port
 * @param showLog
 */
export function createMarionetter({ port = 8080, showLog = false}: MarionetterArgs = {}): Marionetter {
    let currentTime: number = 0;
    let onHotReloadCallback: (() => void) | null = null;

    const url = `ws://localhost:${port}`;
    let socket: WebSocket | null = null;

    const getCurrentTime = () => {
        return currentTime;
    };

    const connect = () => {
        socket = new WebSocket(url);
        socket.addEventListener('open', () => {
            console.log(`[Marionetter] on open: ${url}`);
            const authData = {
                type: 'auth',
                clientType: 'browser',
            };
            socket?.send(JSON.stringify(authData));
        });

        socket.addEventListener('close', () => {
            console.log(`[Marionetter] on close: ${url}`);
        });

        socket.addEventListener('message', (event) => {
            if (!event.data) {
                return;
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
                        console.log(`[Marionetter] seekTimeline: ${currentTime}`);
                    }
                    break;
                case MarionetterReceiveDataType.ExportScene:
                    if (showLog) {
                        console.log(`[Marionetter] exportScene`);
                    }
                    break;
                case MarionetterReceiveDataType.ExportHotReloadScene:
                    if (showLog) {
                        console.log(`[Marionetter] hotReloadScene`);
                    }
                    onHotReloadCallback?.();
                    break;
                default:
                    console.warn('invalid type', json.type);
                    break;
            }
        });

        window.addEventListener('beforeunload', () => {
            console.log(`[Marionetter] beforeunload: ${url}`);
            if (socket?.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
        });
    };

    const setHotReloadCallback = (callback: () => void) => {
        onHotReloadCallback = callback;
    };

    return { connect, getCurrentTime, setHotReloadCallback };
}
