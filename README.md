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

```bash
npm install shoal
```

## Usage

In order to deploy and monitor processes with one of the user interfaces, you need to run the Shoal Manager. This is done by executing the `shoald` command that's included with the NPM module.

By default, the Shoal Manager listens for commands on port *54047* and also binds the Admin UI on port *54047*:

```
Shoal Manager running on http://127.0.0.1:54047
Shoal Admin UI running on http://127.0.0.1:54048
```

Here are some CLI options that can be given to `shoald`:

```
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

```bash
$ shoal deploy examples/ping.json

New processes deployed

$ shoal status

Ping Localhost   [ 2 RUNNING ] 
Ping 127.0.0.1   [ 1 RUNNING ] 
Ping 127.0.0.1   [ 1 RUNNING ] 
Ping Google      [  STOPPED  ] 

```

## Configuration 

TODO

## Future

* Improve default security features
* Allow Shoal to dynamically control the number of instances per process definition based on the 'business' of the running instances

## TODO

* Update documentation
* Setup OSS site
* Allow
