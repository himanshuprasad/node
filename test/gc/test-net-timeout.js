// just like test/gc/http-client-timeout.js,
// but using a net server/client instead

function serverHandler(sock) {
  sock.setTimeout(120000);
  setTimeout(function () {
    sock.end('hello\n');
  }, 100);
}

var net  = require('net'),
    weak    = require('weak'),
    done    = 0,
    count   = 0,
    countGC = 0,
    todo    = 18,
    common = require('../common.js'),
    assert = require('assert'),
    PORT = common.PORT;

console.log('We should do '+ todo +' requests');

var server = net.createServer(serverHandler);
server.listen(PORT, getall);

function getall() {
  for (var i = 0; i < todo; i++) {
    (function(){
      var req = net.connect(PORT, '127.0.0.1');
      req.setTimeout(10, function() {
        console.log('timeout (expected)')
        req.destroy();
        done++;
        statusLater();
      });

      count++;
      weak(req, afterGC);
    })()
  }
}

function afterGC(){
  countGC ++;
}

function statusLater() {
  setTimeout(status, 1);
}

function status() {
  gc();
  console.log('Done: %d/%d', done, todo);
  console.log('Collected: %d/%d', countGC, count);
  if (done === todo) {
    console.log('All should be collected now.');
    assert(count === countGC);
    process.exit(0);
  }
}
