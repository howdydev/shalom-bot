import http from "http";

http
  .createServer(function (req, res) {
    res.write("I'm alive!");
    res.end();
  })
  .listen(10000);
