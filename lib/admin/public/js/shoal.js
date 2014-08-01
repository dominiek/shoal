

var Status = function($el) {
  this.$el = $el;
  this.$el.append('<ul class="processes">');
};

Status.prototype.update = function() {
  $.get("/status", function(res) {
    if (res.error) {
      return alert(res.error.message);
    }
    this._configuration = res.result;
    this.render();
  }.bind(this), 'json')
};

Status.prototype.render = function() {
  var $ul = this.$el.find('ul');
  var html = '';
  if (!this._configuration) {
    html = '<p class="not-set">No configuration deployed yet</p>';
    $ul.html(html);
    return;
  }
  this._configuration.processes.forEach(function(process) {
    var className = 'process';
    var numRunningInstances = (process.runningInstances && process.runningInstances.length) || 0;
    if (numRunningInstances) {
      className += ' running';
    } else {
      className += ' stopped';
    }
    var li = '<li class="'+className+'"><span class="name">'+process.name+'</span> <span class="instances"><span class="'+numRunningInstances+'-running count">'+(numRunningInstances || '')+'</span></span></li>'
    html += li;
  });
  $ul.html(html);
};

Status.prototype.start = function() {
  this.update();
  this._interval = setInterval(this.update.bind(this), 2000);
};

$(document.body).ready(function() {
  var status = new Status($('.status'));
  status.start();
});