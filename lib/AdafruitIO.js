/*
 * Quick and dirty support for Adafruit IO.
 */

const https = require('https');

const options = {
  hostname: 'io.adafruit.com',
  port: 443,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

var AIOUser = '';
exports.setAIOUser = user => AIOUser = user;

exports.setAIOKey = key => options.headers['X-AIO-Key'] = key;

exports.updateFeed = (key, value, callback) => {
  doAIORequest(`/feeds/${key}/data`, {
    value: value
  }, callback);
};

exports.updateGroup = (group_key, data, callback) => {
  doAIORequest(`/groups/${group_key}/data`, {
    feeds: Object.keys(data).map(key => ({ key, value: data[key] }))
  }, callback);
};

function doAIORequest (path, data, callback) {
  options.path = `/api/v2/${AIOUser}${path}`;

  const req = https.request(options, res => {
    let rawData = '';
    res.on('data', chunk => { rawData += chunk; });

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);

        if (res.statusCode === 200) {
          callback(undefined, parsedData);
        } else {
          callback(parsedData);
        }
      } catch (e) {
        callback(e.message);
      }
    });
  });

  req.on('error', e => {
    callback(e);
  });

  req.write(JSON.stringify(data));
  req.end();
}
