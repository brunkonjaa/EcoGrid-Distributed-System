const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = __dirname + '/../../protos/occupancy.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const occupancyProto = grpc.loadPackageDefinition(packageDefinition).occupancy;

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
        }
    );
}

main();