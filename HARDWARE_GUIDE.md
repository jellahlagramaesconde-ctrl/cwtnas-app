# CWTNAS - Smart Bin Sensor Guide (Updated for Arduino Nano)

This guide helps you set up your hardware. Since you are using an **Arduino Nano** instead of the MKR 1000, please follow these specific steps.

---

## 1. Troubleshooting: Laptop Not Recognizing Nano
If your laptop doesn't see the Arduino Nano when plugged in, it is likely one of two issues:

### A. The CH340 Driver (Most Common)
Most Arduino Nano clones use the **CH340 USB-to-Serial chip**. Windows and Mac often don't have this driver pre-installed.
1.  Search Google for "**CH340 Driver Download**".
2.  Download and install the driver for your OS (Windows/Mac/Linux).
3.  Restart your Arduino IDE.
4.  In Arduino IDE, go to **Tools > Port**. You should now see a COM port available.

### B. The USB Cable
Many "5-pin micro USB" cables are **charging cables only** and do not have data wires inside. 
*   Try a different cable (one that you know works for transferring files from a phone or camera).

### C. Processor Selection
In the Arduino IDE, go to **Tools > Processor**. 
*   If "ATmega328P" doesn't work, try selecting **"ATmega328P (Old Bootloader)"**.

---

## 2. Hardware Wiring (Arduino Nano)

### Component List:
*   Arduino Nano
*   HC-SR04 Ultrasonic Sensor
*   Battery Holder (AAA)
*   Switch
*   Jumper Wires

### Wiring Diagram:
1.  **Ultrasonic Sensor:**
    *   **VCC** -> Nano **5V**
    *   **GND** -> Nano **GND**
    *   **Trig** -> Nano **D2**
    *   **Echo** -> Nano **D3**

2.  **Power & Switch:**
    *   **Battery Red (+)** -> One pin of the **Switch**
    *   **Other pin of Switch** -> Nano **Vin** pin
    *   **Battery Black (-)** -> Nano **GND** pin

---

## 3. The Code (Nano Version)

**Important Note:** The Arduino Nano does not have WiFi. This code will measure the distance and send it to your laptop via the **Serial Monitor**. 

```cpp
// --- BIN SETTINGS ---
const int BIN_HEIGHT_CM = 30; // Depth of your bin in CM

// --- PINS ---
const int trigPin = 2;
const int echoPin = 3;

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  Serial.println("--- CWTNAS SMART BIN INITIALIZED (NANO) ---");
}

void loop() {
  // 1. MEASURE DISTANCE
  long duration;
  int distanceCm;
  
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH);
  
  // Speed of sound is 0.034 cm/us
  distanceCm = duration * 0.034 / 2;
  
  // 2. CALCULATE PERCENTAGE
  if (distanceCm > BIN_HEIGHT_CM) distanceCm = BIN_HEIGHT_CM;
  if (distanceCm < 2) distanceCm = 2; // Sensor minimum range
  
  // Map distance to percentage (High distance = Low fill)
  int fillLevel = map(distanceCm, BIN_HEIGHT_CM, 2, 0, 100);
  
  // Clamp values
  if (fillLevel < 0) fillLevel = 0;
  if (fillLevel > 100) fillLevel = 100;

  // 3. OUTPUT TO SERIAL
  // To get this data to the web app, you would normally use a 
  // "Serial-to-Firebase" bridge script on your computer.
  Serial.print("DISTANCE_CM:");
  Serial.print(distanceCm);
  Serial.print("|FILL_PERCENT:");
  Serial.println(fillLevel);

  delay(2000); // Wait 2 seconds
}
```

## 4. How to get this data online?
Because the Nano has no WiFi, the "Smart Bin Monitor" page in the web app won't see it automatically. To fix this, you have two options:
1.  **Buy a WiFi Module:** Purchase an **ESP8266 (ESP-01)** module and connect it to the Nano.
2.  **USB Bridge:** Run a simple Python script on your laptop that reads the Serial data from the USB port and sends it to the Firebase URL provided in `services/firebase.ts`.