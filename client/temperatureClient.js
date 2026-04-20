const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../protos/temperature.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const temperatureProto = grpc.loadPackageDefinition(packageDefinition).temperature;

const client = new temperatureProto.TemperatureService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);

// Test request
client.GetTemperature({ area: "Room A" }, (error, response) => {
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Response:", response);
    }
});
