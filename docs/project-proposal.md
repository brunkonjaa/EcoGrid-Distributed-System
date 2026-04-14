# Project Proposal

## 1. EcoGrid Distributed System

### 1.1 Introduction

I have a strong interest in understanding how systems operate beyond their default configurations, particularly through experience with Android rooting and console modification. This project reflects a similar mindset, where I am designing a system that exposes and controls internal behaviour rather than relying on fixed functionality.

By building EcoGrid as a distributed system with clearly defined communication between services, I am applying this interest in system level understanding to a structured and practical environment.

---

### 1.2 Idea and Purpose

For this project, I am developing a distributed system called **EcoGrid**, based on **United Nations Sustainable Development Goal 7: Affordable and Clean Energy**.

The goal is to reduce unnecessary energy usage in indoor spaces by reacting to real-time temperature and occupancy data. For example, heating should not remain active in an empty room.

EcoGrid is structured as independent services communicating using **gRPC**, allowing clear interaction through defined request and response messages.

---

### 1.3 System Architecture and Services

Each service is defined using **Protocol Buffers (.proto files)**, where services are declared with RPC methods that specify request and response message structures.

The system consists of four services:

---

#### Temperature Service

The Temperature Service provides temperature data.

- **RPC:** `GetCurrentTemperature(zone_id: string)`
- **Example Request:** `"RoomA"`
- **Example Response:**  
  `temperature_value: 19.5`, `unit: "C"`, `timestamp: "2026-04-14T10:00:00Z"`

- **Parameters:**
  - `zone_id (string)` – identifies the location  
  - `temperature_value (double)` – measured temperature  
  - `unit (string)` – measurement unit  
  - `timestamp (string)` – time of reading  

This service will also support **server streaming** for continuous updates.

---

#### Occupancy Service

The Occupancy Service determines whether a space is in use.

- **RPC:** `GetOccupancyStatus(zone_id: string)`
- **Example Request:** `"RoomA"`
- **Example Response:**  
  `occupied: true`, `people_count: 3`, `timestamp: "2026-04-14T10:00:00Z"`

- **Parameters:**
  - `zone_id (string)` – identifies the location  
  - `occupied (bool)` – indicates presence  
  - `people_count (int32)` – number of occupants  
  - `timestamp (string)` – time of reading  

This service will also support **client streaming** to process multiple occupancy events.

---

#### Control Service

The Control Service makes decisions based on system data.

- **RPC:** `DecideEnergyAction(zone_id: string, temperature_value: double, occupied: bool)`
- **Example Request:**  
  `"RoomA", 18.0, true`
- **Example Response:**  
  `action: "HEATING_ON"`, `reason: "Room occupied and below threshold"`

- **Parameters:**
  - `zone_id (string)` – identifies the location  
  - `temperature_value (double)` – current temperature  
  - `occupied (bool)` – occupancy state  
  - `action (string)` – system decision  
  - `reason (string)` – explanation of decision  

This service will also support **bidirectional streaming** for real-time interaction.

---

#### Registry Service

The Registry Service enables service discovery.

- **RPCs:**
  - `RegisterService(service_name: string, host: string, port: int32)`
  - `DiscoverService(service_name: string)`

- **Example Request:**  
  `"temperature-service"`
- **Example Response:**  
  `host: "localhost"`, `port: 50051`

- **Parameters:**
  - `service_name (string)` – identifies the service  
  - `host (string)` – service location  
  - `port (int32)` – service port  

---

### 1.4 Communication Model

The system uses all four gRPC communication types:

- **Unary** – standard request/response  
- **Server Streaming** – continuous temperature updates  
- **Client Streaming** – batch occupancy data  
- **Bidirectional Streaming** – real-time control interaction  

---

### 1.5 Conclusion

EcoGrid demonstrates how distributed services can work together to monitor conditions and respond dynamically to reduce energy waste.

By combining clearly defined services with gRPC communication, the system provides a practical and structured approach to improving energy efficiency.