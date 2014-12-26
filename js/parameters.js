/**
 * @file Contains the Paramters class.
 * @version 1.0.0
 */

/**
 * Creates a Parameter object.
 * @params {object} [params] An object containing the name=value parameters.
 * @class
 */
var Parameters = function (params) {
  this.params = (typeof params === 'object') ? params : {};
};

/**
 * Sets an individual named parameter
 * @param {string} name - The name of the parameter.
 * @param {string} value - The value of the parameter.
 */
Parameters.prototype.set = function (name, value) {
  this.params[name] = value;
};

/**
 * Serializes the parameters into a URL-safe string.  Suitable for use in a GET request.
 * @returns {string}
 */
Parameters.prototype.serialize = function () {
  var array = [];

  for (var x in this.params) {
    if (this.params.hasOwnProperty(x)) {
      array.push(encodeURIComponent(x) + '=' + encodeURIComponent(this.params[x]));
    }
  }

  return array.join('&');
};

/**
 * Creates a FormData object fromt the loaded parameters.
 * @returns {FormData}
 */
Parameters.prototype.formData = function () {
  var formData = new FormData();

  for (var x in this.params) {
    if (this.params.hasOwnProperty(x)) {
      formData.append(x, this.params[x]);
    }
  }

  return formData;
};
