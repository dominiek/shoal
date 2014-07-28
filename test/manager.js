
var assert = require('chai').assert;
var Manager = require('../lib/manager');

describe('Manager', function(){

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