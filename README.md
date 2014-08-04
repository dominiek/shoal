Shoal
==========

[![Build Status](https://travis-ci.org/dominiek/node-shoal.png?branch=master)](https://travis-ci.org/dominiek/node-shoal)

Shoal allows you to group and run multiple processes. Shoal manages these processes and exposes controls and status information via a HTTP JSON API. Aside from the JSON interface there is a Web user interface and a CLI.

Use-cases:

* Centralize process/worker configuration using a single JSON config file (Avoid hundreds of upstart scripts)
* Use a CLI and Web UI to monitor and control a large number of process/worker instances
* Simplifying process/worker management for developers (e.g. local installs of ETL's)
* Smart deployments: Automatically stop workers that have been removed from configuration, and start instances that were added
* Centrally control logging, environment and restart behavior of processes

### Status

This project is still early stage. We do not recommend using this in production unless a proper security audit has been done. Current use should be for development environments only.

### Security

By default, the Shoal Manager (`shoald`) binds to `127.0.0.1` and allows execution of commands sent to it. This is something to be taken into consideration when running outside of sandboxed environments. No security features are supplied with Shoal currently so environment-specific security mechanisms should be implemented by yourself.

## Install

```
npm install shoal
```

## Usage

In order to deploy and monitor processes with one of the user interfaces, you need to run the Shoal Manager. This is done by executing the `shoald` command that's included with the NPM module.

By default, the Shoal Manager listens for commands on port *54047* and also binds the Admin UI on port *54047*:

```
$ shoald
Shoal Manager running on http://127.0.0.1:54047
Shoal Admin UI running on http://127.0.0.1:54048
```

Here are some CLI options that can be given to `shoald`:

```
$ shoald --help
  Usage: shoald [options]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -p, --port <port>              Port to bind on (Default: 54047)
    -b, --bind <host>              Host to bind on (Default: 127.0.0.1)
    -ap, --admin-port <port>       Port to bind Admin UI on (Default: 54048)
    -ab, --admin-bind <host>       Host to bind Admin UI on (Default: 127.0.0.1)
    -ah, --admin-html-file <path>  Path to HTML file to customize Admin UI
    --disable-ui                   Disable Admin UI
    --quiet                        Don't show Shoal info
    --verbose                      More verbose output
```

Once the Shoal Manager is running process configuration can be deployed with the `shoal` command.

```
$ shoal deploy examples/ping.json

New processes deployed

$ shoal status

Ping Localhost   [ 2 RUNNING ] 
Ping 127.0.0.1   [ 1 RUNNING ] 
Ping 127.0.0.1   [ 1 RUNNING ] 
Ping Google      [  STOPPED  ] 

```

## Configuration 

The Shoal Manager takes a JSON configuration that allows us to specify which processes should be run and how they should be executed. In Shoal, a *process* is a definition of a command that should be daemonized. One process can have many *instances* that all perform the same job.

Here's an example configuration:

```json
{
  "env": {
    "NODE_ENV": "staging"
  },
  "killTimeoutMs": 30000,
  "quiet": true,
  "logRoot": "/var/log",
  "processes": [
    {
      "name": "Cassandra Worker",
      "cmd": "node",
      "args": ["script/worker.js", "cassandra"],
      "env": {
        "NAME": "$processName",
      },
      "instances": 8,
      "autoRestart": true,
      "autoRestartTimeoutMs": 3000
    },
    {
      "name": "Some Daemon",
      "cmd": "somed",
      "args": ["-f"],
      "killTimeoutMs": 1000,
      "logRoot": "~/log",
      "outFile": "somed.log",
      "errFile": "somed.error",
      "instances": 0
    }
  ]
}
```


## Future

* Improve default security features
* Allow Shoal to dynamically control the number of instances per process definition based on the 'business' of the running instances

## TODO

* Allow Shoal Manager to be started with a starting configuration
* Update documentation
* Setup OSS site
