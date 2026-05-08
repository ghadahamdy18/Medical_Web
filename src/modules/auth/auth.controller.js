const authService = require('./auth.service.js');

const sendSuccess = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
    });
};

const registerPatient = async (req, res, next) => {
    try {
        const result = await authService.registerPatient(req.body);

        return sendSuccess(res, 201, 'Patient registered successfully', result);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        return sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(req.user._id, req.body);

        return sendSuccess(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user._id);

        return sendSuccess(res, 200, 'User profile retrieved successfully', {
            user,
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        return sendSuccess(res, 200, 'Logout successful. Please remove the token from client storage.');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerPatient,
    login,
    changePassword,
    getMe,
    logout,
};