# Service Ports

| Component | Port | Registry name |
| --- | ---: | --- |
| Temperature Service | 50051 | `temperature-service` |
| Occupancy Service | 50052 | `occupancy-service` |
| Control Service | 50053 | `control-service` |
| Registry Service | 50054 | `registry-service` |

The Registry Service should be started before the other services. Temperature, Occupancy, and Control register themselves with the registry and send heartbeat messages after startup.
