const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { discoverService } = require('./registryClient');

const PROTO_PATH = __dirname + '/../protos/occupancy.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const occupancyProto = grpc.loadPackageDefinition(packageDefinition).occupancy;
const ACCESS_TOKEN = process.env.ECOGRID_ACCESS_TOKEN || '1234';

function createMetadata() {
    const metadata = new grpc.Metadata();
    metadata.set('operator-id', 'terminal-client');
    metadata.set('authorization', `Bearer ${ACCESS_TOKEN}`);
    metadata.set('request-id', `cli-${Date.now()}`);
    metadata.set('sdg-goal', 'SDG7');
    return metadata;
}

async function main() {
    try {
        const discoveredService = await discoverService('occupancy-service');
        const client = new occupancyProto.OccupancyService(
            `${discoveredService.host}:${discoveredService.port}`,
            grpc.credentials.createInsecure()
        );

        console.log('Discovered endpoint:', `${discoveredService.host}:${discoveredService.port}`);
        const call = client.SubscribeOccupancy({ area: 'Room A' }, createMetadata());

        call.on('data', (response) => {
            console.log('Occupancy Update:', response);
        });

        call.on('end', () => {
            console.log('Stream ended');
        });

        call.on('error', (error) => {
            console.error('Error:', error);
        });
    } catch (error) {
        console.error('Discovery error:', error.message);
    }
}

main();
