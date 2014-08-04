
var assert = require('chai').assert;
var async = require('async');

var Manager = require('../index').Manager;
var Server = require('../index').Server;
var Client = require('../index').Client;

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

    var server = new Server(new Manager());
    server.start({quiet: true});

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
    ], function() {
      server.stop();
      done();
    });
  });

  it('Should support basic shared key authentication', function(done){
    var config = {
      auth: {
        type: 'basic',
        keyFile: __dirname + '/fixtures/basic.key'
      }
    };
    var server = new Server(new Manager(), config);
    server.start({quiet: true});

    var client = new Client();

    async.series([
      function(next) {
        client.listInstances(function(err, result) {
          assert.equal(err.message, 'Authentication failed');
          next();
        });
      },
      function(next) {
        client = new Client(config);
        client.listInstances(function(err, result) {
          assert.equal(err, null);
          next();
        });
      }
    ], function() {
      server.stop();
      done();
    });
  });

});