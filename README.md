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

## Project Stages

This repository is developed incrementally. Each stage is committed separately and this README is updated to reflect progress.

### Completed Stages

* Stage 1: Scenario and SDG selected (SDG 7: Affordable and Clean Energy)
* Stage 2: Architecture defined (services, responsibilities, and interactions)
* Stage 3: RPC mapping finalised (Unary, Server Streaming, Client Streaming, Bidirectional Streaming)
* Stage 4: Proto definitions created for all services (see `protos/`)

### Future Stages

* Stage 5: Implement gRPC service logic for each service
* Stage 6: Implement Registry registration and discovery (no hardcoded endpoints)
* Stage 7: Implement client controller (discover, invoke, display outputs)
* Stage 8: Add remote error handling, validation, and one advanced gRPC feature (metadata/deadlines/cancellation)
* Stage 9: Collect evidence screenshots for RPCs, discovery, and error cases
* Stage 10: Final report and video presentation deliverables

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
* Proto definitions exist for all services:
  - `protos/temperature.proto`
  - `protos/occupancy.proto`
  - `protos/control.proto`
  - `protos/registry.proto`

---

## How to Run

### 1. Install dependencies

Run in each service and client folder:

```bash
npm install
```

### 2. Run services and client

Service implementations and runnable scripts will be added in later stages.

---

## Evidence

Screenshots of setup and implementation stages are stored in:

```
/screenshots-evidence
```

---

## Author

Bruno Suric
