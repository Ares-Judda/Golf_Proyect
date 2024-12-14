const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { login } = require('../controllers/auth'); // Asegúrate de importar la función correctamente

const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/auth.proto'));
const proto = grpc.loadPackageDefinition(packageDefinition);

// Crear el servidor gRPC
const server = new grpc.Server();

// Añadir servicio gRPC
server.addService(proto.AuthService.service, {
    LoginUsuario: async (call, callback) => {
        try {
            const { email, password } = call.request;

            console.log(`Intentando autenticar al usuario con email: ${email}`);

            // Llamada al login y manejar el token directamente
            const response = await login(email, password);  // Ahora login retorna la respuesta que necesitas

            if (response.mensaje && response.mensaje.includes('Credenciales inválidas')) {
                return callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: response.mensaje,
                });
            }

            // Enviar la respuesta de vuelta al cliente gRPC
            callback(null, {
                idUser: response.idUser,   // Devolvemos el idUser
                email: response.email,     // Y el email del usuario
                role: response.role,       // Y el role del usuario
                token: response.token      // También devolvemos el token generado
            });
        } catch (error) {
            console.error('Error en LoginUsuario:', error);
            callback({
                code: grpc.status.INTERNAL,
                message: 'Error interno en el servidor',
            });
        }
    }
});

// Iniciar el servidor
module.exports.start = () => {
    server.bindAsync('192.168.1.67:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Error al iniciar el servidor gRPC: ${error.message}`);
            return;
        }
        console.log(`gRPC Server corriendo en http://192.168.1.67:${port}`);
    });
};