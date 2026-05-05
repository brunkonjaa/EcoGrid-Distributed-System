const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { createRegistrySession } = require('../../client/registryClient');

const PROTO_PATH = __dirname + '/../../protos/occupancy.proto';
const SERVICE_INFO = {
    service_name: 'occupancy-service',
    host: process.env.SERVICE_HOST || 'localhost',
    port: 50052,
    rpc_package: 'occupancy'
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

const occupancyProto = grpc.loadPackageDefinition(packageDefinition).occupancy;
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
            message: 'Occupancy Service rejected the request: invalid operator token'
        };
    }

    return null;
}

function validateArea(area) {
    const cleanArea = String(area || '').trim();

    if (!cleanArea) {
        return {
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Occupancy Service requires an area value'
        };
    }

    return null;
}

// Server Streaming RPC
function SubscribeOccupancy(call) {
    const authError = validateAuthorization(call);
    if (authError) {
        call.destroy(authError);
        return;
    }

    const areaError = validateArea(call.request.area);
    if (areaError) {
        call.destroy(areaError);
        return;
    }

    const area = call.request.area.trim();
    console.log(
        `Occupancy stream ${getMetadataValue(call, 'request-id') || 'no-request-id'} from ${getMetadataValue(call, 'operator-id') || 'unknown-operator'}`
    );

    let count = 0;

    const interval = setInterval(() => {
        count++;
        const occupied = count % 2 === 0;

        const response = {
            area: area,
            occupied: occupied,
            people_count: occupied ? Math.floor(Math.random() * 10) + 1 : 0,
            timestamp: new Date().toISOString(),
            status_message: "Live update"
        };

        call.write(response);

        if (count === 5) {
            clearInterval(interval);
            call.end();
        }

    }, 2000);

    call.on('cancelled', () => {
        clearInterval(interval);
        console.log(`Occupancy stream for ${area} cancelled by client`);
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

    server.addService(occupancyProto.OccupancyService.service, {
        SubscribeOccupancy: SubscribeOccupancy
    });

    server.bindAsync(
        "0.0.0.0:50052",
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log("Occupancy Service running on port 50052");
            server.start();
            registerWithRegistry();
        }
    );
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();
