
var fs = require('fs');
var path = require('path');
var request = require('request');
var defaults = require('./defaults');
var auth = require('./auth');
var extend = require('util')._extend;

var Client = function(options) {
  options = options || {};
  this.host = options.host || defaults.host;
  this.port = options.port || defaults.port;
  this._httpOptions = {protocolStr: 'http'};

  auth.init(this, auth.client, 'auth', options);

  defaults.commands.forEach(function(commandId) {
    this[commandId] = this._execute.bind(this, commandId);
  }.bind(this));
};

Client.prototype._execute = function(command) {
  var argumentsArray = [];
  for (var key in arguments) 
    argumentsArray.push(arguments[key]);

  var callback = argumentsArray[argumentsArray.length-1];
  if (typeof callback != 'function')
    throw new Error('Need callback argument for ' + command);

  arguments = argumentsArray.slice(1, argumentsArray.length-1);

  var options = extend(JSON.parse(JSON.stringify(this._httpOptions)), {
    uri: this._httpOptions.protocolStr+'://' + this.host + ':' + this.port + '/execute',
    method: 'POST',
    json: {
      command: command,
      arguments: arguments
    }
  });

  if (this._basicAuth) options.auth = this._basicAuth;

  request(options, function(err, res, body) {
    if (err) return callback(err);
    if (res.statusCode == 401) {
      return callback(new Error("Authentication failed"))
    }
    if (res.statusCode != 200) {
      return callback(new Error('Server returned error: ' + body.error.message));
    }
    return callback(null, body.result);
  })
};

module.exports = Client;
