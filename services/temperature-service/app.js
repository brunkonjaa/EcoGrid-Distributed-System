const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { createRegistrySession } = require('../../client/registryClient');

const PROTO_PATH = __dirname + '/../../protos/temperature.proto';
const SERVICE_INFO = {
    service_name: 'temperature-service',
    host: process.env.SERVICE_HOST || 'localhost',
    port: 50051,
    rpc_package: 'temperature'
};
const HEARTBEAT_INTERVAL_MS = 10000;
const ACCESS_TOKEN = process.env.ECOGRID_ACCESS_TOKEN || '1234';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const temperatureProto = grpc.loadPackageDefinition(packageDefinition).temperature;
let registrySession = null;
let heartbeatTimer = null;

function getMetadataValue(call, key) {
    const values = call.metadata.get(key);
    return values.length > 0 ? String(values[0]) : '';
}

function validateAuthorization(call) {
    if (getMetadataValue(call, 'authorization') !== `Bearer ${ACCESS_TOKEN}`) {
        return {
            code: grpc.status.UNAUTHENTICATED,
            message: 'Temperature Service rejected the request: invalid operator token'
        };
    }

    return null;
}

function validateArea(area) {
    const cleanArea = String(area || '').trim();

    if (!cleanArea) {
        return {
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Temperature Service requires an area value'
        };
    }

    return null;
}

// Unary RPC implementation
function GetTemperature(call, callback) {
    const authError = validateAuthorization(call);
    if (authError) {
        callback(authError);
        return;
    }

    const areaError = validateArea(call.request.area);
    if (areaError) {
        callback(areaError);
        return;
    }

    const area = call.request.area.trim();
    console.log(
        `Temperature request ${getMetadataValue(call, 'request-id') || 'no-request-id'} from ${getMetadataValue(call, 'operator-id') || 'unknown-operator'}`
    );

    const response = {
        area: area,
        temperature_value: 22.5,
        unit: "C",
        timestamp: new Date().toISOString()
    };

    callback(null, response);
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

    server.addService(temperatureProto.TemperatureService.service, {
        GetTemperature: GetTemperature
    });

    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("Temperature Service running on port 50051");
            server.start();
            registerWithRegistry();
        }
    );
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
