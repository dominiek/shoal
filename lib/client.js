
var fs = require('fs');
var request = require('request');
var defaults = require('./defaults');

var Client = function(options) {
  options = options || {};
  this.host = options.host || defaults.host;
  this.port = options.port || defaults.port;

  if (options.auth && options.auth.type == 'basic') {
    this._setupBasicAuth(options.auth);
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

  var options = {
    uri: 'http://' + this.host + ':' + this.port + '/execute',
    method: 'POST',
    json: {
      command: command,
      arguments: arguments
    }
  };

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


module.exports = Client;
