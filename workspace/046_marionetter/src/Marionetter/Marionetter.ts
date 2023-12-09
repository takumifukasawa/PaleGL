import { tryParseJsonString } from '@/utilities/jsonUtilities';

const MarionetterReceiveDataType = {
    SeekTimeline: 'seekTimeline',
    ExportScene: 'exportScene',
} as const;

type MarionetterReceiveDataType = (typeof MarionetterReceiveDataType)[keyof typeof MarionetterReceiveDataType];

type MarionetterReceiveData = {
    type: 'seekTimeline' | 'exportScene';
    currentTime: number;
};

export class Marionetter {
    currentTime: number = 0;

    constructor(port: number) {
        const url = `ws://localhost:${port}`;
        const socket = new WebSocket(url);
        socket.addEventListener('open', () => {
            console.log(`[Marionetter] on open: ${url}`);
            const authData = {
                type: 'auth',
                clientType: 'browser',
            };
            socket.send(JSON.stringify(authData));
        });
        socket.addEventListener('close', () => {
            console.log(`[Marionetter] on close: ${url}`);
        });
        window.addEventListener('beforeunload', () => {
            console.log(`[Marionetter] beforeunload: ${url}`);
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
        });
        socket.addEventListener('message', (event) => {
            if (!event.data) {
                return;
            }

            if (typeof event.data === 'string') {
                return;
            }

            const json = tryParseJsonString<MarionetterReceiveData>(event.data as string);

            if (!json || !json.type) {
                return;
            }

            switch (json.type) {
                case MarionetterReceiveDataType.SeekTimeline:
                    this.currentTime = json.currentTime;
                    console.log(`[Marionetter] seekTimeline: ${this.currentTime}`);
                    break;
                case MarionetterReceiveDataType.ExportScene:
                    console.log(`[Marionetter] exportScene`);
                    break;
            }
        });
    }
}
