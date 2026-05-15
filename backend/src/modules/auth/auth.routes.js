const express = require('express');

const router = express.Router();

const authController = require('./auth.controller.js');
const {
    registerPatientValidation,
    loginValidation,
    changePasswordValidation,
    updateProfileValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} = require('./auth.validation.js');

const authMiddleware = require('../../middlewares/auth.middleware.js');

router.post('/register', registerPatientValidation, authController.registerPatient);
router.post('/login', loginValidation, authController.login);

router.post(
    '/forgot-password',
    forgotPasswordValidation,
    authController.forgotPassword
);

router.post(
    '/reset-password',
    resetPasswordValidation,
    authController.resetPassword
);

router.get('/me', authMiddleware, authController.getMe);
router.patch(
    '/profile',
    authMiddleware,
    updateProfileValidation,
    authController.updateProfile
);
router.patch(
    '/change-password',
    authMiddleware,
    changePasswordValidation,
    authController.changePassword
);

router.post('/logout', authMiddleware, authController.logout);

module.exports = router;