/**
 * Listens for serial data from an IMC Eagle solar water heater controller and
 * uploads it to a waiting server.
 *
 * Assumes an CC3000-based wireless network connectiom shield and serial
 * connection to athe Eagle controller via hardware serial.
 */

#include <Adafruit_CC3000.h>
#include "utility/debug.h"
#include <SPI.h>

#include "keys.h"


#define ADAFRUIT_CC3000_IRQ   3
#define ADAFRUIT_CC3000_VBAT  5
#define ADAFRUIT_CC3000_CS    10

#define IDLE_TIMEOUT_MS       2000

Adafruit_CC3000 cc3000 = Adafruit_CC3000(ADAFRUIT_CC3000_CS, ADAFRUIT_CC3000_IRQ, ADAFRUIT_CC3000_VBAT, SPI_CLOCK_DIVIDER);
Adafruit_CC3000_Client client;

unsigned long lastWebUpdateTime = 0;
char eagle_data[81];
uint8_t data_index = 0;


void setup () {
  Serial.begin(2400);
  Serial.println(F("\nWater Heater Monitor"));

  // CC3000 setup
  Serial.print(F("Initializing network... "));
  if (!cc3000.begin()) {
    Serial.println(F("unable to initialise the CC3000!"));
    while(1);
  }
  if (!cc3000.connectToAP(WLAN_SSID, WLAN_PASS, WLAN_SECURITY)) {
    Serial.println(F("wireless connection failed!"));
    while(1);
  }
  Serial.println(F("wireless connection successful."));

  while (!cc3000.checkDHCP()) {
    delay(100);
  }

  uint32_t ipAddress, netmask, gateway, dhcpserv, dnsserv;
  if (!cc3000.getIPAddress(&ipAddress, &netmask, &gateway, &dhcpserv, &dnsserv)) {
    Serial.println(F("Unable to retrieve network info!"));
  } else {
    Serial.print(F("  IP Addr: ")); cc3000.printIPdotsRev(ipAddress); Serial.println();
  }

  initThermometer();

  Serial.println(F("Waiting for data..."));
}


void loop () {
  unsigned long now = millis();

  // If we haven't updated in 5 minutes, send along a "PING" to keep showing something.
  if (now > lastWebUpdateTime + 300000 || now < lastWebUpdateTime) {
    //strcpy(eagle_data, "0.05  120.0  110.0  12.0  159.0  100.0  110.0  ON  OFF  ");
    //updateWeb();

    data_index = 0;
    eagle_data[data_index] = '\0';
    updateWeb();
  }
}


void serialEvent() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c) UDR0 = c;

    // Assume a LF is the end of the line
    if (c == '\n' && strlen(eagle_data) > 0) {
      // Update once per minute
      // Also, don't send any Eagle header messages we come across.
      unsigned long now = millis();

      if ((now > lastWebUpdateTime + 60000 || now < lastWebUpdateTime) && strncmp(eagle_data, "RUNTIME", 7) != 0) {
        updateWeb();
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


void updateWeb() {
  Serial.println(F("Sending data..."));

  // The Adafruit CC3000 library only supports about 90 bytes in the fastrprint()
  // method, therefore we need two char arrays to hold all the Eagle query args.
  char eagle_query_args1[66] = "&runtime=0:00&coll_t=&stor_t=&diff_t=&hili_t=";
  char eagle_query_args2[66] = "&aux_1=&aux_2=&pump=OFF&uplim=OFF&fault=";

  if (strlen(eagle_data) > 0) {
    char *tokenptr;

    sprintf(eagle_query_args1, "&runtime=%s&coll_t=%s&stor_t=%s&diff_t=%s&hili_t=%s",
      strtok_r(eagle_data, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr)
    );

    sprintf(eagle_query_args2, "&aux_1=%s&aux_2=%s&pump=%s&uplim=%s&fault=%s",
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr),
      strtok_r(NULL, " ", &tokenptr)
    );
  }

  // Convert the temerature float to something fastrprint likes
  char temp_str[7]; // "123.45"
  dtostrf(getTemperature(), 1, 2, temp_str);

  client.connect(PHANT_HOST, PHANT_HOST_PORT);
  if (client.connected()) {
    client.fastrprint(F("GET /input/")); client.fastrprint(PHANT_PUBLIC_KEY);
    client.fastrprint(F("?private_key=")); client.fastrprint(PHANT_PRIVATE_KEY);
    client.fastrprint(eagle_query_args1);
    client.fastrprint(eagle_query_args2);
    client.fastrprint(F("&ambient_t=")); client.fastrprint(temp_str);
    client.fastrprint(F(" HTTP/1.1\r\n"));

    client.fastrprint(F("Host: ")); client.fastrprintln(PHANT_HOST);

    client.fastrprint("\r\n");

    // Show the response
    unsigned long lastRead = millis();
    while (client.connected() && (millis() - lastRead < IDLE_TIMEOUT_MS)) {
      while (client.available()) {
        char c = client.read();
        Serial.print(c);
        lastRead = millis();
      }
    }

    client.close();
    lastWebUpdateTime = millis();
    Serial.println(F("Done."));
  } else {
    Serial.println(F("Web server connection failed."));
  }
}
