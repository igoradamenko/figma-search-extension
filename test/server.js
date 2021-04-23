const fs = require('fs');
const path = require('path');
const http = require('http');

const startServer = () => new Promise(resolve => {
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

  server.listen(8080, () => resolve(server));
  console.log('http://localhost:8080');
})

if (module === require.main) {
  startServer();
}

module.exports = startServer;
