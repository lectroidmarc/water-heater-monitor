Water Heater Monitor
----
This code uses an Arduino to fetch sensor data from a solar water heater and then puts it somewhere online so we can make pretty graphs from it.

##### The Solar Water Heater

The water heater is managed by an [IMC Instruments](http://www.solar.imcinstruments.com/) Eagle-2 controller.  The Eagle has a proprietary data port -- accessable with a proprietary RS-232 adaptor cable -- that provides a bevy of sensor information either once every two seconds or once every six minutes (hardware selectable).

##### The Arduino

In my case an [Arduino UNO](http://arduino.cc/en/Main/ArduinoBoardUno) with an [Adafruit CC3000 WiFi Shield](https://www.adafruit.com/products/1491) listens to the data port via a [Sparkfun RS232 Shifter](https://www.sparkfun.com/products/449).

##### The Data Store

I use a [Phant](https://github.com/sparkfun/phant) based data store to store the data, specifically the free service offered by [data.sparkfun.com](https://data.sparkfun.com) -- tho you can use any.  This makes the data accessable for those pretty graphs.

##### The Graphs

Speaking of graphs, the page at [http://lectroid.github.io/water-heater-monitor](http://lectroid.github.io/water-heater-monitor) uses [Highcharts](http://www.highcharts.com/) to display the data.  Of course you'll need your own Phant keys to access your own data.
