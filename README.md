Shoal
==========

[![Build Status](https://travis-ci.org/dominiek/shoal.png?branch=master)](https://travis-ci.org/dominiek/shoal)

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
    -c, --config <path>            Run Manager with this initial configuration
    -p, --port <port>              Port to bind on (Default: 54047)
    -b, --bind <host>              Host to bind on (Default: 127.0.0.1)
    -ap, --admin-port <port>       Port to bind Admin UI on (Default: 54048)
    -ab, --admin-bind <host>       Host to bind Admin UI on (Default: 127.0.0.1)
    -ah, --admin-html-file <path>  Path to HTML file to customize Admin UI
    --disable-ui                   Disable Admin UI
    --quiet                        Don't show Shoal info
    --verbose                      More verbose output

```

Once the Shoal Manager is running process configuration can be deployed with the `shoal deploy` command:

```
shoal deploy examples/simple/processes.json
```

A status of current processes and number of instances can be retrieved using the `shoal status` command:


```
shoal status
```

![Build Status](http://dominiek.github.io/shoal/images/screenshot-cli.png)

Alternatively, you can use the Admin Web UI to view and control processes (Defaults to http://localhost:54048/):

![Build Status](http://dominiek.github.io/shoal/images/screenshot-mobile-web.png)

## Configuration 

The Shoal Manager takes a JSON configuration that allows us to specify which processes should be run and how they should be executed. In Shoal, a *process* is a definition of a command that should be daemonized. One process can have many *instances* that all perform the same job.

Here's an example configuration:

```json
{
  "env": {
    "NODE_ENV": "staging"
  },
  "killTimeoutMs": 30000,
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
Each process in the `processes` array takes the following required parameters:

|Parameter    |Description                                |
|-------------|-------------------------------------------|
|name         |Name of the process/worker|
|cmd          |Unix command to be executed without parameters (can be absolute path too)|
|args         |Array of arguments to be given to the unix command|
|instances    |The number of instances of this process that should be run. Can be 0 for inactive process definitions|

The following options can be given either in the top-level JSON or in the indvidual process definitions (overrides global settings):

|Option                   |Defaults |Description                                |
|-------------------------|---------|--------------------------------------------|
|env                      |{}       |Hash with environment variables that should be used. See below for available Macros|
|killTimeoutMs            |         |Number of miliseconds after which a unresponsive process instance (not responding to SIGHUP) should be send a SIGKILL|
|autoRestart              |false    |Automatically restart a process instance after exit|
|autoRestartTimeoutMs     |1000     |Number of miliseconds to wait until restarting the process instance|
|logRoot                  |         |Specify output logging directory. When specified each process will have stdout and stderr send to respective `process-name.out` and `process-name.err` files|
|outFile                  |$processShortName.out|Override default stdout output file. Requires logRoot to be set|
|errFile                  |$processShortName.err|Override default stderr output file. Requires logRoot to be set|
|quiet                    |false    |Don't show any output from shoal manager server or admin UI|

### Environment Macros

When configuring custom environment variables for a process or configuration, you can use the following internal variables/macros:

|Variable         |Description                     |
|-----------------|--------------------------------|
|$processName     |Configured name of the process|
|$processShortName|A dashed and lowercase conversion of the processName (e.g. My Worker => 'my-worker')|
|$processId       |A unique ID of the process based on the name, cmd and env|
|$shoalCwd        |The working directory path that the Shoal Manager is running in|
|$shoalVersion    |Shoal version|
|$logRoot         |The configured log root for the process|

## Future

* Improve default security features
* Allow Shoal to dynamically control the number of instances per process definition based on the 'business' of the running instances

## License

(The MIT License)

Copyright (c) 2014 Dominiek ter Heide <dominiek@bottlenose.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
