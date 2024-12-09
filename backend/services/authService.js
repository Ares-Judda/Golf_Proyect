const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { login } = require('../controllers/auth'); 
const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/auth.proto'));
const grpcObject = grpc.loadPackageDefinition(packageDefinition);
const AuthService = grpcObject.AuthService;

const server = new grpc.Server();

server.addService(AuthService.service, {
    LoginUsuario: async (call, callback) => {
        try {
            const { email, password } = call.request;

            console.log(`Intentando autenticar al usuario con email: ${email}`);
            const response = await new Promise((resolve, reject) => {
                const mockRes = {
                    status: (code) => {
                        this.code = code;
                        return this;
                    },
                    json: (data) => resolve(data),
                };

                login({ body: { email, password } }, mockRes); 
            });

            if (response.mensaje && response.mensaje.includes('Credenciales inválidas')) {
                return callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: response.mensaje,
                });
            }

            callback(null, {
                token: response.token, 
                mensaje: 'Inicio de sesión exitoso',
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

module.exports.start = () => {
    server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Error al iniciar el servidor gRPC: ${error.message}`);
            return;
        }
        console.log(`gRPC Server corriendo en http://127.0.0.1:${port}`);
    });
};
