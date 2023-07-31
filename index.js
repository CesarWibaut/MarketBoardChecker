import { serialize } from 'bson';

import { wss, ws } from './tools/socket.js';
import processMessage from './tools/process.js';

const worlds = new Map();
worlds.set(33, 'Twintania');
worlds.set(36, 'Lich');
worlds.set(42, 'Zodiark');
worlds.set(56, 'Phoenix');
worlds.set(66, 'Odin');
worlds.set(67, 'Shiva');
worlds.set(403, 'Raiden');

ws.on('open', () => {
  worlds.forEach((value, key) => {
    ws.send(serialize({ event: 'subscribe', channel: `listings/add{world=${key}}` }));
  });
  console.log('Connection opened.');
});

ws.on('message', async (data) => {
  const result = await processMessage(data);
  if (result) {
    console.log(result);
    wss.clients.forEach((client) => {
      client.send(JSON.stringify(result));
    });
  }
});
