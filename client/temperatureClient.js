const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { discoverService } = require('./registryClient');

const PROTO_PATH = __dirname + '/../protos/temperature.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const temperatureProto = grpc.loadPackageDefinition(packageDefinition).temperature;
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
        const discoveredService = await discoverService('temperature-service');
        const client = new temperatureProto.TemperatureService(
            `${discoveredService.host}:${discoveredService.port}`,
            grpc.credentials.createInsecure()
        );

        client.GetTemperature({ area: "Room A" }, createMetadata(), (error, response) => {
            if (error) {
                console.error("Error:", error);
            } else {
                console.log("Discovered endpoint:", `${discoveredService.host}:${discoveredService.port}`);
                console.log("Response:", response);
            }
        });
    } catch (error) {
        console.error("Discovery error:", error.message);
    }
}

main();
