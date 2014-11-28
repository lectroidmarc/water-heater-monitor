/**
 *
 */

var Phant = function (settings) {
  this.url = settings.url;
  this.public_key = settings.public_key;
  this.private_key = settings.private_key;
};

Phant.prototype.fetch = function (params, callback) {
  var parameters = new Parameters(params);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.url + '/output/' + this.public_key + '.json?' + parameters.serialize());
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    callback(this.response);
  };
  xhr.send();
};

Phant.prototype.update = function (params, callback) {
  var parameters = new Parameters(params);

  var xhr = new XMLHttpRequest();
  xhr.open('POST', this.url + '/input/' + this.public_key + '.json');
  xhr.setRequestHeader('Phant-Private-Key', this.private_key);
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    callback(this.response);
  };
  xhr.send(parameters.formData());
};

Phant.prototype.clear = function (callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('DELETE', this.url + '/input/' + this.public_key + '.json');
  xhr.setRequestHeader('Phant-Private-Key', this.private_key);
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    callback(this.response);
  };
  xhr.send();
};

Phant.prototype.getStats = function (callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.url + '/output/' + this.public_key + '/stats.json');
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    callback(this.response);
  };
  xhr.send();
};

Phant.prototype.enableRealtime = function (callback) {
  var self = this;

  var script = document.createElement('script');
  script.setAttribute('src', this.url + '/js/phant-manager.min.js');
  script.async = true;
  script.onload = function (e) {
    if (typeof mows !== 'undefined') {
      this._client = mows.createClient(self.url.replace(/^http/, 'ws'));
      this._client.subscribe('output/' + self.public_key);

      this._client.on('message', function (topic, message) {
        callback(JSON.parse(message));
      });
    }
  };

  document.body.appendChild(script);
};
