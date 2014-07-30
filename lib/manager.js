
var child_process = require('child_process');
var crypto = require('crypto');

var Manager = function() {
  this._instances = {};
  this._configuration = {};
  this._processes = {};
};

Manager.prototype.deploy = function(configuration, options) {
  options = options || {};
  this._validateConfiguration(configuration);
  var processes = configuration.processes.map(function(process) {
    process.id = this._generateId(process);
    return process;
  }.bind(this));
  processes.forEach(function(process) {
    this._startStopProcess(process, this._processes[process.id]);
    this._processes[process.id] = process;
  }.bind(this));
  this._configuration = configuration;
};

Manager.prototype.status = function(options) {
  options = options || {};
  var configuration = JSON.parse(JSON.stringify(this._configuration));
  configuration.processes = configuration.processes.map(function(process) {
    process.id = this._generateId(process);
    var runningInstances = this._findInstancesByProcessId(process.id);
    process.runningInstances = runningInstances.map(function(instance) {
      var publicObject = {};
      for (var key in instance) {
        if (key[0] != '_')
          publicObject[key] = instance[key];
      }
      return publicObject;
    });
    return process;
  }.bind(this));
  return configuration;
};

Manager.prototype.run = function(command, args, options) {
  options = options || {};
  var spawnOptions = {};
  spawnOptions.env = JSON.parse(JSON.stringify(process.env || {}));
  if (options.env) {
    for (var key in options.env) {
      spawnOptions.env[key] = options.env[key];
    }
  }
  var childProcess = child_process.spawn(command, args, spawnOptions);
  this._instances[childProcess.pid] = {
    pid: childProcess.pid,
    command: command,
    args: args,
    env: spawnOptions.env,
    startTs: Date.now(),
    _process: childProcess,
    _processId: options.processId
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

Manager.prototype._findInstancesByProcessId = function(processId) {
  var instances = [];
  for (var pid in this._instances) {
    if (this._instances[pid]._processId == processId) {
      instances.push(this._instances[pid]);
    }
  }
  return instances;
};

Manager.prototype._startStopProcess = function(process, oldProcess) {
  var numInstances = process.instances;
  var runningInstances = this._findInstancesByProcessId(process.id);
  var numToRun = numInstances - runningInstances.length;
  var numToKill = runningInstances.length - numInstances;
  if (numToKill > 0) {
    runningInstances.slice(0, numToKill).forEach(function(instance) {
      this.kill(instance._process.pid);
    }.bind(this));
  }
  if (numToRun > 0) {
    for (var i=0; numToRun>i; i++) {
      this.run(process.cmd, process.args || [], {
        processId: process.id,
        env: process.env
      });
    }
  }
};

Manager.prototype._validateConfiguration = function(configuration) {
  if (!configuration.processes) throw new Error("Configuration needs a 'processes' definition");
  if (!configuration.processes.length) throw new Error("Expected 'processes' to be defined");
  configuration.processes.forEach(function(process) {
    if (!process.cmd) throw new Error("Process definition needs a 'cmd'");
    if (!process.name) throw new Error("Process definition needs a 'name'");
  });
};

Manager.prototype._generateId = function(process) {
  var shasum = crypto.createHash('sha1');
  var identifier = [process.cmd, (process.args || []).join(' '),  JSON.stringify(process.env || {})].join('-');
  shasum.update(identifier);
  return shasum.digest('hex');
};

module.exports = Manager;
