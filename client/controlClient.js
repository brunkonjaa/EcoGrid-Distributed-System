const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { discoverService } = require('./registryClient');

const PROTO_PATH = __dirname + '/../protos/control.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const controlProto = grpc.loadPackageDefinition(packageDefinition).control;
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
        const discoveredService = await discoverService('control-service');
        const client = new controlProto.ControlService(
            `${discoveredService.host}:${discoveredService.port}`,
            grpc.credentials.createInsecure()
        );

        console.log('Discovered endpoint:', `${discoveredService.host}:${discoveredService.port}`);

        const call = client.SendSensorData(createMetadata(), (error, response) => {
            if (error) {
                console.error("Error:", error);
            } else {
                console.log("Control Decision:", response);
            }
        });

        call.write({
            area: 'Room A',
            temperature_value: 25,
            occupied: true,
            people_count: 3
        });

        call.write({
            area: 'Room A',
            temperature_value: 26,
            occupied: true,
            people_count: 4
        });

        call.write({
            area: 'Room A',
            temperature_value: 24,
            occupied: false,
            people_count: 0
        });

        call.end();
    } catch (error) {
        console.error('Discovery error:', error.message);
    }
}

main();
