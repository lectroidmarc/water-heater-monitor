Water Heater Monitor
----
This code uses a Raspberry Pi to fetch sensor data from a solar water heater and then put it all somewhere online so we can see pretty graphs from it.

#### The Solar Water Heater

The water heater is managed by an [IMC Instruments](http://www.solar.imcinstruments.com/) Eagle-2 controller.  The Eagle has a proprietary data port -- accessable with a proprietary RS-232 adaptor cable -- that provides a bevy of sensor information either once every two seconds or once every six minutes (hardware selectable).

#### The Pi

In my case I use a Pi3, but any Pi should work.  Also needed is a USB to RS232 adaptor cable.

#### The Ambient Temperature Sensor

I use an [AM2302](https://www.adafruit.com/product/393) to also sample the ambient temperature around the water heater itself.

Note that this requires [node-dht-sensor](https://github.com/momenso/node-dht-sensor) which in turn requires the [bcm2835 library](http://www.airspayce.com/mikem/bcm2835/) to build.

#### The Data Store

Once upon a time I used Sparkfun's data service, but that went away.  So now I use [Adafruit IO](https://io.adafruit.com/) which provides a huge number of features, including built-in dashboards.

The data on Adafruit IO is updated once per minute.  There are 5 temperature feeds for **Collector Temperature** (coll-t), **Storage Temperature** (stor-t), **Water Temperature** (aux-2), **Coolant Return Temperature** (aux-1), **Ambient Temperature** (ambient) and **CPU Temp** (cpu).  Additionally there are 3 status feeds for **Pump Status** (pump), **Upper Limit Status** (uplim) and **Fault Status** (fault).

-30-
