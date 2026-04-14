# RPC Type Mapping

## Temperature Service
**Unary RPC**
- Request: area
- Response: temperature_value, unit, timestamp
- Behaviour: client requests current temperature, server returns a single response

---

## Occupancy Service
**Server Streaming RPC**
- Request: area
- Response: stream of (occupied, people_count, timestamp)
- Behaviour: client subscribes once, server continuously streams updates
- Updates triggered by:
  - occupancy state change
  - people count change
  - periodic interval (5 seconds)

---

## Control Service
**Client Streaming RPC**
- Request: stream of ControlInput (area, temperature_value, occupied)
- Response: action, reason
- Behaviour: client sends multiple readings, server processes and returns a single decision

---

## Registry Service
**Bidirectional Streaming RPC**
- Request: stream of ServiceMessage (service_name, host, port, status)
- Response: stream of discovery/acknowledgement messages
- Behaviour: services register dynamically and client discovers services in real time