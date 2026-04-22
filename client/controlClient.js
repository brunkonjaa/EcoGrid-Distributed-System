const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../protos/control.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const controlProto = grpc.loadPackageDefinition(packageDefinition).control;

const client = new controlProto.ControlService(
    'localhost:50053',
    grpc.credentials.createInsecure()
);

// Start client streaming
const call = client.SendSensorData((error, response) => {
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Control Decision:", response);
    }
});

// Send multiple messages
call.write({
    area: 'Room A',
    temperature_value: 25,
    occupied: true,
    people_count: 3
});

call.write({
    area: 'Room A',
    temperature_value: 26,
    occupied: true,
    people_count: 4
});

call.write({
    area: 'Room A',
    temperature_value: 24,
    occupied: false,
    people_count: 0
});

// End stream
call.end();