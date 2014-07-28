
var child_process = require('child_process');

var Manager = function() {
  this._instances = {};
};

Manager.prototype.run = function(command, args, options) {
  options = options || {};
  var spawnOptions = {};
  spawnOptions.env = JSON.parse(JSON.stringify(process.env));
  if (options.env) {
    for (var key in options.env) {
      spawnOptions.env[key] = options.env[key];
    }
  }
  var childProcess = child_process.spawn(command, args, spawnOptions);
  this._instances[childProcess.pid] = {
    command: command,
    args: args,
    env: spawnOptions.env,
    startTs: Date.now(),
    _process: childProcess
  };
};

Manager.prototype.kill = function(pid, options) {
  options = options || {};
  var instance = this._instances[pid];
  if (!instance) throw new Error('No such instance');
  instance && instance._process.kill(options.signal || 'SIGHUP');
  delete this._instances[pid];
};

Manager.prototype.listInstances = function() {
  return this._instances;
};

module.exports = Manager;
