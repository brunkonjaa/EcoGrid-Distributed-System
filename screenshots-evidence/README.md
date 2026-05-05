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
  - Browser GUI evidence for service discovery, service invocation, and Auto Cycle
- errors/
  - Error handling, validation, operator access, metadata, deadlines, and stream cancellation evidence

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
- Auto Cycle screenshots should show the manual browser evidence for the automatic Temperature, Occupancy, and Control workflow.
- Current GUI evidence includes:
  - `33_gui_discovery.png` - first GUI discovery evidence
  - `34_gui_services.png` - first GUI service invocation evidence
  - `35_gui_activity_log.png` - first GUI activity log evidence
  - `36_gui_compact_dashboard.png` - compact GUI dashboard layout
  - `37_gui_compact_services_maintain_temperature.png` - readable service summaries with comfort-range maintain decision
  - `38_gui_control_heating.png` - Control Service heating decision below the comfort range
  - `39_gui_occupancy_expanded_activity_log.png` - expanded Occupancy stream updates and Activity Log
  - `40_gui_control_cooling.png` - Control Service cooling decision above the comfort range
  - `41_gui_auto_cycle_heating_demo.png` - Auto Cycle Heating Demo returning `TURN_ON_HEATING`
  - `42_gui_auto_cycle_comfort_demo.png` - Auto Cycle Comfort Demo returning `MAINTAIN_CURRENT_STATE`
  - `43_gui_auto_cycle_cooling_demo.png` - Auto Cycle Cooling Demo returning `TURN_ON_COOLING`
  - `44_gui_empty_room_demo.png` - Auto Cycle Empty Room Demo returning `REDUCE_ENERGY_USAGE`
  - `45_gui_activity_log.png` - Activity Log showing discovery and Auto Cycle demo results
  - `46_gui_room_selection.png` - room selection dropdown with predefined rooms and `Edit_Name`
  - `55_gui_auto_cycle_heating_success.png` - Auto Cycle Heating Demo still working after error handling and advanced features were added
- Error handling and advanced gRPC evidence includes:
  - `47_gui_operator_access_locked.png` - GUI locked before operator access
  - `48_gui_invalid_access_token.png` - invalid token rejected
  - `49_gui_operator_access_granted.png` - operator access granted with demo token
  - `50_gui_unknown_service_discovery.png` - unknown `lighting-service` discovery handled
  - `51_gui_invalid_input_validation.png` - invalid Control temperature validation
  - `52_gui_unavailable_temperature_service.png` - unavailable Temperature Service handled
  - `53_gui_occupancy_stream_cancelled.png` - Occupancy stream cancelled after two updates
  - `54_gui_authorized_metadata_temperature.png` - authorized Temperature call after operator access
  - `56_gui_error_handling_activity_log.png` - Activity Log summary of error handling and advanced feature events
