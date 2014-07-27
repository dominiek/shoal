
var assert = require('chai').assert;
var Manager = require('../lib/manager');

describe('Manager', function(){

  it('should run processes and keep track of those', function(){
    var manager = new Manager();
    manager.runProcess('ping', ['localhost'], {env: {TESTVAR: "123"}});
    var processes = manager.listProcesses();
    var pids = Object.keys(processes);
    var process = processes[pids[0]];
    assert.equal(pids.length, 1);
    assert.equal(process.command, 'ping');
    assert.equal(process.env.TESTVAR, '123');
    assert.equal(!!process.env.PATH, true);
    assert.equal(!!process.startTs, true);
  });

  it('should allow us to kill processes', function(){
    var manager = new Manager();
    manager.runProcess('ping', ['localhost'], {env: {TESTVAR: "123"}});
    var processes = manager.listProcesses();
    var pids = Object.keys(processes);
    var process = processes[pids[0]];
    assert.equal(pids.length, 1);
    manager.killProcess(pids[0]);
    assert.equal(Object.keys(manager.listProcesses()).length, 0);
  });

});