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

## Usage

TODO

## Future

* Improve default security features
* Allow Shoal to dynamically control the number of instances per process definition based on the 'business' of the running instances

## TODO

* Update documentation
* Setup OSS site
