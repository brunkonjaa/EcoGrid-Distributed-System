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
- Runtime integration:
  - service runs on port `50053`
  - service registers as `control-service`
  - client discovers `control-service` through the registry before calling it

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
