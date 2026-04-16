# RPC Type Mapping

## Temperature Service
**Unary RPC**
- Proto package: `temperature`
- Service/RPC: `TemperatureService/GetCurrentTemperature`
- Request message: `TemperatureRequest`
  - `area` (`string`)
- Response message: `TemperatureResponse`
  - `area` (`string`)
  - `temperature_value` (`float`)
  - `unit` (`string`)
  - `timestamp` (`string`)
- Behaviour: client requests current temperature for an area, server returns a single response

---

## Occupancy Service
**Server Streaming RPC**
- Proto package: `occupancy`
- Service/RPC: `OccupancyService/StreamOccupancy`
- Request message: `OccupancyRequest`
  - `area` (`string`)
- Streamed response message: `OccupancyUpdate`
  - `area` (`string`)
  - `occupied` (`bool`)
  - `people_count` (`int32`)
  - `timestamp` (`string`)
  - `status_message` (`string`)
- Behaviour: client subscribes once, server continuously streams updates
- Updates triggered by:
  - occupancy state change
  - people count change
  - periodic interval (5 seconds)

---

## Control Service
**Client Streaming RPC**
- Proto package: `control`
- Service/RPC: `ControlService/SubmitControlInputs`
- Streamed request message: `ControlInput`
  - `area` (`string`)
  - `temperature_value` (`float`)
  - `occupied` (`bool`)
  - `timestamp` (`string`)
- Unary response message: `ControlDecision`
  - `area` (`string`)
  - `action` (`enum ControlAction`)
  - `reason` (`string`)
  - `timestamp` (`string`)
- Behaviour: client streams multiple inputs, server returns a single decision when the stream ends

---

## Registry Service
**Bidirectional Streaming RPC**
- Proto package: `registry`
- Service/RPC: `RegistryService/ServiceRegistryStream`
- Bidirectional message: `RegistryMessage`
  - `type` (`enum RegistryMessageType`)
  - `message` (`string`)
  - `service` (`ServiceInfo`)
  - `services` (`repeated ServiceInfo`)
  - `timestamp` (`string`)
- ServiceInfo fields:
  - `service_name` (`string`)
  - `host` (`string`)
  - `port` (`int32`)
  - `rpc_package` (`string`)
  - `timestamp` (`string`)
- Behaviour:
  - services register dynamically (and heartbeat) without hardcoded endpoints
  - client discovers services in real time via `DISCOVER_REQUEST` / `DISCOVER_RESPONSE`
