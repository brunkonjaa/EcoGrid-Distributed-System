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
function ServiceRegistryStream(call) {
    call.on('data', (request) => {
        const timestamp = new Date().toISOString();

        if (request.type === 'REGISTER') {
            const service = {
                service_name: request.service.service_name,
                host: request.service.host,
                port: request.service.port,
                rpc_package: request.service.rpc_package,
                timestamp: timestamp
            };

            services[service.service_name] = service;

            call.write({
                type: 'ACK',
                message: `${service.service_name} registered`,
                service: service,
                services: [],
                timestamp: timestamp
            });
        }

        if (request.type === 'HEARTBEAT') {
            const serviceName = request.service.service_name;

            if (services[serviceName]) {
                services[serviceName].timestamp = timestamp;
                call.write({
                    type: 'ACK',
                    message: `${serviceName} heartbeat received`,
                    service: services[serviceName],
                    services: [],
                    timestamp: timestamp
                });
            } else {
                call.write({
                    type: 'ERROR',
                    message: `${serviceName} is not registered`,
                    service: request.service,
                    services: [],
                    timestamp: timestamp
                });
            }
        }

        if (request.type === 'DISCOVER_REQUEST') {
            const serviceName = request.service.service_name;
            const discoveredServices = serviceName
                ? Object.values(services).filter((service) => service.service_name === serviceName)
                : Object.values(services);

            call.write({
                type: 'DISCOVER_RESPONSE',
                message: discoveredServices.length > 0 ? 'Services discovered' : 'No services found',
                service: discoveredServices[0] || {},
                services: discoveredServices,
                timestamp: timestamp
            });
        }

        if (request.type === 'REGISTRY_MESSAGE_TYPE_UNSPECIFIED') {
            call.write({
                type: 'ERROR',
                message: 'Registry message type is required',
                service: request.service || {},
                services: [],
                timestamp: timestamp
            });
        }

        if (!['REGISTER', 'HEARTBEAT', 'DISCOVER_REQUEST', 'REGISTRY_MESSAGE_TYPE_UNSPECIFIED'].includes(request.type)) {
            call.write({
                type: 'ERROR',
                message: `Unsupported registry message type: ${request.type}`,
                service: request.service || {},
                services: [],
                timestamp: timestamp
            });
        }
    });

    call.on('cancelled', () => {
        console.log('Registry stream cancelled by client');
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
        ServiceRegistryStream: ServiceRegistryStream
    });

    server.bindAsync(
        '0.0.0.0:50054',
        grpc.ServerCredentials.createInsecure(),
        (error) => {
            if (error) {
                console.error(error);
                return;
            }

            console.log('Registry Service running on port 50054');
            server.start();
        }
    );
}

main();
