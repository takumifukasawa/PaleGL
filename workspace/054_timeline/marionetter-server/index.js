import { WebSocketServer } from 'ws';

// --------------------------------------------------------------
// option:
// --log: log enabled
// --------------------------------------------------------------

const logEnabled = !!process.argv[2] && '--log';

const PORT = 8080;

const messageType = {
    auth: 'auth',
    seekTimeline: 'seekTimeline',
    exportScene: 'exportScene',
    exportHotReloadScene: 'exportHotReloadScene',
};

const clientType = {
    browser: 'browser',
};

const wsServer = new WebSocketServer({ port: PORT });

let wsBrowserClient;

console.log(`begin websocket server... port: ${PORT}`);

/**
 * 
 * @param ws
 * @param json
 */
const auth = (ws, json) => {
    // is browser
    if (!!json.clientType && json.clientType === clientType.browser) {
        console.log('connect with browser');
        wsBrowserClient = ws;
    }
};

/**
 * 
 * @param json
 */
const seekTimeline = (json) => {
    if (!wsBrowserClient) {
        return;
    }
    // console.log(json);
    const newData = {
        type: messageType.seekTimeline,
        currentTime: json.currentTime,
    };
    if (logEnabled) {
        console.log(`send to browser data: ${newData}`);
    }
    wsBrowserClient.send(JSON.stringify(newData));
};

/**
 * 
 * @param json
 */
const exportScene = (json) => {
    if (!wsBrowserClient) {
        return;
    }
    // console.log(json);
    const newData = {
        type: messageType.exportScene,
    };
    if (logEnabled) {
        console.log(`send to browser data: ${newData}`);
    }
    wsBrowserClient.send(JSON.stringify(newData));
};

/**
 * 
 * @param json
 */
const exportHotReloadScene = (json) => {
    if (!wsBrowserClient) {
        return;
    }
    // console.log(json);
    const newData = {
        type: messageType.exportHotReloadScene,
    };
    if (logEnabled) {
        console.log(`send to browser data: ${newData}`);
    }
    wsBrowserClient.send(JSON.stringify(newData));
};

wsServer.on('connection', (ws) => {
    console.log('server: connected');

    ws.on('error', (e) => {
        console.error(e);
    });

    ws.on('close', (code, reason) => {
        console.log(`close - code: ${code}, reason: ${reason}`);
        if (wsBrowserClient === ws) {
            console.log('disconnect with browser');
            wsBrowserClient = null;
        }
    });

    ws.on('message', (data) => {
        if (logEnabled) {
            console.log('received');
            console.log(data.toString());
        }

        const json = JSON.parse(data.toString());

        if (!json.type) {
            return;
        }

        switch (json.type) {
            case messageType.auth:
                auth(ws, json);
                break;
            case messageType.seekTimeline:
                seekTimeline(json);
                break;
            case messageType.exportScene:
                exportScene(json);
                break;
            case messageType.exportHotReloadScene:
                exportHotReloadScene(json);
                break;
            default:
                console.error(`invalid message type: ${json.type}`);
        }
    });
});
