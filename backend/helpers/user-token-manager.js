/**
 * Clase para gestionar los usuarios y sus tokens de sesión.
 * Implementa el patrón Singleton para asegurar que solo haya una instancia.
 */
class UserTokenManager {
    constructor() {
        this.users = {};
    }

    /**
     * Agrega un nuevo usuario al gestor de tokens.
     * @param {string} email - El correo electrónico del usuario.
     * @param {string} uid - El identificador único del usuario.
     * @param {string} token - El token JWT del usuario.
     */
    addUser(email, uid, token) {
        this.users[uid] = { email, token };
    }

    /**
     * Obtiene la información de un usuario a partir de su correo electrónico.
     * @param {string} email - El correo electrónico del usuario.
     * @returns {Object|null} - Devuelve un objeto con uid y token si el usuario existe, o null si no.
     */
    getUser(uid) {
        return this.users[uid] || null;
    }

    /**
     * Elimina un usuario del gestor de tokens.
     * @param {string} email - El correo electrónico del usuario a eliminar.
     */
    logoutUser(uid) {
        if (this.users[uid]) {
            delete this.users[uid]; 
        }
    }

    /**
     * Obtiene la instancia única de UserTokenManager.
     * @returns {UserTokenManager} - La instancia única de UserTokenManager.
     */
    static getInstance() {
        if (!UserTokenManager.instance) {
            UserTokenManager.instance = new UserTokenManager();
        }
        return UserTokenManager.instance;
    }
}

module.exports = UserTokenManager.getInstance();
