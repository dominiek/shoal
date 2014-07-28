
var assert = require('chai').assert;
var Manager = require('../lib/manager');

describe('Manager', function(){

  it('should allow us to deploy new processes and should fire off instances based on this', function(){
    var configuration = {
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
          instances: 3
        }
      ]
    };
    var manager = new Manager();
    manager.deploy(configuration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
  });

  it('should properly stop instances when number of instances change in configuration', function(){
    var configuration = {
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
          instances: 3
        }
      ]
    };
    var manager = new Manager();
    manager.deploy(configuration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping', 'ping']);
    configuration.processes[1].instances--;
    manager.deploy(configuration);
    var instances = manager.listInstances();
    assert.deepEqual(Object.keys(instances).map(function(pid) { return instances[pid].command; }), ['ping', 'ping']);
  });

  it('should run instances and keep track of those', function(){
    var manager = new Manager();
    manager.run('ping', ['localhost'], {env: {TESTVAR: "123"}});
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(pids.length, 1);
    assert.equal(instance.command, 'ping');
    assert.equal(instance.env.TESTVAR, '123');
    assert.equal(!!instance.env.PATH, true);
    assert.equal(!!instance.startTs, true);
  });

  it('should allow us to kill instances', function(){
    var manager = new Manager();
    manager.run('ping', ['localhost'], {env: {TESTVAR: "123"}});
    var instances = manager.listInstances();
    var pids = Object.keys(instances);
    var instance = instances[pids[0]];
    assert.equal(pids.length, 1);
    manager.kill(pids[0]);
    assert.equal(Object.keys(manager.listInstances()).length, 0);
  });

});