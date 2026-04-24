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

async function main() {
    try {
        const discoveredService = await discoverService('control-service');
        const client = new controlProto.ControlService(
            `${discoveredService.host}:${discoveredService.port}`,
            grpc.credentials.createInsecure()
        );

        console.log('Discovered endpoint:', `${discoveredService.host}:${discoveredService.port}`);

        const call = client.SendSensorData((error, response) => {
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
