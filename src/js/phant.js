/**
 * @file Contains the Phant class.
 * @version 1.2.0
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
 * @param {Phant~requestCallback} [callback] - A callback to call if there is an error.
 */
Phant.prototype.fetch = function (params, callback, errorCallback) {
  var self = this;
  var parameters = new Parameters(params);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', this.url + '/output/' + this.public_key + '.json?' + parameters.serialize());
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    if (Array.isArray(this.response) && this.response.length > 0) {
      self._current_data_timestamp = this.response[0].timestamp;
    }
    callback(this.response);
  };
  xhr.onerror = function (e) {
    if (typeof errorCallback === 'function') {
      errorCallback();
    }
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
 * Enables real time updates via Web Sockets.
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
 * Starts polling for updates.  Useful if web sockets aren't available.
 * @param {Object} params - An object contaning phant parameters.
 * @param {Phant~requestCallback} callback - A callback to call after the Phant call is done.
 * @param {number} [interval] - The polling interval (defaults to 60 seconds.
 */
Phant.prototype.startPolling = function (params, callback, interval) {
  var self = this;

  this._poll_timeout = window.setTimeout(function () {
    if (self._current_data_timestamp) {
      var filtered_params = params || {};
      filtered_params['gt[timestamp]'] = self._current_data_timestamp;

      self.fetch(filtered_params, function (data) {
        self.startPolling(params, callback, interval);
        callback(data);
      });
    } else {
      self.startPolling(params, callback, interval);
    }
  }, interval || 60000);
};

/**
 * Stops polling.
 */
Phant.prototype.stopPolling = function () {
  window.clearTimeout(this._poll_timeout);
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
