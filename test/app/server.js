// A tiny service for the action's own tests. BROKEN=1 renames an item in the
// list, a change a replay of the recording must catch.
const http = require('node:http');
const port = Number(process.env.PORT || 8080);
const broken = process.env.BROKEN === '1';
const items = [
  { id: 1, name: 'lamp', price: 30 },
  { id: 2, name: 'notebook', price: 4 },
];
http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === '/health') return send(200, { ok: true });
    if (url.pathname === '/items') return send(200, broken ? items.map((i) => (i.id === 1 ? { ...i, name: 'desk lamp' } : i)) : items);
    const m = url.pathname.match(/^\/items\/(\d+)$/);
    if (m) {
      const item = items.find((i) => i.id === Number(m[1]));
      if (!item) return send(404, { error: 'no such item' });
      return send(200, item);
    }
    send(404, { error: 'not found' });
  })
  .listen(port, () => console.log('listening on', port));
