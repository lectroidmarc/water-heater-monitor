/**
 * @file Contains the Phant class.
 * @version 1.0.0
 */

/**
 * Creates a Phant object.
 * @param {Phant~settings} settings - Initial setings used to create the object.
 * @class
 */
var Phant = function (settings) {
  this.url = settings.url;
  this.public_key = settings.public_key;
  this.private_key = settings.private_key;
};

/**
 * Fetches data from a Phant server.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 */
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

/**
 * Sends data to the Phant server.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 */
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

/**
 * Erases all the data on the Phant server.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 */
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

/**
 * Get Phant stats.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 */
Phant.prototype.getStats = function (callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.url + '/output/' + this.public_key + '/stats.json');
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    callback(this.response);
  };
  xhr.send();
};

/**
 * Enables real time udpates via Web Sockets.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 */
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

/**
 * Phant settings options.
 * @typedef {Object} Phant~settings
 * @property {string} url - The URL of the Phant server.
 * @property {string} public_key - The public key to use on the Phant server.
 * @property {string} [private_key] - The private key to use on the Phant server.
 */

/**
 * Callback called with the Phant server response data.
 * @callback Phant~requestCallback
 * @param {Object} data - The response data from the Phant server
 */
