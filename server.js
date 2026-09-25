const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
app.get('/', (req, res) => res.json({ name: 'Durak Relay', ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const peers = new Map();

wss.on('connection', ws => {
  let myId = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'reg') {
      const old = peers.get(m.id);
      if (old && old !== ws) { try { old.terminate(); } catch (e) {} }
      myId = m.id; peers.set(m.id, ws); ws.send(JSON.stringify({ type: 'regok', id: myId }));
    } else if (m.type === 'route') {
      const t = peers.get(m.to);
      if (t && t.readyState === 1) t.send(JSON.stringify({ type: 'msg', from: myId, payload: m.payload }));
      else ws.send(JSON.stringify({ type: 'routeerr', to: m.to }));
    }
  });
  ws.on('close', () => { if (myId && peers.get(myId) === ws) peers.delete(myId); });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log('Durak relay on ' + PORT));
