const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../../protos/control.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const controlProto = grpc.loadPackageDefinition(packageDefinition).control;

// Client Streaming RPC
function SendSensorData(call, callback) {
    let latestData = null;

    call.on('data', (request) => {
        latestData = request;
    });

    call.on('end', () => {
        const response = {
            area: latestData.area,
            action: latestData.occupied ? "TURN_ON_COOLING" : "TURN_OFF_COOLING",
            reason: latestData.occupied ? "Room occupied" : "Room empty"
        };

        callback(null, response);
    });

    call.on('error', (error) => {
        console.error(error);
    });
}

function main() {
    const server = new grpc.Server();

    server.addService(controlProto.ControlService.service, {
        SendSensorData: SendSensorData
    });

    server.bindAsync(
        "0.0.0.0:50053",
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("Control Service running on port 50053");
            server.start();
        }
    );
}

main();