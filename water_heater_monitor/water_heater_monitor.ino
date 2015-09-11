/**
 * Listens for serial data from an IMC Eagle solar water heater controller and
 * uploads it to a waiting server.
 *
 * Assumes a Sparkfun EST8266 Thing and a serial connection to an Eagle controller via hardware serial.
 */

#include <ESP8266WiFi.h>
#include <Phant.h>
#include <DHT.h>

#include "keys.h"

const int LED_PIN = 5;                 // Thing's onboard, green LED
unsigned long lastUpdateTime = 0;
char eagle_data[81];
uint8_t data_index = 0;

DHT dht = DHT(4, DHT22);               // Pin 4, DHT 22 (AM2302)

void setup () {
  initHardware();
  connectWiFi();
}

void loop () {
  delay(100);
}

void serialEvent() {
  while (Serial.available()) {
    char c = Serial.read();

    // Assume a LF is the end of the line
    if (c == '\n' && strlen(eagle_data) > 0) {
      // Update once per minute
      //
      // Don't send any Eagle header messages we come across.  Also, make sure
      // there's a : character in the string. It's always the 2nd or 3rd
      // character so it goes a long way in assuming we have a full set of data.

      unsigned long now = millis();

      if ((now > lastUpdateTime + 60000 || now < lastUpdateTime) && strncmp(eagle_data, "RUNTIME", 7) != 0 && strchr(eagle_data, ':') != NULL) {
        postToPhant();
      }

      // Reset the data
      data_index = 0;
      eagle_data[data_index] = '\0';
    } else if (c != '\r') {
      // Capture everything else (but not a CR)
      if (data_index < 80) {
        eagle_data[data_index++] = c;
      } else {
        // This case should never happen, but avoid the overrun just the same :)
        data_index = 0;
      }
      eagle_data[data_index] = '\0';
    }
  }
}

void initHardware() {
  Serial.begin(2400);
  pinMode(LED_PIN, OUTPUT);
  dht.begin();
}

void connectWiFi() {
  byte ledStatus = LOW;

  // Set WiFi mode to station (as opposed to AP or AP_STA)
  WiFi.mode(WIFI_STA);

  // WiFI.begin([ssid], [passkey]) initiates a WiFI connection
  // to the stated [ssid], using the [passkey] as a WPA, WPA2,
  // or WEP passphrase.
  WiFi.begin(WiFiSSID, WiFiPSK);

  // Use the WiFi.status() function to check if the ESP8266
  // is connected to a WiFi network.
  while (WiFi.status() != WL_CONNECTED) {
    // Blink the LED
    digitalWrite(LED_PIN, ledStatus); // Write LED high/low
    ledStatus = (ledStatus == HIGH) ? LOW : HIGH;

    // Delays allow the ESP8266 to perform critical tasks
    // defined outside of the sketch. These tasks include
    // setting up, and maintaining, a WiFi connection.
    delay(100);
    // Potentially infinite loops are generally dangerous.
    // Add delays -- allowing the processor to perform other
    // tasks -- wherever possible.
  }

   digitalWrite(LED_PIN, LOW);
}

int postToPhant() {
  char *tokenptr;
  
  // LED turns on when we enter, it'll go off when we
  // successfully post.
  digitalWrite(LED_PIN, HIGH);

  // Declare an object from the Phant library - phant
  Phant phant(PhantHost, PublicKey, PrivateKey);

  if (strlen(eagle_data) > 0) {
    phant.add("runtime", strtok_r(eagle_data, " ", &tokenptr));
    phant.add("coll_t",  strtok_r(NULL, " ", &tokenptr));
    phant.add("stor_t",  strtok_r(NULL, " ", &tokenptr));
    phant.add("diff_t",  strtok_r(NULL, " ", &tokenptr));
    phant.add("hili_t",  strtok_r(NULL, " ", &tokenptr));
    phant.add("aux_1",   strtok_r(NULL, " ", &tokenptr));
    phant.add("aux_2",   strtok_r(NULL, " ", &tokenptr));
    phant.add("pump",    strtok_r(NULL, " ", &tokenptr));
    phant.add("uplim",   strtok_r(NULL, " ", &tokenptr));
    phant.add("fault",   strtok_r(NULL, " ", &tokenptr));
  } else {
    phant.add("runtime", "0:00");
    phant.add("pump",    "OFF");
    phant.add("uplim",   "OFF");
  }
  phant.add("ambient_t", dht.readTemperature(true));

  // Now connect to data.sparkfun.com, and post our data:
  WiFiClient client;

  if (!client.connect(PhantHost, PhantPort)) {
    // If we fail to connect, return 0.
    digitalWrite(LED_PIN, LOW);
    return 0;
  }

  // If we successfully connected, print our Phant post:
  client.print(phant.post());

  // Before we exit, turn the LED off.
  digitalWrite(LED_PIN, LOW);
  return 1; // Return success
}

