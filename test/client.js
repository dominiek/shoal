
var assert = require('chai').assert;
var async = require('async');

var Manager = require('../lib/manager');
var Server = require('../lib/server');
var Client = require('../lib/client');

var server = new Server(new Manager());
server.start();

describe('Client', function(){

  it('Should allow us to deploy a process configuration', function(done){
    var configuration = {
      quiet: true,
      processes: [
        {
          name: 'Ping Localhost',
          cmd: 'ping',
          args: ['localhost'],
          instances: 3
        }
      ]
    };

    var client = new Client();

    async.series([
      function(next) {
        client.listInstances(function(err, result) {
          assert.equal(err, null);
          assert.equal(0, Object.keys(result).length);
          next();
        });
      },
      function(next) {
        client.deploy(configuration, function(err, result) {
          assert.equal(err, null);
          next();
        });
      },
      function(next) {
        client.listInstances(function(err, result) {
          assert.equal(err, null);
          assert.equal(3, Object.keys(result).length);
          next();
        });
      },
      function(next) {
        client.status(function(err, status) {
          assert.equal(err, null);
          assert.equal(status.processes[0].runningInstances.length, 3);
          next();
        });
      }
    ], done);
  });

});