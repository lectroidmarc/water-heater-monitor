/**
 * Wrapper for a thermometer.
 *
 * In this case it's a BMP085 barometric sensor, because that's what I had laying around.
 */

#include <Wire.h>
#include <Adafruit_BMP085.h>

Adafruit_BMP085 barometer;
boolean hasThermometer;

boolean initThermometer () {
  Serial.print(F("Setting up BMP085 for temperature..."));

  if (barometer.begin()) {
    Serial.println(F(" done."));
    hasThermometer = true;
  } else {
    Serial.println(F(" error."));
    hasThermometer = false;
  }

  return hasThermometer;
}

float getTemperature () {
  return (hasThermometer) ? barometer.readTemperature() * 9 / 5 + 32 : 0.0;
}
