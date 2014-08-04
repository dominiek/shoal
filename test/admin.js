
var assert = require('chai').assert;
var async = require('async');
var request = require('request');

var Manager = require('../index').Manager;
var Server = require('../index').Server;
var Admin = require('../index').Admin;
var Client = require('../index').Client;
var defaults = require('../index').defaults;

describe('Admin', function(){

  it('Should support basic auth on the Admin Web UI', function(done){
    var config = {
      adminAuth: {
        type: 'basic',
        username: 'bla',
        key: 'secret'
      }
    };
    var server = new Server(new Manager());
    server.start({quiet: true});

    var client = new Client();
    var admin = new Admin(client, config);
    admin.start({quiet: true});

    async.series([
      function(next) {
        request.get('http://'+defaults.adminHost+':'+defaults.adminPort+'/status', function(err, res, body) {
          assert.equal(err, null);
          assert.equal(res.statusCode, 401);
          next();
        });
      },
      function(next) {
        request({
          uri: 'http://'+defaults.adminHost+':'+defaults.adminPort+'/status',
          method: 'GET',
          auth: {
            user: 'bla', 
            pass: 'secret',
            sendImmediately: true
          }
        }, function(err, res, body) {
          assert.equal(err, null);
          assert.equal(res.statusCode, 200);
          next();
        });
      }
    ], function() {
      server.stop();
      admin.stop();
      done();
    });
  });

});