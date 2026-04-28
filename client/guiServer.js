const http = require('http');
const fs = require('fs');
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { discoverService, createRegistrySession } = require('./registryClient');

const PORT = Number(process.env.GUI_PORT || 3000);
const GUI_DIR = path.join(__dirname, 'gui');

const PROTO_OPTIONS = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
};

const temperatureProto = loadProto('../protos/temperature.proto').temperature;
const occupancyProto = loadProto('../protos/occupancy.proto').occupancy;
const controlProto = loadProto('../protos/control.proto').control;

function loadProto(relativePath) {
    const packageDefinition = protoLoader.loadSync(path.join(__dirname, relativePath), PROTO_OPTIONS);
    return grpc.loadPackageDefinition(packageDefinition);
}

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json'
    });
    response.end(JSON.stringify(payload));
}

function sendError(response, statusCode, message) {
    sendJson(response, statusCode, {
        ok: false,
        error: message
    });
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';

        request.on('data', (chunk) => {
            body += chunk;
        });

        request.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(new Error('Invalid JSON request body'));
            }
        });

        request.on('error', reject);
    });
}

function createClient(ServiceType, serviceInfo) {
    return new ServiceType(
        `${serviceInfo.host}:${serviceInfo.port}`,
        grpc.credentials.createInsecure()
    );
}

async function discoverKnownServices() {
    const serviceNames = ['temperature-service', 'occupancy-service', 'control-service'];
    const results = [];

    for (const serviceName of serviceNames) {
        try {
            const service = await discoverService(serviceName);
            results.push({
                service_name: service.service_name,
                host: service.host,
                port: service.port,
                rpc_package: service.rpc_package,
                timestamp: service.timestamp,
                status: 'DISCOVERED'
            });
        } catch (error) {
            results.push({
                service_name: serviceName,
                status: 'UNAVAILABLE',
                error: error.message
            });
        }
    }

    return results;
}

async function handleRegistry(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const serviceName = url.searchParams.get('service') || '';

    if (serviceName) {
        const service = await discoverService(serviceName);
        sendJson(response, 200, {
            ok: true,
            service
        });
        return;
    }

    const services = await discoverKnownServices();
    sendJson(response, 200, {
        ok: true,
        services
    });
}

async function handleRegistrySnapshot(response) {
    const session = createRegistrySession();

    try {
        const registryResponse = await session.discover('');
        sendJson(response, 200, {
            ok: true,
            services: registryResponse.services,
            message: registryResponse.message,
            timestamp: registryResponse.timestamp
        });
    } finally {
        session.close();
    }
}

async function handleTemperature(request, response) {
    const body = await readRequestBody(request);
    const area = body.area || 'Room A';
    const service = await discoverService('temperature-service');
    const client = createClient(temperatureProto.TemperatureService, service);

    client.GetTemperature({ area }, (error, data) => {
        if (error) {
            sendError(response, 502, error.message);
            return;
        }

        sendJson(response, 200, {
            ok: true,
            endpoint: `${service.host}:${service.port}`,
            data
        });
    });
}

async function handleOccupancy(request, response) {
    const body = await readRequestBody(request);
    const area = body.area || 'Room A';
    const service = await discoverService('occupancy-service');
    const client = createClient(occupancyProto.OccupancyService, service);
    const stream = client.SubscribeOccupancy({ area });
    const updates = [];

    stream.on('data', (data) => {
        updates.push(data);
    });

    stream.on('end', () => {
        sendJson(response, 200, {
            ok: true,
            endpoint: `${service.host}:${service.port}`,
            updates
        });
    });

    stream.on('error', (error) => {
        sendError(response, 502, error.message);
    });
}

async function handleControl(request, response) {
    const body = await readRequestBody(request);
    const service = await discoverService('control-service');
    const client = createClient(controlProto.ControlService, service);
    const readings = Array.isArray(body.readings) && body.readings.length > 0
        ? body.readings
        : [{
            area: body.area || 'Room A',
            temperature_value: Number(body.temperature_value || 24),
            occupied: Boolean(body.occupied),
            people_count: Number(body.people_count || 0)
        }];

    const call = client.SendSensorData((error, data) => {
        if (error) {
            sendError(response, 502, error.message);
            return;
        }

        sendJson(response, 200, {
            ok: true,
            endpoint: `${service.host}:${service.port}`,
            sent: readings,
            data
        });
    });

    readings.forEach((reading) => {
        call.write({
            area: reading.area || 'Room A',
            temperature_value: Number(reading.temperature_value),
            occupied: Boolean(reading.occupied),
            people_count: Number(reading.people_count)
        });
    });

    call.end();
}

function serveStatic(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.normalize(path.join(GUI_DIR, requestedPath));

    if (!filePath.startsWith(GUI_DIR)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404);
            response.end('Not found');
            return;
        }

        const extension = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript'
        };

        response.writeHead(200, {
            'Content-Type': contentTypes[extension] || 'text/plain'
        });
        response.end(content);
    });
}

async function handleApiRequest(request, response) {
    try {
        if (request.method === 'GET' && request.url.startsWith('/api/registry/snapshot')) {
            await handleRegistrySnapshot(response);
            return;
        }

        if (request.method === 'GET' && request.url.startsWith('/api/registry')) {
            await handleRegistry(request, response);
            return;
        }

        if (request.method === 'POST' && request.url === '/api/temperature') {
            await handleTemperature(request, response);
            return;
        }

        if (request.method === 'POST' && request.url === '/api/occupancy') {
            await handleOccupancy(request, response);
            return;
        }

        if (request.method === 'POST' && request.url === '/api/control') {
            await handleControl(request, response);
            return;
        }

        sendError(response, 404, 'Unknown API route');
    } catch (error) {
        sendError(response, 500, error.message);
    }
}

const server = http.createServer((request, response) => {
    if (request.url.startsWith('/api/')) {
        handleApiRequest(request, response);
        return;
    }

    serveStatic(request, response);
});

server.listen(PORT, () => {
    console.log(`EcoGrid GUI running at http://localhost:${PORT}`);
});
