/**
 * Wrapper for a thermometer.
 *
 * In this case it's a BMP085 barometric sensor, because that's what I had laying around.
 */

#include <Wire.h>
#include <I2Cdev.h>
#include <BMP085.h>

BMP085 barometer;
boolean hasThermometer;

boolean initThermometer () {
  Serial.print(F("Setting up BMP085 for temperature..."));

  Wire.begin();
  barometer.initialize();

  if (barometer.testConnection()) {
    // request temperature
    barometer.setControl(BMP085_MODE_TEMPERATURE);

    // wait appropriate time for conversion (4.5ms delay)
    int32_t lastMicros = micros();
    while (micros() - lastMicros < barometer.getMeasureDelayMicroseconds());

    Serial.println(F(" done."));
    hasThermometer = true;
  } else {
    Serial.println(F(" error."));
    hasThermometer = false;
  }

  return hasThermometer;
}

float getTemperature () {
  return (hasThermometer) ? barometer.getTemperatureF() : 0.0;
}
