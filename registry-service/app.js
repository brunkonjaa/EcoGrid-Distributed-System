const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../protos/registry.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const registryProto = grpc.loadPackageDefinition(packageDefinition).registry;

const services = {};

// Bidirectional Streaming RPC
function RegisterAndDiscover(call) {
    call.on('data', (request) => {
        if (request.action === 'REGISTER') {
            services[request.service_name] = {
                host: request.host,
                port: request.port
            };

            call.write({
                service_name: request.service_name,
                host: request.host,
                port: request.port,
                status: 'REGISTERED'
            });
        }

        if (request.action === 'DISCOVER') {
            const service = services[request.service_name];

            if (service) {
                call.write({
                    service_name: request.service_name,
                    host: service.host,
                    port: service.port,
                    status: 'FOUND'
                });
            } else {
                call.write({
                    service_name: request.service_name,
                    host: '',
                    port: 0,
                    status: 'NOT_FOUND'
                });
            }
        }
    });

    call.on('end', () => {
        call.end();
    });

    call.on('error', (error) => {
        console.error(error);
    });
}

function main() {
    const server = new grpc.Server();

    server.addService(registryProto.RegistryService.service, {
        RegisterAndDiscover: RegisterAndDiscover
    });

    server.bindAsync(
        '0.0.0.0:50054',
        grpc.ServerCredentials.createInsecure(),
        () => {
            console.log('Registry Service running on port 50054');
            server.start();
        }
    );
}

main();