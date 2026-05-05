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
- GUI Client - Browser-based controller served by Node.js for demonstrating service discovery, service calls, and an automatic control cycle

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
- GUI Auto Cycle calls Temperature, runs Occupancy, combines the latest readings, and sends them to Control automatically
- Auto Cycle includes a Live Demo Cycle plus Heating, Comfort, Cooling, and Empty Room demo scenarios so the final demo can show all main Control Service decision paths clearly
- GUI now includes simple operator access using a demo token before service invocation
- gRPC calls from the GUI server include metadata for operator ID, request ID, authorization token, and SDG goal
- Temperature, Occupancy, and Control services validate incoming gRPC metadata and reject unauthorized requests
- GUI server and services now handle invalid input, unknown service discovery, unavailable services, and invalid gRPC requests with clear error messages
- gRPC deadlines/timeouts are applied to remote calls so the GUI does not wait indefinitely
- Occupancy streaming includes a cancellation demo that stops the server stream after two updates
- Proto files defined for all services:
  - `temperature.proto`
  - `occupancy.proto`
  - `control.proto`
  - `registry.proto`
- Final submission work includes the report document and video presentation

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

For local testing, the optional helper script can start the Registry, services, and GUI in the correct order:

```bash
python dev-tools/run_all_services.py
```

The helper also clears the EcoGrid ports before startup if old service processes are still running.

The GUI uses this demo access token:

```text
1234
```

Unlock the controller with an operator name and token before running discovery or service calls.

### Error handling and advanced gRPC checks

The current implementation demonstrates:

- invalid GUI/API input handling
- unknown service discovery handling
- unavailable remote service handling
- invalid gRPC request handling
- unauthorized/missing operator token handling
- gRPC metadata for operator, request, authorization, and SDG context
- gRPC deadlines/timeouts on remote service calls
- Occupancy stream cancellation from the GUI

---

## Evidence

Screenshots of system execution and outputs:

```
/screenshots-evidence
```

---

## Author

Bruno Suric
