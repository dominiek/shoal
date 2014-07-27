
var connect = require('connect');
var http = require('http');
var defaultPort = 54047;

var Server = function() {
  this._app = connect();
};

Server.prototype.start = function(options) {
  options = options || {};
  http.createServer(this._app).listen(options.port || defaultPort);
};
