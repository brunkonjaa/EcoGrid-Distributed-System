const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../protos/occupancy.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const occupancyProto = grpc.loadPackageDefinition(packageDefinition).occupancy;

const client = new occupancyProto.OccupancyService(
    'localhost:50052',
    grpc.credentials.createInsecure()
);

const call = client.SubscribeOccupancy({ area: 'Room A' });

call.on('data', (response) => {
    console.log('Occupancy Update:', response);
});

call.on('end', () => {
    console.log('Stream ended');
});

call.on('error', (error) => {
    console.error('Error:', error);
});