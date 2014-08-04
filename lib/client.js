
var fs = require('fs');
var path = require('path');
var request = require('request');
var defaults = require('./defaults');
var extend = require('util')._extend;

var Client = function(options) {
  options = options || {};
  this.host = options.host || defaults.host;
  this.port = options.port || defaults.port;
  this._httpOptions = {protocolStr: 'http'};

  if (options.auth && options.auth.type == 'basic') {
    this._setupBasicAuth(options.auth);
  } else if (options.auth && options.auth.type == 'ssl') {
    this._setupSslAuth(options.auth, options);
  } else if (options.auth) {
    throw new Error('Unknown authentication method: ' + options.auth.type);
  }

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

Client.prototype._setupBasicAuth = function(params) {
  if (!params.key && !params.keyFile) {
    throw new Error('Need either :key or :keyFile set for Basic Auth');
  }
  var key = params.key;
  if (params.keyFile) {
    if (!fs.existsSync(params.keyFile)) {
      throw new Error('File does not exist: ' + params.keyFile);
    }
    key = fs.readFileSync(params.keyFile).toString();
  }
  this._basicAuth = {
    'user': 'shoal',
    'pass': key,
    'sendImmediately': true
  };
};

Client.prototype._setupSslAuth = function(params, options) {
  
  if (!params.keyFile || !params.certFile) {
    throw new Error('Need :keyFile, :certFile and :caFile to configure SSL');
  }

  if (options.configDir && params.keyFile) params.keyFile = path.resolve(options.configDir, params.keyFile);
  if (options.configDir && params.certFile) params.certFile = path.resolve(options.configDir, params.certFile);
  if (options.configDir && params.caFile) params.caFile = path.resolve(options.configDir, params.caFile);

  if (!fs.existsSync(params.keyFile)) {
    throw new Error('File does not exist: ' + params.keyFile);
  }

  if (!fs.existsSync(params.certFile)) {
    throw new Error('File does not exist: ' + params.certFile);
  }

  if (params.caFile && !fs.existsSync(params.caFile)) {
    throw new Error('File does not exist: ' + params.caFile);
  }

  if (!this._httpOptions.agentOptions)
    this._httpOptions.agentOptions = {};

  this._httpOptions.agentOptions.cert = fs.readFileSync(params.certFile).toString();
  this._httpOptions.agentOptions.key = fs.readFileSync(params.keyFile).toString();
  this._httpOptions.agentOptions.rejectUnauthorized = false;
  
  if (params.caFile) {
    this._httpOptions.agentOptions.ca = fs.readFileSync(params.caFile).toString();
    this._httpOptions.agentOptions.rejectUnauthorized = true;
  }

  if (params.passphrase)
    this._httpOptions.agentOptions.passphrase = params.passphrase;

  this._httpOptions.protocolStr = 'https';
};


module.exports = Client;
