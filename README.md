# EcoGrid Distributed System

## Overview

EcoGrid is a distributed system designed to optimise energy usage based on environmental and occupancy data.

Aligned SDG:

* SDG 7: Affordable and Clean Energy

---

## System Architecture

The system consists of the following components:

* Temperature Service — Provides temperature data for a given area
* Occupancy Service — Streams real-time occupancy updates for an area
* Control Service — Processes incoming data and determines energy actions
* Registry Service — Handles service registration and discovery
* Client — Acts as a controller to interact with all services

---

## Communication

* Protocol: gRPC
* Data Format: Protocol Buffers (.proto)
* Architecture: Microservices with RPC-based communication

---

## RPC Design (Final)

Each service is mapped to a specific RPC type:

* Temperature Service → Unary RPC  
  - Client requests current temperature for an area  
  - Server returns a single response  

* Occupancy Service → Server Streaming RPC  
  - Client subscribes once  
  - Server streams continuous occupancy updates (event-based + interval)  

* Control Service → Client Streaming RPC  
  - Client sends multiple data inputs (temperature + occupancy)  
  - Server returns a single control decision  

* Registry Service → Bidirectional Streaming RPC  
  - Services register themselves dynamically  
  - Client can discover available services in real-time  

---

## Current State

* Project structure created and organised into microservices
* All services and client initialised with Node.js
* gRPC dependencies installed across all components
* RPC architecture fully defined and aligned with CA requirements
* Streaming behaviour defined for Occupancy Service
* Evidence (screenshots) collected for setup phase

---

## Planned Features

* `.proto` definitions for all services
* Full gRPC service implementation
* Service discovery via Registry (no hardcoded endpoints)
* Error handling and message validation
* CLI-based client interaction

---

## How to Run

### 1. Install dependencies

Run in each service and client folder:

```bash
npm install
````

### 2. Start services

Run each service in separate terminals:

```bash
npm start
```

### 3. Run client

Run in the client folder:

```bash
npm start
```

---

## Evidence

Screenshots of setup and implementation stages are stored in:

```
/screenshots-evidence
```

---

## Author

Bruno Suric