EcoGrid Distributed System Project Proposal

1.	Assigned UN Development Goal
EcoGrid supports UN SDG 7: Affordable and Clean Energy by reducing wasted heating/cooling in unused building areas while maintaining comfort when areas are occupied.
2.	Overview
EcoGrid models a multi-room building where each area may have underfloor heating, ceiling cooling, a temperature sensor, and an occupancy sensor. The Controller Client collects sensor information and requests a control decision. All communication uses gRPC (Protocol Buffers). Registry Service is used so services can register and be discovered dynamically (no hardcoded endpoints). EcoGrid focuses on three behaviours: providing the latest sensor readings for an area, pushing occupancy updates in real time so the controller does not need to poll, and generating an energy action that reduces waste (for example, choosing no change when an area is empty). If an area is occupied and the temperature is below a comfort threshold, heating may be enabled. If occupied and above a threshold, cooling may be enabled. If unoccupied, heating or cooling should be disabled or unchanged depending on the current state.
3.	Temperature Service
It uses a single request/single response (unary). Client sends area name (string) and service returns one temperature reading for that area: temperature value (float), temperature unit (string, for example C), and timestamp (string). This fits unary RPC because the client needs one current reading at a time:
•	Example request: area = Room101
•	Example response: area= Room101, temperature value=19.8, unit=, timestamp=
4.	Occupancy Service
It uses server streaming. Client subscribes once by sending area name (string), and service keeps connection open and continuously sends occupancy updates. Each update includes area name (string), whether area is occupied (boolean), people count (integer), timestamp (string), and a short status message (string) explaining why the update was sent (for example a change or a periodic update). This fits streaming because occupancy can change at any time:
•	Example request: area = Room101
•	Example streamed responses:
occupied=false, people count=0, timestamp=, then occupied=true, people count=2, timestamp=

5.	Control Service
It uses client streaming. Client sends a short stream of recent inputs for one area, where each input contains area name (string), temperature value (float), occupied state (boolean), and timestamp (string). When client has finished sending, service responds once with message/decision for that area: action (heating on/off, cooling on/off, or no change), reason (string), and timestamp (string). This fits client streaming because decision is more reliable when based on several readings, not just single moment:
•	Example streamed requests:
(area=Room101, temperature value=19.6, occupied=true, timestamp=) then (19.5)
•	Example response: action=heating on, reason=occupied and below threshold, timestamp=
6.	Registry Service
It uses bidirectional streaming so registration and discovery can happen in real time on same connection. Services send messages containing their service name (string), host (string), port (integer), service package/type (string), and timestamp (string). Client can send discover request message, and registry replies with a discover response containing a list of currently available services (each with same host/port details) together with timestamp. This fits bidirectional streaming because both sides need to send messages independently whenever something changes.
•	Example registration message: register service name=temperature-service, host=127.0.0.1, port=50051, package=temperature, timestamp=
•	Example discovery: request discover services - response list of services with host/port
