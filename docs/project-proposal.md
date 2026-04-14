EcoGrid Distributed System Project Proposal

1. Introduction
I have a strong interest in understanding how systems operate beyond their default configurations, particularly through experience with Android rooting and gaming console modification. This project reflects a similar mindset, where I am designing a system that exposes and controls internal behaviour rather than relying on fixed functionality.
By building EcoGrid as a distributed system with clearly defined communication between services, I am applying this interest in system-level understanding to a structured and practical environment.

2. Idea and Purpose
For this project, I am developing a distributed system called EcoGrid, based on United Nations Sustainable Development Goal 7: Affordable and Clean Energy. The goal is to reduce unnecessary energy usage in indoor spaces by reacting to real-time temperature and occupancy data, for example ensuring heating is not active in empty rooms.
EcoGrid is structured as independent services communicating using gRPC, allowing clear interaction through defined request and response messages.

3. System Architecture and Services
The system consists of four services:
3.1 Temperature Service
Temperature Service provides temperature data.
It uses a unary RPC GetCurrentTemperature(area: string), which returns temperature_value, unit, and timestamp for a given area.
For example, a request with "RoomA" may return 19.5, "C", and a timestamp.
Here, area identifies the location being monitored, temperature_value represents the recorded temperature, and timestamp shows when the reading was taken.

3.2 Occupancy Service
Occupancy Service provides live occupancy information for an area.
It uses a server streaming RPC StreamOccupancy(area: string), which continuously returns occupied, people_count, and timestamp updates for that area.
For example, a request with "RoomA" may stream updates such as true, 3, and a timestamp, followed later by false, 0, and a new timestamp.
Here, occupied indicates whether the area is currently in use, people_count shows how many people are detected, and timestamp records when each update was generated.
3.3 Control Service
Control Service makes energy decisions based on incoming environmental data.
It uses a client streaming RPC SubmitControlInputs(stream ControlInput), where the client sends multiple data messages and the service returns a single action and reason response. ControlInput includes area, temperature_value, and occupied fields.
For example, the client may send several readings for "RoomA" containing temperature and occupancy values, and the service may return "HEATING_ON" with the reason that the area is occupied and below the target temperature.
Here, the streamed input messages allow multiple readings to be processed together, action defines the system decision, and reason explains why that decision was made.

3.4 Registry Service
The Registry Service handles service registration and discovery.
It uses a bidirectional streaming RPC ServiceRegistryStream(stream ServiceMessage), allowing services to send registration or status updates while the registry sends discovery or acknowledgement responses back in real time.
For example, a service may send its name, host, and port details, and the registry may respond with a confirmation message or updated discovery information.
Here, service_name identifies the service, while host and port specify how that service can be reached by other parts of the system. This enables dynamic service discovery without hardcoding service locations.

4. Conclusion
EcoGrid demonstrates how distributed services can work together to monitor conditions and respond dynamically to reduce energy waste. By combining clearly defined services with gRPC communication, the system provides a practical and structured approach to improving energy efficiency.
