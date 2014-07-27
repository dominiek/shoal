
var child_process = require('child_process');

var Manager = function() {
  this._processes = {};
};

Manager.prototype.runProcess = function(command, args, options) {
  options = options || {};
  var spawnOptions = {};
  spawnOptions.env = JSON.parse(JSON.stringify(process.env));
  if (options.env) {
    for (var key in options.env) {
      spawnOptions.env[key] = options.env[key];
    }
  }
  var childProcess = child_process.spawn(command, args, spawnOptions);
  this._processes[childProcess.pid] = {
    command: command,
    args: args,
    env: spawnOptions.env,
    startTs: Date.now(),
    _process: childProcess
  };
};

Manager.prototype.killProcess = function(pid, options) {
  options = options || {};
  var process = this._processes[pid];
  if (!process) throw new Error('No such process');
  process && process._process.kill(options.signal || 'SIGHUP');
  delete this._processes[pid];
};

Manager.prototype.listProcesses = function() {
  return this._processes;
};

module.exports = Manager;
