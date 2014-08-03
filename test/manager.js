
var fs = require('fs');
var assert = require('chai').assert;
var Manager = require('../lib/manager');

describe('Manager', function(){
  var configuration = {
    env: {
      "COMMON": "yes"
    },
    quiet: true,
    processes: [
      {
        name: 'Some Daemon',
        cmd: '/usr/bin/somed',
        args: ['-f'],
        instances: 0
      },
      {
        name: 'Ping Localhost',
        cmd: 'ping',
        args: ['localhost'],
        instances: 3,
        env: {NODE_ENV: 'staging'}
      },
      {
        name: 'Ping Localhost 2',
        cmd: 'ping',
        args: ['localhost'],
        env: {TESTVAR: '123'},
        instances: 0
      }
    ]
  };

  it('should allow us to deploy new processes and should fire off instances based on this', function(){
    var manager = new Manager();
    manager.deploy(configuration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
  });

  it('should give us a list of the current status', function(){
    var manager = new Manager();
    manager.deploy(configuration);
    var status = manager.status();
    assert.equal(status.processes[0].runningInstances.length, 0);
    assert.equal(status.processes[1].runningInstances.length, 3);
    assert.equal(!!status.processes[1].runningInstances[0].pid, true);
    assert.equal(!!status.processes[1].runningInstances[0].startTs, true);
    assert.equal(status.processes[1].runningInstances[0].env.COMMON, "yes");
  });

  it('should properly use the autoRestart setting', function(done){
    this.timeout(4000);
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.autoRestart = true;
    newConfiguration.autoRestartTimeoutMs = 1000;
    manager.deploy(newConfiguration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
    process.kill(instances[Object.keys(instances)[0]].pid, 'SIGHUP');
    setTimeout(function() {
      var instances = manager.listInstances();
      assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping']);
    }, 100);
    setTimeout(function() {
      var instances = manager.listInstances();
      assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
      assert.deepEqual(Object.keys(instances).map(function(pid) { return !!instances[pid].env.NODE_ENV; }), [true, true, true]);
      done();
    }, 2000);
  });

  it('should properly use the killTimeoutMs setting', function(done){
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.killTimeoutMs = 2000;
    manager.deploy(newConfiguration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
    newConfiguration.processes[1].instances--;
    newConfiguration.processes[2].instances++;
    newConfiguration.processes[2].instances++;
    var kill = manager.kill;
    manager.kill = function(pid, options) {
      assert.equal(!!options, true);
      assert.equal(options.killTimeoutMs, 2000);
      manager.kill = kill;
      done();
    };
    manager.deploy(newConfiguration);
  });

  it('should properly stop instances when number of instances change in configuration', function(done){
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    manager.deploy(newConfiguration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
    newConfiguration.processes[1].instances--;
    newConfiguration.processes[2].instances++;
    newConfiguration.processes[2].instances++;
    manager.deploy(newConfiguration);
    setTimeout(function() {
      var instances = manager.listInstances();
      assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping', 'ping']);
      assert.deepEqual(Object.keys(instances).map(function(pid) { return !!instances[pid].env.TESTVAR; }), [false, false, true, true]);
      done();
    }, 500);
  });

  it('should allow us to specify output files for stdout and stderr', function(done){
    this.timeout(3000);
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.processes[1].logRoot = '/tmp';
    newConfiguration.quiet = false;
    manager.deploy(newConfiguration);
    setTimeout(function() {
      var path = '/tmp/ping-localhost.out';
      var data = fs.readFileSync(path).toString();
      assert.equal(data.length > 100, true);
      fs.unlinkSync(path);

      var path = '/tmp/ping-localhost.err';
      var data = fs.readFileSync(path).toString();
      assert.equal(data.length, 0);
      fs.unlinkSync(path);
      done();
    }, 400);
  });

  it('should allow us to use internal variables in the environment', function(){
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.logRoot = '/tmp';
    newConfiguration.processes[1].env = {
      'TEST_NAME':       '$processName',
      'TEST_SHORT_NAME': '$processShortName',
      'TEST_ID':         '$processId',
      'TEST_CWD':        '$shoalCwd',
      'TEST_VERSION':    '$shoalVersion',
      'TEST_LOG_ROOT':   '$logRoot'
    }
    manager.deploy(newConfiguration);
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(instance.env.TEST_NAME, 'Ping Localhost');
    assert.equal(instance.env.TEST_SHORT_NAME, 'ping-localhost');
    assert.equal(instance.env.TEST_ID, '86b1eb6762b83a7c60221ab43c31830e89ac5a44');
    assert.equal(instance.env.TEST_CWD.length > 20, true);
    assert.equal(instance.env.TEST_VERSION.length < 12, true);
    assert.equal(instance.env.TEST_LOG_ROOT, '/tmp');
    var status = manager.status();
  });

  it('should check if logging dir exists', function(){
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.processes[1].logRoot = 'bla';
    assert.throws(function() { manager.deploy(newConfiguration); }, Error, /folder does not exist/);
  });

  it('should check if logging dir is configured', function(){
    var manager = new Manager();
    var newConfiguration = JSON.parse(JSON.stringify(configuration));
    newConfiguration.processes[1].logFile = 'hello.out';
    assert.throws(function() { manager.deploy(newConfiguration); }, Error, /without a logRoot /);
  });

  it('should run instances and keep track of those', function(done){
    var manager = new Manager();
    manager.run('ping', ['localhost'], {env: {TESTVAR: "123"}, quiet: true});
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(pids.length, 1);
    assert.equal(instance.command, 'ping');
    assert.equal(instance.env.TESTVAR, '123');
    assert.equal(!!instance.env.PATH, true);
    assert.equal(!!instance.startTs, true);
    process.kill(pids[0], 'SIGTERM');
    setTimeout(function() {
      var instances = manager.listInstances();
      var pids = Object.keys(instances);
      assert.equal(pids.length, 0);
      done();
    }, 1000);
  });

  it('should deal with instances that are hard to kill', function(done){
    this.timeout(4000);
    var manager = new Manager();
    manager.run('node', [__dirname + '/../tools/stayingalive.js'], {quiet: true});
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(pids.length, 1);
    setTimeout(function() {
      manager.kill(pids[0], {killTimeoutMs: 1000});
    }, 600);
    setTimeout(function() {
      var instances = manager.listInstances();
      var pids = Object.keys(instances);
      assert.equal(pids.length, 0);
      done();
    }, 2500);
  });

  it('should allow us to kill instances', function(done){
    var manager = new Manager();
    manager.run('ping', ['localhost'], {env: {TESTVAR: "123"}, quiet: true});
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(pids.length, 1);
    manager.kill(pids[0]);
    setTimeout(function() {
      assert.equal(Object.keys(manager.listInstances()).length, 0);
      done();
    }, 500);
  });

});