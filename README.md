# EcoGrid Distributed System

## Overview

EcoGrid is a distributed system designed to optimise energy usage based on environmental and occupancy data.

Aligned SDG:

- SDG 7: Affordable and Clean Energy

---

## System Architecture

The system consists of the following components:

- Temperature Service - Provides temperature data (Unary RPC)
- Occupancy Service - Streams real-time occupancy updates (Server Streaming RPC)
- Control Service - Processes incoming data and returns decisions (Client Streaming RPC)
- Registry Service - Handles service registration and discovery (Bidirectional Streaming RPC)
- Client - Discovers services through the registry before invoking them

---

## Communication

- Protocol: gRPC
- Data Format: Protocol Buffers (.proto)
- Architecture: Microservices with RPC-based communication

---

## RPC Design

Each service is mapped to a specific RPC type:

- Temperature - Unary
- Occupancy - Server Streaming
- Control - Client Streaming
- Registry - Bidirectional Streaming

---

## Current State

- Project structure fully implemented
- All services built and running independently
- All 4 gRPC communication types implemented
- Temperature, Occupancy, Control, and Registry services tested
- Registry service supports registration, heartbeat, and discovery through bidirectional streaming
- Dedicated registry client file is implemented
- Temperature, Occupancy, and Control clients use registry-based discovery before calling services
- Temperature, Occupancy, and Control services register themselves with the registry and send heartbeat messages
- Proto files defined for all services:
  - `temperature.proto`
  - `occupancy.proto`
  - `control.proto`
  - `registry.proto`
- Remaining work includes GUI integration, stronger error handling, advanced gRPC features, final report, and final video

---

## How to Run

### Install dependencies

Run in each service and client folder:

```bash
npm install
```

### Run services

Start the registry first:

```bash
cd registry-service
npm start
```

Then start each main service in a separate terminal:

```bash
cd services/temperature-service
npm start
```

```bash
cd services/occupancy-service
npm start
```

```bash
cd services/control-service
npm start
```

### Run clients

From the client folder:

```bash
cd client
node registryClient.js discover temperature-service
node temperatureClient.js
node occupancyClient.js
node controlClient.js
```

---

## Evidence

Screenshots of system execution and outputs:

```
/screenshots-evidence
```

---

## Author

Bruno Suric
