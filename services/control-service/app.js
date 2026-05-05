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
const ACCESS_TOKEN = process.env.ECOGRID_ACCESS_TOKEN || '1234';

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

function getMetadataValue(call, key) {
    const values = call.metadata.get(key);
    return values.length > 0 ? String(values[0]) : '';
}

function validateAuthorization(call) {
    if (getMetadataValue(call, 'authorization') !== `Bearer ${ACCESS_TOKEN}`) {
        return {
            code: grpc.status.UNAUTHENTICATED,
            message: 'Control Service rejected the request: invalid operator token'
        };
    }

    return null;
}

function validateReading(request) {
    const area = String(request.area || '').trim();
    const temperature = Number(request.temperature_value);
    const peopleCount = Number(request.people_count);

    if (!area) {
        return 'Control Service requires an area value';
    }

    if (!Number.isFinite(temperature) || temperature < -50 || temperature > 80) {
        return 'Control Service requires a temperature between -50 and 80';
    }

    if (!Number.isInteger(peopleCount) || peopleCount < 0 || peopleCount > 500) {
        return 'Control Service requires people_count between 0 and 500';
    }

    if (!request.occupied && peopleCount > 0) {
        return 'Control Service received inconsistent occupancy: empty room cannot have people_count above 0';
    }

    if (request.occupied && peopleCount === 0) {
        return 'Control Service received inconsistent occupancy: occupied room needs people_count above 0';
    }

    return '';
}

// Client Streaming RPC
function SendSensorData(call, callback) {
    let latestData = null;
    let validationError = validateAuthorization(call);
    let hasResponded = false;

    if (validationError) {
        hasResponded = true;
        callback(validationError);
        return;
    }

    console.log(
        `Control stream ${getMetadataValue(call, 'request-id') || 'no-request-id'} from ${getMetadataValue(call, 'operator-id') || 'unknown-operator'}`
    );

    call.on('data', (request) => {
        if (validationError) {
            return;
        }

        const requestError = validateReading(request);
        if (requestError) {
            validationError = {
                code: grpc.status.INVALID_ARGUMENT,
                message: requestError
            };
            hasResponded = true;
            callback(validationError);
            return;
        }

        latestData = request;
    });

    call.on('end', () => {
        if (hasResponded) {
            return;
        }

        if (validationError) {
            hasResponded = true;
            callback(validationError);
            return;
        }

        if (!latestData) {
            hasResponded = true;
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'Control Service requires at least one sensor reading'
            });
            return;
        }

        let action = "REDUCE_ENERGY_USAGE";
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

        hasResponded = true;
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
