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

// Server Streaming RPC
function SubscribeOccupancy(call) {
    const area = call.request.area;

    let count = 0;

    const interval = setInterval(() => {
        count++;

        const response = {
            area: area,
            occupied: count % 2 === 0,
            people_count: Math.floor(Math.random() * 10),
            timestamp: new Date().toISOString(),
            status_message: "Live update"
        };

        call.write(response);

        if (count === 5) {
            clearInterval(interval);
            call.end();
        }

    }, 2000);
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
