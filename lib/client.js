
var request = require('request');
var defaultPort = 54047;
var commands = [
  'deploy',
  'list',
  'listInstances'
];

var Client = function(options) {
  options = options || {};
  this.host = options.host || 'localhost';
  this.port = options.port || defaultPort;

  commands.forEach(function(commandId) {
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

  request({
    uri: 'http://' + this.host + ':' + this.port + '/execute',
    method: 'POST',
    json: {
      command: command,
      arguments: arguments
    }
  }, function(err, res, body) {
    if (err) return callback(err);
    if (res.statusCode != 200) {
      return callback(new Error('Server returned error: ' + body.error.message));
    }
    return callback(null, body.result);
  })
};

module.exports = Client;
