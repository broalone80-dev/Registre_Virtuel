/**
 * INDEX DES MIDDLEWARES
 */

const { authenticate, authorize, generateToken } = require('./auth');
const validate = require('./validate');

module.exports = {
    authenticate,
    authorize,
    generateToken,
    validate
};
