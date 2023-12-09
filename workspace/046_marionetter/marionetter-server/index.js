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
};

const clientType = {
    browser: 'browser',
};

let wsBrowserClient;

const wsServer = new WebSocketServer({ port: PORT });

console.log('begin websocket server...');

const auth = (ws, json) => {
    // is browser
    if (!!json.clientType && json.clientType === clientType.browser) {
        console.log('connect with browser');
        wsBrowserClient = ws;
    }
};

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

wsServer.on('connection', (ws) => {
    console.log('server: connected');
    ws.send('server -> client: connected');

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
            default:
                console.error(`invalid message type: ${json.type}`);
        }
    });
});
