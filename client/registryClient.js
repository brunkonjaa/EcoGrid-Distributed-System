const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../protos/registry.proto';
const DEFAULT_REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS || 'localhost:50054';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const registryProto = grpc.loadPackageDefinition(packageDefinition).registry;

function createRegistryStub(address = DEFAULT_REGISTRY_ADDRESS) {
    return new registryProto.RegistryService(
        address,
        grpc.credentials.createInsecure()
    );
}

function createRegistrySession(address = DEFAULT_REGISTRY_ADDRESS) {
    const client = createRegistryStub(address);
    const stream = client.ServiceRegistryStream();
    const pendingResponses = [];
    let isClosed = false;

    stream.on('data', (response) => {
        const pending = pendingResponses.shift();

        if (!pending) {
            return;
        }

        if (response.type === 'ERROR') {
            pending.reject(new Error(response.message || 'Registry returned an error'));
            return;
        }

        if (pending.expectedTypes.length > 0 && !pending.expectedTypes.includes(response.type)) {
            pending.reject(
                new Error(`Unexpected registry response type: ${response.type}`)
            );
            return;
        }

        pending.resolve(response);
    });

    stream.on('error', (error) => {
        while (pendingResponses.length > 0) {
            pendingResponses.shift().reject(error);
        }
    });

    stream.on('end', () => {
        isClosed = true;
        while (pendingResponses.length > 0) {
            pendingResponses.shift().reject(new Error('Registry stream ended'));
        }
    });

    function sendMessage(type, service = {}, expectedTypes = []) {
        if (isClosed) {
            return Promise.reject(new Error('Registry stream is closed'));
        }

        return new Promise((resolve, reject) => {
            pendingResponses.push({
                expectedTypes,
                resolve,
                reject
            });

            stream.write({
                type,
                message: '',
                service,
                services: [],
                timestamp: new Date().toISOString()
            });
        });
    }

    return {
        register(serviceInfo) {
            return sendMessage('REGISTER', serviceInfo, ['ACK']);
        },
        sendHeartbeat(serviceInfo) {
            return sendMessage('HEARTBEAT', serviceInfo, ['ACK']);
        },
        discover(serviceName = '') {
            return sendMessage(
                'DISCOVER_REQUEST',
                { service_name: serviceName },
                ['DISCOVER_RESPONSE']
            );
        },
        close() {
            if (!isClosed) {
                isClosed = true;
                stream.end();
            }
        }
    };
}

async function discoverService(serviceName, address = DEFAULT_REGISTRY_ADDRESS) {
    const session = createRegistrySession(address);

    try {
        const response = await session.discover(serviceName);
        const discoveredService = response.services.find(
            (service) => service.service_name === serviceName
        ) || response.service;

        if (!discoveredService || !discoveredService.host || !discoveredService.port) {
            throw new Error(`Service not found in registry: ${serviceName}`);
        }

        return discoveredService;
    } finally {
        session.close();
    }
}

async function runCli() {
    const command = process.argv[2];
    const value = process.argv[3] || '';
    const session = createRegistrySession();

    try {
        if (command === 'discover') {
            const response = await session.discover(value);
            console.log('Discovery response:', response);
            return;
        }

        if (command === 'register') {
            const serviceInfo = {
                service_name: process.argv[3],
                host: process.argv[4],
                port: Number(process.argv[5]),
                rpc_package: process.argv[6] || '',
                timestamp: new Date().toISOString()
            };

            const registerResponse = await session.register(serviceInfo);
            console.log('Register response:', registerResponse);

            const heartbeatResponse = await session.sendHeartbeat(serviceInfo);
            console.log('Heartbeat response:', heartbeatResponse);
            return;
        }

        console.log('Usage:');
        console.log('  node registryClient.js discover <service-name>');
        console.log('  node registryClient.js register <service-name> <host> <port> <rpc-package>');
    } catch (error) {
        console.error('Registry client error:', error.message);
        process.exitCode = 1;
    } finally {
        session.close();
    }
}

if (require.main === module) {
    runCli();
}

module.exports = {
    createRegistrySession,
    discoverService
};
