EcoGrid Distributed System Project Proposal

1. Introduction
I have a strong interest in building and understanding how systems operate beyond their default configurations, particularly through experience with Android rooting and gaming console software/hardware modifications. This project reflects a similar mindset, where I am designing a system that shows and controls internal behaviour rather than relying on fixed functionality.
By building EcoGrid as a distributed system with clearly defined communication between services, I am applying this interest in system-level understanding to a structured and practical environment.

2. Idea and Purpose
I decided to develop a distributed system called EcoGrid. It supports UN Sustainable Development Goal 7 (Affordable and Clean Energy). My aim is to reduce wasted energy in a building but without making space uncomfortable when people are actually using it.
My point of view is multi-room building where each area has two klimate options: underfloor heating and ceiling cooling. Each area has temperature and occupancy sensor. System is supposed to avoid heating or cooling empty rooms and it responds quickly when a person enters the room.
EcoGrid is implemented as small services that communicate using gRPC. Services publish themselves and discover each other through a registry so that nothing is hardcoded.

3. System Architecture and Services
The system consists of four servisces plus a controller client.

3.1 Temperature Service (Unary RPC)
Temperature Service responds to Controller with information regarding specific room or area. It replies with one result: room name, temperature, unit (like "C"), and the time the reading was taken. This is a unary call because it’s a straightforward question with a single answer.

3.2 Occupancy Service (Server Streaming RPC)
Occupancy Service lets the controller subscribe to a room or area and then keeps sending updates as things change. Each update includes the room name, if it’s occupied, then how many people are there and time of update. It is sent as short status message. Streaming fits here because occupancy can change at any time, and live updates are more useful than repeatedly checking.

3.3 Control Service (Client Streaming RPC)
Controller sends a short stream of recent readings for an area. When controller sends readings, the service replies once with a decision for that area: what to do (turn heating on/off, turn cooling on/off, or make no change), and a reason and timestamp. Client streaming fits because decision is better when it’s based on a few readings over time instead of a single moment.

3.4 Registry Service (Bidirectional Streaming RPC)
Registry Service is how everything finds everything else in my project. So for example services can connect to it to register themselves. On the other hand controller can ask registry what services are currently available and get back a full list with each service’s name, host, port, package, and timestamp. Bidirectional streaming fits here just perfectly because registration and discovery can happen at the same time, and also the registry can send updates whenever something changes.
