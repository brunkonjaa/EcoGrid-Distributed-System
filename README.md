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
- GUI Client - Browser-based controller served by Node.js for demonstrating service discovery and service calls

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
- GUI client is implemented in the `client` folder and calls the real gRPC services through a small Node.js GUI server
- GUI client shows a compact dashboard with readable service summaries, technical response details, expandable Occupancy stream updates, and Control decisions for heating, comfort-range maintain state, and cooling
- Proto files defined for all services:
  - `temperature.proto`
  - `occupancy.proto`
  - `control.proto`
  - `registry.proto`
- Remaining work includes stronger error handling, advanced gRPC features, final report, and final video

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

### Run GUI client

Start Registry, Temperature, Occupancy, and Control first. Then run the GUI server from the client folder:

```bash
cd client
npm run gui
```

Open the GUI in a browser:

```text
http://localhost:3000
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
