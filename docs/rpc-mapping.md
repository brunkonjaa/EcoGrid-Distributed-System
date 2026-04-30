# RPC Type Mapping

## Temperature Service
**Unary RPC**
- Proto package: `temperature`
- Service/RPC: `TemperatureService/GetTemperature`
- Request message: `TemperatureRequest`
  - `area` (`string`)
- Response message: `TemperatureResponse`
  - `area` (`string`)
  - `temperature_value` (`float`)
  - `unit` (`string`)
  - `timestamp` (`string`)
- Behaviour: client requests current temperature for an area, server returns a single response
- Runtime integration:
  - service runs on port `50051`
  - service registers as `temperature-service`
  - client discovers `temperature-service` through the registry before calling it

---

## Occupancy Service
**Server Streaming RPC**
- Proto package: `occupancy`
- Service/RPC: `OccupancyService/SubscribeOccupancy`
- Request message: `OccupancyRequest`
  - `area` (`string`)
- Streamed response message: `OccupancyResponse`
  - `area` (`string`)
  - `occupied` (`bool`)
  - `people_count` (`int32`)
  - `timestamp` (`string`)
  - `status_message` (`string`)
- Behaviour: client subscribes once, server streams occupancy updates
- Updates triggered by:
  - periodic interval in the service implementation
  - stream ends after the demo updates complete
- Runtime integration:
  - service runs on port `50052`
  - service registers as `occupancy-service`
  - client discovers `occupancy-service` through the registry before calling it

---

## Control Service
**Client Streaming RPC**
- Proto package: `control`
- Service/RPC: `ControlService/SendSensorData`
- Streamed request message: `ControlRequest`
  - `area` (`string`)
  - `temperature_value` (`float`)
  - `occupied` (`bool`)
  - `people_count` (`int32`)
- Unary response message: `ControlResponse`
  - `area` (`string`)
  - `action` (`string`)
  - `reason` (`string`)
- Behaviour: client streams multiple inputs, server returns a single decision when the stream ends
- Current demo decision rules:
  - if the room is unoccupied, action is `REDUCE_ENERGY_USAGE`
  - if the room is occupied and temperature is below `18 C`, action is `TURN_ON_HEATING`
  - if the room is occupied and temperature is from `18 C` to `24 C`, action is `MAINTAIN_CURRENT_STATE`
  - if the room is occupied and temperature is above `24 C`, action is `TURN_ON_COOLING`
- Runtime integration:
  - service runs on port `50053`
  - service registers as `control-service`
  - client discovers `control-service` through the registry before calling it

---

## GUI Auto Cycle Flow
**Combined distributed workflow**
- GUI/API route: `POST /api/auto-cycle`
- Behaviour:
  - discovers and calls `temperature-service`
  - discovers and runs the `occupancy-service` stream
  - combines the temperature response with the latest occupancy update
  - discovers and sends the combined readings to `control-service`
  - returns the final control decision to the GUI
- Scenario modes:
  - `Live Demo Cycle` chooses changing demo control readings from `-25 C` to `55 C`; after the first random result, later live runs target decisions not yet shown so all four outcomes appear quickly
  - `Heating Demo` sends an occupied low-temperature reading to demonstrate `TURN_ON_HEATING`
  - `Comfort Demo` sends an occupied comfort-range reading to demonstrate `MAINTAIN_CURRENT_STATE`
  - `Cooling Demo` sends an occupied high-temperature reading to demonstrate `TURN_ON_COOLING`
  - `Empty Room Demo` sends an unoccupied reading to demonstrate `REDUCE_ENERGY_USAGE`
- Purpose: demonstrates the smart environment acting automatically rather than only through separate manual service calls
- Evidence: captured manually from the GUI after the Auto Cycle button completes

---

## Registry Service
**Bidirectional Streaming RPC**
- Proto package: `registry`
- Service/RPC: `RegistryService/ServiceRegistryStream`
- Streamed message: `RegistryMessage`
  - `type` (`RegistryMessageType`)
    - `REGISTER`
    - `HEARTBEAT`
    - `DISCOVER_REQUEST`
    - `DISCOVER_RESPONSE`
    - `ACK`
    - `ERROR`
  - `message` (`string`)
  - `service` (`ServiceInfo`)
    - `service_name` (`string`)
    - `host` (`string`)
    - `port` (`int32`)
    - `rpc_package` (`string`)
    - `timestamp` (`string`)
  - `services` (`repeated ServiceInfo`)
  - `timestamp` (`string`)
- Behaviour:
  - services can register themselves with host, port, and package details
  - services can send heartbeat messages to keep their status current
  - clients can send discovery requests and receive matching services in the response stream
- Runtime integration:
  - registry runs on port `50054`
  - `client/registryClient.js` provides reusable registration, heartbeat, and discovery helpers
  - Temperature, Occupancy, and Control services use the registry during startup
