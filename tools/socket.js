import WebSocket, { WebSocketServer } from 'ws';

import 'dotenv/config';

const ws = new WebSocket(process.env.UNIVERSALIS_SOCKET_URL);

// Creating a new websocket server
const wss = new WebSocketServer({ port: 8080 });

// Creating connection using websocket
wss.on('connection', (websocket) => {
  console.log('new client connected');

  // sending message to client
  websocket.send('Welcome, you are connected!');

  // on message from client
  websocket.on('message', (data) => {
    console.log(`Client has sent us: ${data}`);
  });

  // handling what to do when clients disconnects from server
  websocket.on('close', () => {
    console.log('the client has connected');
  });
});

console.log('The WebSocket server is running on port 8080');

ws.on('close', () => console.log('Connection closed.'));

export { wss, ws };
