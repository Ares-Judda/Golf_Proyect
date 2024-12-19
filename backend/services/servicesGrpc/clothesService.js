const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { getAllArticulos, getArticulosBySelling, saveArticulo, deleteArticulo, update_articulo, getArticleByName} = require('../../Logic/controllersGpc/clothes');

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/clothes.proto'));
const proto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

server.addService(proto.ArticulosService.service, {
    GetAllArticulos: (call, callback) => { 
        try {
            getAllArticulos(call, (error, response) => {  
                if (error) {
                    console.error("Error al obtener artículos:", error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error al obtener los artículos"
                    });
                } else {
                    callback(null, { articulos: response.articulos });
                }
            });
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            callback({
                code: grpc.status.INTERNAL,
                details: "Error inesperado en el servidor"
            });
        }
    },
    GetArticulosBySelling: (call, callback) => {
        try {
            const { ID_Selling } = call.request;
            console.log('ID_Sellin servidor: ', ID_Selling);
            if (!ID_Selling) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    details: "El ID del vendedor no fue proporcionado en servicio"
                });
            }
            getArticulosBySelling(ID_Selling, (error, response) => {
                if (error) {
                    console.error("Error al obtener artículos por vendedor:", error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error al obtener los artículos por vendedor"
                    });
                } else {
                    callback(null, { articulos: response.articulos });
                }
            }); 
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            callback({
                code: grpc.status.INTERNAL,
                details: "Error inesperado en el servidor"
            });
        }
    },
    SaveArticulo: (call, callback) => {
        try {
            const { name, clothecategory, price, size, quota } = call.request;
    
            if (!name || !clothecategory || !price || !size || !quota) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    details: 'Faltan campos obligatorios'
                });
            }
    
            saveArticulo(name, clothecategory, price, size, quota, (error, response) => {
                if (error) {
                    console.error("Error al guardar el artículo:", error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error al guardar el artículo"
                    });
                } else {
                    callback(null, { mensaje: 'Artículo creado exitosamente' });
                }
            });
    
        } catch (error) {
            console.error("Error al procesar la solicitud:", error);
            callback({
                code: grpc.status.INTERNAL,
                details: "Error inesperado en el servidor"
            });
        }
    },
    DeleteArticulo: (call, callback) => {
        try {
            const { ID_Clothes } = call.request;
    
            if (!ID_Clothes) {
                return callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    details: 'ID del artículo no proporcionado'
                });
            }
    
            deleteArticulo(ID_Clothes, (error, response) => {
                if (error) {
                    console.error('Error al eliminar el artículo:', error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: 'Error interno al eliminar el artículo'
                    });
                } else {
                    callback(null, { mensaje: 'Artículo eliminado exitosamente' });
                }
            });
        } catch (error) {
            console.error('Error inesperado al procesar la solicitud:', error);
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error inesperado en el servidor'
            });
        }
    },
    UpdateArticulo: (call, callback) => {
        try {
            console.log('Peticion: ', call.request);
            const { ID_Clothes, actualizaciones } = call.request;
            update_articulo(ID_Clothes, actualizaciones, callback);
        } catch (error) {
            console.error("Error inesperado al procesar la solicitud:", error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Error inesperado en el servidor'
            });
        }
    },
    GetArticuloByName: (call, callback) => {
        try {
            const { name } = call.request; 
    
            getArticleByName(name, (error, response) => {
                if (error) {
                    console.error("Error al obtener artículo por nombre:", error);
                    callback({
                        code: grpc.status.INTERNAL,
                        details: error.details || "Error interno del servidor"
                    });
                } else {
                    callback(null, { articulos: response.articulos });
                }
            });
        } catch (error) {
            console.error("Error en la solicitud:", error);
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
    server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Error al iniciar el servidor gRPC: ${error.message}`);
            return;
        }
        console.log(`gRPC Server corriendo en http://127.0.0.1:${port}`);
    });
};