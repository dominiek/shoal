
var child_process = require('child_process');
var crypto = require('crypto');
var fs = require('fs');
var extend = require('util')._extend;
var version = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version;

var Manager = function(options) {
  this._verbose = options && options.verbose;
  this._quiet = options && options.quiet;
  this._instances = {};
  this._configuration = null;
  this._processes = {};
};

Manager.prototype.deploy = function(configuration, options) {
  options = options || {};
  try {
    this._validateConfiguration(configuration);
  } catch(err) {
    this._warn("Invalid configuration received: " + err.message);
    throw err;
  }
  this._log("Deploying new process configuration (numProcesses=" + configuration.processes.length + ")");
  var processes = configuration.processes.map(function(process) {
    process.id = this._generateId(process);
    return process;
  }.bind(this));
  this._configuration = configuration;
  processes.forEach(function(process) {
    this._startStopProcess(process, this._processes[process.id]);
    this._processes[process.id] = process;
  }.bind(this));
};

Manager.prototype.status = function(options) {
  options = options || {};
  if (!this._configuration) return null;
  var configuration = JSON.parse(JSON.stringify(this._configuration));
  configuration.processes = (configuration.processes || []).map(function(process) {
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
  this._log("Starting new instance " + command + " " + JSON.stringify(args), 2);
  var childProcess = child_process.spawn(command, args, spawnOptions);
  var instance = {
    pid: childProcess.pid,
    command: command,
    args: args,
    env: spawnOptions.env,
    startTs: Date.now(),
    _process: childProcess,
    _processId: options.processId
  };
  
  instance.outFile = this._logFileForInstance(instance, 'out');
  instance.errFile = this._logFileForInstance(instance, 'err');
  instance._out = instance.outFile && this._createWriteStream(instance.outFile);
  instance._err = instance.errFile && this._createWriteStream(instance.errFile);

  this._instances[childProcess.pid] = instance;
  childProcess.on('exit', function(code, signal) {
    if (this._configuration) {
      var process = this._findProcessById(instance._processId);
      this._log("Process instance for \""+process.name+"\" exited (pid="+instance.pid+", processId="+instance._processId+")");
      if (process.autoRestart || this._configuration.autoRestart) {
        var autoRestartTimeoutMs = process.autoRestartTimeoutMs || this._configuration.autoRestartTimeoutMs || 1000;
        this._log("Starting new instance for \""+process.name+"\" in "+autoRestartTimeoutMs+"ms");
        setTimeout(function() {
          this.run(instance.command, instance.args, options);
        }.bind(this), autoRestartTimeoutMs);
      }
    }
    delete this._instances[childProcess.pid];
  }.bind(this));

  if (instance._out) {
    childProcess.stdout.pipe(instance._out);
  } else if (!options.quiet) {
    childProcess.stdout.pipe(process.stdout);
  }

  if (instance._err) {
    childProcess.stderr.pipe(instance._err);
  } else if (!options.quiet) {
    childProcess.stderr.pipe(process.stderr);
  }
};

Manager.prototype.kill = function(pid, options) {
  options = options || {};
  var instance = this._instances[pid];
  if (!instance) throw new Error('No such instance');
  instance && instance._process.kill(options.signal || 'SIGHUP');
  if (options.killTimeoutMs) {
    setTimeout(function() {
      var instance = this._instances[pid];
      if (!instance) return;
      instance && instance._process.kill('SIGKILL');
      delete this._instances[pid];
      setTimeout(function() {}, 1000);
    }.bind(this), options.killTimeoutMs);
  }
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

Manager.prototype._findProcessById = function(id) {
  return this._configuration.processes.filter(function(process) {
    return process.id == id;
  })[0];
};

Manager.prototype._startStopProcess = function(process, oldProcess) {
  var numInstances = process.instances;
  var runningInstances = this._findInstancesByProcessId(process.id);
  var numToRun = numInstances - runningInstances.length;
  var numToKill = runningInstances.length - numInstances;
  if (numToRun < 0) numToRun = 0;
  if (numToKill < 0) numToKill = 0;
  this._log("Updating \""+process.name+"\" (id="+process.id+", instancedToStop="+numToKill+", instancesToStart="+numToRun+")");
  if (numToKill) {
    runningInstances.slice(0, numToKill).forEach(function(instance) {
      this.kill(instance._process.pid, {
        killTimeoutMs: process.killTimeoutMs || this._configuration.killTimeoutMs
      });
    }.bind(this));
  }
  if (numToRun) {
    for (var i=0; numToRun>i; i++) {
      var env = extend(this._configuration.env || {}, process.env || {});
      this._applyEnvVariables(process, env);
      this.run(process.cmd, process.args || [], {
        processId: process.id,
        env: env,
        quiet: process.quiet || this._configuration.quiet
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
    var logRoot = process.logRoot || configuration.logRoot;
    if (process.logFile && !logRoot) {
      throw new Error("Cannot configure logging without a logRoot folder");
    }
    if (logRoot && !fs.existsSync(logRoot)) {
      throw new Error("Invalid `logRoot` path, folder does not exist");
    }
    if (process.logPath && process.logPath.match(/\//)) {
      throw new Error("Invalid `logPath`, path should not have any '/'. Use `logRoot` to specify directory");
    }
  });
};

Manager.prototype._generateId = function(process) {
  var shasum = crypto.createHash('sha1');
  var identifier = [process.cmd, (process.args || []).join(' '),  JSON.stringify(process.env || {})].join('-');
  shasum.update(identifier);
  return shasum.digest('hex');
};

Manager.prototype._logFileForInstance = function(instance, extension) {
  if (!instance._processId) return null;
  var process = this._findProcessById(instance._processId);
  var logRoot = process.logRoot || this._configuration.logRoot;
  if (!logRoot) return null;
  var fullLogPath = logRoot + '/' + (process.logPath || (this._nameToLogId(process.name) + '.' + extension));
  fullLogPath = fullLogPath.replace(/\/\//g, '/');
  return fullLogPath;
};

Manager.prototype._createWriteStream = function(path) {
  return fs.createWriteStream(path, {flags: 'a+'});
};

Manager.prototype._nameToLogId = function(name) {
  return name.toLowerCase().replace(/\ /g, '-');
};

Manager.prototype._applyEnvVariables = function(process, env) {
  var substitutions = {
    '\$processName': process.name,
    '\$processShortName': this._nameToLogId(process.name),
    '\$processId': process.id,
    '\$shoalCwd': global.process.cwd(),
    '\$shoalVersion': version,
    '\$logRoot': process.logRoot || this._configuration.logRoot
  }
  for (var key in env) {
    if (!env[key].match(/\$\w+/)) continue;
    for (var variable in substitutions) {
      env[key] = env[key].replace(variable, substitutions[variable]);
    }
  }
};

Manager.prototype._log = function(line, v) {
  if (this._quiet) return;
  if (v && !this._verbose) return;
  console.log("[" + (new Date()).toISOString() + "]", line);
};

Manager.prototype._warn = function(line) {
  console.warn("[" + (new Date()).toISOString() + "]", line);
};

module.exports = Manager;
