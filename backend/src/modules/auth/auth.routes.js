const express = require('express');

const router = express.Router();

const authController = require('./auth.controller.js');
const {
    registerPatientValidation,
    loginValidation,
    changePasswordValidation,
} = require('./auth.validation.js');

const authMiddleware = require('../../middlewares/auth.middleware.js');

router.post('/register', registerPatientValidation, authController.registerPatient);
router.post('/login', loginValidation, authController.login);

router.get('/me', authMiddleware, authController.getMe);
router.patch(
    '/change-password',
    authMiddleware,
    changePasswordValidation,
    authController.changePassword
);

router.post('/logout', authMiddleware, authController.logout);

module.exports = router;