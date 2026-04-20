const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../../protos/temperature.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const temperatureProto = grpc.loadPackageDefinition(packageDefinition).temperature;

// Unary RPC implementation
function GetTemperature(call, callback) {
    const area = call.request.area;

    const response = {
        area: area,
        temperature_value: 22.5,
        unit: "C",
        timestamp: new Date().toISOString()
    };

    callback(null, response);
}

function main() {
    const server = new grpc.Server();

    server.addService(temperatureProto.TemperatureService.service, {
        GetTemperature: GetTemperature
    });

    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("Temperature Service running on port 50051");
            server.start();
        }
    );
}

main();
