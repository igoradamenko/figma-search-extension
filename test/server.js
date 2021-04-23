const fs = require('fs');
const path = require('path');
const http = require('http');

const startServer = (port = 8080) => new Promise(resolve => {
  let server = http.createServer((req, res) => {
    fs.readFile(path.resolve(__dirname, '..', `./${req.url}`), (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  });

  process.on('exit', () => server.close());

  server.listen(port, () => resolve(server));
  console.log(`Starting server on http://localhost:${port}\n`);
})

if (module === require.main) {
  startServer();
}

module.exports = startServer;
