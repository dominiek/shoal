
var express = require('express');
var connect = require('connect');
var bodyParser = require('body-parser');
var http = require('http');
var defaultPort = 54047;
var commands = [
  'deploy',
  'list',
  'listInstances'
];

var Server = function(manager) {
  this._manager = manager;
  this._app = express();
  this._app.use(bodyParser.json());
  this._routes();
};

Server.prototype.start = function(options) {
  options = options || {};
  http.createServer(this._app).listen(options.port || defaultPort, options.host || '127.0.0.1');
};

Server.prototype._execute = function(req, res) {
  var command = req.param('command');
  var arguments = req.param('arguments');

  if (!command) return this._error(res, 400, 'Need :command parameter');
  if (commands.indexOf(command) == -1) return this._error(res, 400, 'Invalid command: ' + command);

  try {
    var result = this._manager[command].apply(this._manager, arguments || []);
    if (result && typeof result == 'object')
      result = JSON.parse(JSON.stringify(result, safeCycles()));
    res.send({result: result || 'ok'});
  } catch(err) {
    this._error(res, 500, err.message);
  }
};

Server.prototype._routes = function() {
  this._app.post('/execute', this._execute.bind(this));
};

Server.prototype._error = function(res, statusCode, message) {
  res.status(statusCode).send({error: {message: message}});
};

// A JSON stringifier that handles cycles safely.
// Usage: JSON.stringify(obj, safeCycles())
function safeCycles() {
  var seen = [];
  return function (key, val) {
    if (!val || typeof (val) !== 'object') {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
    };
}

module.exports = Server;
