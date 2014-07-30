
process.on('SIGHUP', function() {
  console.log("Staying alive");
});

process.on('SIGINT', function() {
  console.log("Staying alive");
});

process.on('SIGTERM', function() {
  console.log("Staying alive");
});

while(1) { console.log("Ha"); }
