# Screenshots Evidence

## Structure

- setup/
  - Project structure and initial setup
- grpc/
  - Protocol Buffer definitions and gRPC contract evidence
- implementation/
  - Dependency installation and service implementation code
- testing/
  - Unary, Server Streaming, Client Streaming, and Registry service execution
- discovery/
  - Service registration, heartbeat, and discovery evidence
- gui/
  - Browser GUI evidence for service discovery and service invocation
- errors/
  - Error handling, validation, and advanced gRPC evidence to be added later

## Purpose

Each screenshot provides proof of:
- System implementation
- Correct execution of services
- Progressive completion of the CA requirements

## Current Evidence Coverage

- Setup screenshots show project creation and GitHub setup.
- gRPC screenshots show the proto contracts.
- Implementation screenshots show dependency installation and service code.
- Testing screenshots show the main service and client outputs.
- GUI screenshots show the browser controller discovering and calling the services.
- Current GUI evidence includes:
  - `33_gui_discovery.png` - first GUI discovery evidence
  - `34_gui_services.png` - first GUI service invocation evidence
  - `35_gui_activity_log.png` - first GUI activity log evidence
  - `36_gui_compact_dashboard.png` - compact GUI dashboard layout
  - `37_gui_compact_services_maintain_temperature.png` - readable service summaries with comfort-range maintain decision
  - `38_gui_control_heating.png` - Control Service heating decision below the comfort range
  - `39_gui_occupancy_expanded_activity_log.png` - expanded Occupancy stream updates and Activity Log
  - `40_gui_control_cooling.png` - Control Service cooling decision above the comfort range
- Discovery, error handling, advanced gRPC features, and final demo evidence are still to be expanded before final submission.
