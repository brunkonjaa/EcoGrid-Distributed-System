const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { createRegistrySession } = require('../../client/registryClient');

const PROTO_PATH = __dirname + '/../../protos/control.proto';
const SERVICE_INFO = {
    service_name: 'control-service',
    host: process.env.SERVICE_HOST || 'localhost',
    port: 50053,
    rpc_package: 'control'
};
const HEARTBEAT_INTERVAL_MS = 10000;

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const controlProto = grpc.loadPackageDefinition(packageDefinition).control;
let registrySession = null;
let heartbeatTimer = null;

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

async function registerWithRegistry() {
    registrySession = createRegistrySession();

    try {
        const registerResponse = await registrySession.register(SERVICE_INFO);
        console.log('Registry:', registerResponse.message);

        heartbeatTimer = setInterval(async () => {
            try {
                const heartbeatResponse = await registrySession.sendHeartbeat(SERVICE_INFO);
                console.log('Registry:', heartbeatResponse.message);
            } catch (error) {
                console.error('Registry heartbeat failed:', error.message);
            }
        }, HEARTBEAT_INTERVAL_MS);
    } catch (error) {
        console.error('Registry registration failed:', error.message);
    }
}

function shutdown() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    if (registrySession) {
        registrySession.close();
        registrySession = null;
    }
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
            registerWithRegistry();
        }
    );
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
