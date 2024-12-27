const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { getAllVentas } = require('../../Logic/controllersGpc/sales');

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/sales.proto'));
const proto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

server.addService(proto.VentasService.service, {
    GetAllVentas: (call, callback) => { 
        try {
            const { ID_Selling, InitialDate, CutDate } = call.request;
            if (!ID_Selling && !InitialDate && !CutDate) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    details: "El ID del vendedor y las fechas no fueron proporcionados en servicio"
                });
            }
            getAllVentas(ID_Selling, InitialDate, CutDate, (error, response) => {  
                if (error) {
                    console.error("Error al obtener ventas:", error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error al obtener las ventas"
                    });
                } else {
                    callback(null, { ventas: response.ventas });
                }
            });
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            callback({
                code: grpc.status.INTERNAL,
                details: "Error inesperado en el servidor"
            });
        }
    }
});


// Exportar una función que inicie el servidor
// CAMBIAR DIRECCION SI ES NECESARIO
module.exports.start = () => {
    server.bindAsync('192.168.1.75:50052', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Error al iniciar el servidor gRPC: ${error.message}`);
            return;
        }
        console.log(`gRPC Server corriendo en http://192.168.1.75:${port}`);
    });
};