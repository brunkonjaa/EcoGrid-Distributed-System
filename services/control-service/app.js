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
        let action = "TURN_OFF_COOLING";
        let reason = "Room empty";

        if (latestData.occupied && latestData.temperature_value < 18) {
            action = "TURN_ON_HEATING";
            reason = "Room occupied and temperature is below comfort range";
        } else if (latestData.occupied && latestData.temperature_value > 24) {
            action = "TURN_ON_COOLING";
            reason = "Room occupied and temperature is above comfort range";
        } else if (latestData.occupied) {
            action = "MAINTAIN_CURRENT_STATE";
            reason = "Room occupied and temperature is within comfort range";
        }

        const response = {
            area: latestData.area,
            action: action,
            reason: reason
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
