
var fs = require('fs');
var httpAuth = require('http-auth');

module.exports = {

  init: function(instance, auth, scope, options) {
    if (options[scope] && options[scope].type == 'basic') {
      auth.basic.bind(instance)(options[scope], options);
    } else if (options[scope] && options[scope].type == 'ssl') {
      auth.ssl.bind(instance)(options[scope], options);
    } else if (options[scope]) {
      throw new Error('Unknown authentication method: ' + options[scope].type);
    }
  },

  server: {

    basic: function(params) {
      if (!params.key && !params.keyFile) {
        throw new Error('Need either :key or :keyFile set for Basic Auth');
      }
      var key = params.key;
      if (params.keyFile) {
        if (!fs.existsSync(params.keyFile)) {
          throw new Error('File does not exist: ' + params.keyFile);
        }
        key = fs.readFileSync(params.keyFile).toString();
      }
      var basic = httpAuth.basic({
        realm: "Shoal Manager"
      });
      basic.options.users = [{username: params.username || 'shoal', hash: key}];
      this._app.use(httpAuth.connect(basic));
    },

    ssl: function(params, options) {

      if (!params.keyFile || !params.certFile || !params.caFile) {
        throw new Error('Need :keyFile, :certFile and :caFile to configure SSL');
      }

      if (options.configDir) params.keyFile = path.resolve(options.configDir, params.keyFile);
      if (options.configDir) params.certFile = path.resolve(options.configDir, params.certFile);
      if (options.configDir) params.caFile = path.resolve(options.configDir, params.caFile);

      if (!fs.existsSync(params.keyFile)) {
        throw new Error('File does not exist: ' + params.keyFile);
      }

      if (!fs.existsSync(params.certFile)) {
        throw new Error('File does not exist: ' + params.certFile);
      }

      if (!fs.existsSync(params.caFile)) {
        throw new Error('File does not exist: ' + params.caFile);
      }

      this._httpsOptions = {
        key: fs.readFileSync(params.keyFile),
        cert: fs.readFileSync(params.certFile),
        ca: fs.readFileSync(params.caFile),
        requestCert: true,
        rejectUnauthorized: true
      };

      if (params.passphrase)
        this._httpsOptions.passphrase = params.passphrase;
    }

  },

  client: {

    basic: function(params) {
      if (!params.key && !params.keyFile) {
        throw new Error('Need either :key or :keyFile set for Basic Auth');
      }
      var key = params.key;
      if (params.keyFile) {
        if (!fs.existsSync(params.keyFile)) {
          throw new Error('File does not exist: ' + params.keyFile);
        }
        key = fs.readFileSync(params.keyFile).toString();
      }
      this._basicAuth = {
        'user': params.username || 'shoal',
        'pass': key,
        'sendImmediately': true
      };
    },

    ssl: function(params, options) {
      
      if (!params.keyFile || !params.certFile) {
        throw new Error('Need :keyFile, :certFile and :caFile to configure SSL');
      }

      if (options.configDir && params.keyFile) params.keyFile = path.resolve(options.configDir, params.keyFile);
      if (options.configDir && params.certFile) params.certFile = path.resolve(options.configDir, params.certFile);
      if (options.configDir && params.caFile) params.caFile = path.resolve(options.configDir, params.caFile);

      if (!fs.existsSync(params.keyFile)) {
        throw new Error('File does not exist: ' + params.keyFile);
      }

      if (!fs.existsSync(params.certFile)) {
        throw new Error('File does not exist: ' + params.certFile);
      }

      if (params.caFile && !fs.existsSync(params.caFile)) {
        throw new Error('File does not exist: ' + params.caFile);
      }

      if (!this._httpOptions.agentOptions)
        this._httpOptions.agentOptions = {};

      this._httpOptions.agentOptions.cert = fs.readFileSync(params.certFile).toString();
      this._httpOptions.agentOptions.key = fs.readFileSync(params.keyFile).toString();
      this._httpOptions.agentOptions.rejectUnauthorized = false;
      
      if (params.caFile) {
        this._httpOptions.agentOptions.ca = fs.readFileSync(params.caFile).toString();
        this._httpOptions.agentOptions.rejectUnauthorized = true;
      }

      if (params.passphrase)
        this._httpOptions.agentOptions.passphrase = params.passphrase;

      this._httpOptions.protocolStr = 'https';
    }

  }

};
