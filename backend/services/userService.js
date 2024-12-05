const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { get_all_usuarios, save_usuario, get_usuario, update_usuario_body, logout_usuario } = require('../controllers/users');
const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/user.proto'));
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const UserService = grpcObject.UserService;

const server = new grpc.Server();

server.addService(UserService.service, {
    GetAllUsuarios: async (call, callback) => {
        try {
            const usuarios = await get_all_usuarios();
            callback(null, { usuarios });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: "Error al obtener los usuarios"
            });
        }
    },

    SaveUsuario: async (call, callback) => {
        try {
            const { email, role, password, imagen, name, lastname, username } = call.request;
            await save_usuario({ email, role, password, imagen, name, lastname, username });
            callback(null, { mensaje: 'Usuario registrado exitosamente' });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error al registrar el usuario'
            });
        }
    },

    GetUsuario: async (call, callback) => {
        try {
            const usuario = await get_usuario(call.request);
            callback(null, usuario);
        } catch (error) {
            callback({
                code: grpc.status.NOT_FOUND,
                details: 'Usuario no encontrado'
            });
        }
    },

    UpdateUsuario: async (call, callback) => {
        try {
            const { idUser, email, username, imagen } = call.request;
            await update_usuario_body({ idUser, email, username, imagen });
            callback(null, { mensaje: 'Usuario actualizado exitosamente' });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error al actualizar el usuario'
            });
        }
    },

    LogoutUsuario: async (call, callback) => {
        try {
            const { idUser } = call.request;
            await logout_usuario({ idUser });
            callback(null, { mensaje: 'Sesión cerrada exitosamente' });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                details: 'Error al cerrar sesión'
            });
        }
    }
});

// Exportar una función que inicie el servidor sin necesidad de llamar a start()
module.exports.start = () => {
    server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Error al iniciar el servidor gRPC: ${error.message}`);
            return;
        }
        console.log(`gRPC Server corriendo en http://127.0.0.1:${port}`);
        // La llamada a server.start() ya no es necesaria
    });
};
