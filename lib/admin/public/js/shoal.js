

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
  $ul.html('');
  this._configuration.processes.forEach(function(process) {
    var className = 'process';
    var numRunningInstances = (process.runningInstances && process.runningInstances.length) || 0;
    if (numRunningInstances) {
      className += ' running';
    } else {
      className += ' stopped';
    }
    var li = '<li class="'+className+'">';
    li += '<div class="info">';
    li += '<span class="name">'+process.name+'</span> ';
    li += '<span class="instances"><span class="'+numRunningInstances+'-running count">'+(numRunningInstances || '')+'</span></span>';
    li += '</div>';
    li += '</li>';

    var $controls = $('<div class="controls"></div>');

    $controls.append($('<a class="inc" href="#">').click(function() {
      process.instances++;
      this.deploy();
      return false;
    }.bind(this)));

    $controls.append($('<a class="dec" href="#">').click(function() {
      if (process.instances > 0)
        process.instances--;
      this.deploy();
      return false;
    }.bind(this)));

    var $li = $(li);
    $li.append($controls);
    $ul.append($li);
  }.bind(this));
};

Status.prototype.deploy = function() {
  var newConfiguration = JSON.parse(JSON.stringify(this._configuration));
  newConfiguration.processes.forEach(function(process) {
    delete process.runningInstances;
    delete process.id;
  });
  $.ajax({
    method: 'POST',
    url: '/deploy', 
    data: JSON.stringify(newConfiguration),
    contentType : 'application/json'
  }, function(res) {
    if (res.error) {
      return alert(res.error.message);
    }
    this.update();
  }.bind(this), 'json')
};

Status.prototype.start = function() {
  this.update();
  this._interval = setInterval(this.update.bind(this), 2000);
};

$(document.body).ready(function() {
  var status = new Status($('.status'));
  status.start();
});