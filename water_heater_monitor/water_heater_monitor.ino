/**
 * Listens for serial data from an IMC Eagle solar water heater controller and
 * uploads it to a waiting server.
 *
 * Assumes an CC3000-based wireless network connectiom shield and serial connection
 * via SoftwareSerial on pins 6 and 7.
 */

#include <Adafruit_CC3000.h>
#include <SPI.h>
#include <SoftwareSerial.h>

#include "keys.h"


#define ADAFRUIT_CC3000_IRQ   3
#define ADAFRUIT_CC3000_VBAT  5
#define ADAFRUIT_CC3000_CS    10

#define IDLE_TIMEOUT_MS  3000

Adafruit_CC3000 cc3000 = Adafruit_CC3000(ADAFRUIT_CC3000_CS, ADAFRUIT_CC3000_IRQ, ADAFRUIT_CC3000_VBAT, SPI_CLOCK_DIVIDER);
Adafruit_CC3000_Client client;

SoftwareSerial data_port(6, 7);
unsigned long lastWebUpdateTime = 0;
char eagle_data[81];
uint8_t data_index = 0;


void setup () {
  Serial.begin(115200);
  Serial.println(F("\nWater Heater Monitor"));

  // CC3000 setup
  Serial.print(F("initializing network... "));
  if (!cc3000.begin()) {
    Serial.println(F("unable to initialise the CC3000! Check your wiring?"));
    while(1);
  }
  if (!cc3000.connectToAP(WLAN_SSID, WLAN_PASS, WLAN_SECURITY)) {
    Serial.println(F("wireless connection failed!"));
    while(1);
  }
  Serial.println(F("wireless connection successful."));

  while (!cc3000.checkDHCP()) {
    delay(100); // TODO: Insert a DHCP timeout!
  }

  uint32_t ipAddress, netmask, gateway, dhcpserv, dnsserv;
  if(!cc3000.getIPAddress(&ipAddress, &netmask, &gateway, &dhcpserv, &dnsserv)) {
    Serial.println(F("Unable to retrieve network info!"));
  } else {
    Serial.print(F("  IP Addr: ")); cc3000.printIPdotsRev(ipAddress);
    Serial.print(F("/"));           cc3000.printIPdotsRev(netmask);   Serial.println();
    Serial.print(F("  Gateway: ")); cc3000.printIPdotsRev(gateway);   Serial.println();
    Serial.print(F("  DHCPsrv: ")); cc3000.printIPdotsRev(dhcpserv);  Serial.println();
    Serial.print(F("  DNSserv: ")); cc3000.printIPdotsRev(dnsserv);   Serial.println();
  }

  initThermometer();

  // Data port setup
  data_port.begin(2400);

  Serial.println(F("Waiting for data..."));
}


void loop () {
  unsigned long now = millis();

  // If we haven't updated in 5 minutes, send along a "PING" to keep showing something.
  if (now > lastWebUpdateTime + 300000 || now < lastWebUpdateTime) {
    data_index = 0;
    eagle_data[data_index] = '\0';
    updateWeb();
  }

  if (data_port.available()) {
    char c = data_port.read();
    if (c) UDR0 = c;

    // Assume a LF is the end of the line
    if (c == '\n' && strlen(eagle_data) > 0) {
      // Update once per minute
      // Also, don't send any Eagle header messages we come across.
      if ((now > lastWebUpdateTime + 60000 || now < lastWebUpdateTime) && strncmp(eagle_data, "RUNTIME", 7) != 0) {
        updateWeb();
      }

      // Reset the data
      data_index = 0;
      eagle_data[data_index] = '\0';
    } else if (c != '\r') {
      // Capture everything else (but not a CR)
      eagle_data[data_index++] = c;
      eagle_data[data_index] = '\0';
    }
  }
}


void updateWeb() {
  Serial.println(F("Sending data... "));

  client.connect(PHANT_HOST, PHANT_HOST_PORT);
  if (client.connected()) {
    lastWebUpdateTime = millis();

    // Convert the temerature float to something fastrprint likes
    char temp_str[7]; // "123.45"
    dtostrf(getTemperature(), 1, 2, temp_str);

    client.fastrprint(F("GET /input/")); client.fastrprint(PHANT_PUBLIC_KEY);
    client.fastrprint(F("?private_key=")); client.fastrprint(PHANT_PRIVATE_KEY);
    client.fastrprint(F("&ambient_t=")); client.fastrprint(temp_str);

    if (strlen(eagle_data) == 0) {
      client.fastrprint(F("&runtime=0:00&coll_t=&stor_t=&diff_t=&hili_t=&aux_1=&aux_2=&pump=OFF&uplim=OFF&fault="));
    } else {
      char *tokenptr;

      client.fastrprint(F("&runtime=")); client.fastrprint(strtok_r(eagle_data, " ", &tokenptr));
      client.fastrprint(F("&coll_t=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&stor_t=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&diff_t=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&hili_t=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&aux_1=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&aux_2=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&pump=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));
      client.fastrprint(F("&uplim=")); client.fastrprint(strtok_r(NULL, " ", &tokenptr));

      // fault can be null and fastrprint pukes on NULL
      client.fastrprint(F("&fault="));
      char *fault = strtok_r(NULL, " ", &tokenptr);
      if (fault != NULL) {
        client.fastrprint(fault);
      }
    }
    client.fastrprintln(F(" HTTP/1.1"));

    client.fastrprint(F("Host: ")); client.fastrprintln(PHANT_HOST);
    client.fastrprintln("");

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
    Serial.println(F("Done."));
  } else {
    Serial.println(F("Web server connection failed."));
  }

  data_port.flush();  // clear any data in the serial buffer we missed while sending.
}
