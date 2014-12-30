/**
 * @file Quick and dirty wrapping of the Weather Underground API.
 * @version 0.0.1
 */

var WeatherUnderground = function (opts) {
  this.api_key = opts.api_key;
  this.location = opts.location;
  this.cache_seconds = opts.cache_seconds || 900;
};

WeatherUnderground.prototype.conditions = function (callback) {
  this._wuAPI('conditions', callback);
};

WeatherUnderground.prototype._wuAPI = function (method, callback) {
  var key = 'wu_' + this.location;
  var cache_seconds = this.cache_seconds;

  if (cache_seconds > 0) {
    var stored_json_data = window.localStorage.getItem(key);
    try {
      var stored_data = JSON.parse(stored_json_data);
      if (stored_data.expiry > Date.now()) {
        callback(stored_data.data);
        return;
      }
    } catch (e) {}
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://api.wunderground.com/api/' + this.api_key + '/' + method + '/q/' + this.location + '.json');
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    if (cache_seconds > 0) {
      window.localStorage.setItem(key, JSON.stringify({
        expiry: Date.now() + cache_seconds * 1000,
        data: this.response
      }));
    }
    callback(this.response);
  };
  xhr.send();
};
