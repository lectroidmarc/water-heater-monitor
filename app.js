
const SerialPort = require('serialport');
const sensor = require('node-dht-sensor');
const aio = require('./lib/AdafruitIO');
const config = require('./config.json');

aio.setAIOUser(config.AIO.User);
aio.setAIOKey(config.AIO.Key);

var lastUpdateTime = 0;

const parser = new SerialPort.parsers.Readline({
  delimiter: '\r\n'
});
const port = new SerialPort(config.serialport, {
  baudRate: 2400
});
port.pipe(parser);
port.on('open', () => console.log(`Port ${config.serialport} open`));
port.on('error', err => console.warn('Error: ', err.message));

parser.on('data', line => {
  var runtime;
  var collectorTemp;
  var storageTemp;
  var differentialTemp;
  var highLimitTemp;
  var aux1Temp;
  var aux2Temp;
  var upLimit;
  var fault;

  // console.log(line);

  if (line.indexOf('FAULT') === -1) {
    let fields = line.split(/\s+/);
    if (fields.length === 10) {
      [runtime,
        collectorTemp,
        storageTemp,
        differentialTemp,
        highLimitTemp,
        aux1Temp,
        aux2Temp,
        pump,
        upLimit,
        fault] = fields;

      if (Date.now() > lastUpdateTime + config.updateInterval) {
        let temperatureData = {
          'coll-t': collectorTemp,
          'stor-t': storageTemp,
          'aux-1': aux1Temp,
          'aux-2': aux2Temp,
          'pump': pump,
          'uplim': upLimit,
          'fault': fault || 'OK'
        };

        sensor.read(config.DHT.type, config.DHT.pin, (err, temperature, humidity) => {
          if (!err) {
            temperatureData.ambient = ctof(temperature).toFixed(1);
          }
          aio.updateGroup('water-heater-monitor', temperatureData, (err, res) => {
            lastUpdateTime = Date.now();
            if (err) {
              console.warn(err);
            }
          });
        });
      }
    }
  }
});

// Since the Eagle Controller is itself powered by solar power, it shuts off at
// night, but we can still send ambient temps to AIO.
setInterval(() => {
  if (Date.now() > lastUpdateTime + config.pingInterval) {
    sensor.read(config.DHT.type, config.DHT.pin, (err, temperature, humidity) => {
      if (!err) {
        aio.updateFeed('water-heater-monitor.ambient', ctof(temperature).toFixed(1), (err, res) => {
          if (err) {
            console.warn(err);
          }
        });
      }
    });
  }
}, config.pingInterval);

function ctof (temp) {
  return temp * 9 / 5 + 32;
}
