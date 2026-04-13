# EcoGrid Distributed System

## Overview

EcoGrid is a distributed system designed to optimise energy usage based on environmental and occupancy data.

Aligned SDG:

* SDG 7: Affordable and Clean Energy

---

## System Architecture

The system consists of the following components:

* Temperature Service - Provides environmental data
* Occupancy Service - Tracks room usage
* Control Service - Processes data and determines energy actions
* Registry Service - Manages service registration and discovery
* Client - Interacts with services and displays results

---

## Communication

* Protocol: gRPC
* Services communicate using Protocol Buffers (.proto)

---

## RPC Implementation Status

Planned RPC types:

* Unary RPC
* Server Streaming RPC
* Client Streaming RPC
* Bidirectional Streaming RPC

---

## Current State

* Project structure created
* All services and client initialised with npm
* Evidence (screenshots) collected for setup phase
* System ready for gRPC implementation

---

## Planned Features

* Service discovery mechanism
* Real-time communication between services
* Error handling and validation

---

## How to Run

### 1. Install dependencies

Run in each service and client folder:

```bash
npm install
```

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

Screenshots of setup and future implementation stages are available in:

/screenshots-evidence

---

## Author

Bruno Suric
