
var fs = require('fs');
var path = require('path');
var express = require('express');
var connect = require('connect');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var defaults = require('./defaults');
var auth = require('./auth');
var extend = require('util')._extend;
var version = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version;

var Server = function(manager, options) {
  options = options || {};
  this._manager = manager;
  this._httpsOptions = null;
  this._app = express();
  this._app.use(bodyParser.json());
  this._authType = (options.auth && options.auth.type) || 'none';
  auth.init(this, auth.server, 'auth', options);
  this.options = extend(defaults, options);
  this._routes();
};

Server.prototype.start = function(options) {
  options = options || {};
  options.port = options.port || this.options.port;
  options.host = options.host || this.options.host;
  this._server = this._httpsOptions ? https.createServer(this._httpsOptions, this._app) : http.createServer(this._app);
  this._server.listen(options.port, options.host);
  !options.quiet && console.log('Shoal Manager running on http://' + options.host + ':' + options.port + " (Authentication="+this._authType+")")
};

Server.prototype.stop = function() {
  this._server && this._server.close();
};

Server.prototype._execute = function(req, res, next) {
  var command = req.param('command');
  var arguments = req.param('arguments');

  if (!command) return this._error(res, 400, 'Need :command parameter');
  if (defaults.commands.indexOf(command) == -1) return this._error(res, 400, 'Invalid command: ' + command);

  try {
    var result = this._manager[command].apply(this._manager, arguments || []);
    if (result && typeof result == 'object')
      result = JSON.parse(JSON.stringify(result, safeCycles()));
    res.send({result: result || 'ok'});
  } catch(err) {
    this._error(res, 500, err.message);
  }
};

Server.prototype._info = function(req, res, next) {
  return res.send({shoal: {version: version}})
}

Server.prototype._routes = function() {
  this._app.post('/execute', this._execute.bind(this));
  this._app.get('/', this._info.bind(this));
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
