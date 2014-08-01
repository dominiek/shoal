Shoal
==========

Shoal allows you to group and run multiple processes. Shoal manages these processes and exposes controls and status information via a HTTP JSON API. Aside from the JSON interface there is a Web user interface and a CLI.

Use-cases:

* Simplifying process/worker management for developers (e.g. local installs of ETL's)
* Managing all processes/workers into a single JSON config file instead of hundreds of upstart scripts
* A slick UI to see the status of processes and control them

Future:

* Smart transitions from one JSON configuration to the other (e.g. stopping workers that were removed from the configuration after a deployment)
* Control/status of processes across multiple machines

### Status

This is still under heavy development. Do not run this in a production environment.


### TODO

* Allow internal variables to be used in configuration template
* Setup Travis CI
* Update documentation
* Setup OSS site
