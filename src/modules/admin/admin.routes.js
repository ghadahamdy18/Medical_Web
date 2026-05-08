const express = require('express');

const router = express.Router();

const adminController = require('./admin.controller.js');
const adminValidation = require('./admin.validation.js');

const authMiddleware = require('../../middlewares/auth.middleware.js');
const roleMiddleware = require('../../middlewares/role.middleware.js');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

/**
 * User management
 */
router.post(
    '/users',
    adminValidation.createUserValidation,
    adminController.createUser
);

router.get(
    '/users',
    adminValidation.getUsersValidation,
    adminController.getUsers
);

router.get(
    '/users/:userId',
    adminValidation.userIdParamValidation,
    adminController.getUserById
);

router.patch(
    '/users/:userId',
    adminValidation.userIdParamValidation,
    adminValidation.updateUserValidation,
    adminController.updateUser
);

router.patch(
    '/users/:userId/status',
    adminValidation.userIdParamValidation,
    adminValidation.updateUserStatusValidation,
    adminController.updateUserStatus
);

/**
 * Patient profile management
 */
router.get(
    '/profiles',
    adminValidation.getPatientProfilesValidation,
    adminController.getPatientProfiles
);

router.post(
    '/users/:userId/profiles',
    adminValidation.userIdParamValidation,
    adminValidation.createPatientProfileValidation,
    adminController.createPatientProfile
);

router.patch(
    '/profiles/:profileId',
    adminValidation.profileIdParamValidation,
    adminValidation.updatePatientProfileValidation,
    adminController.updatePatientProfile
);

router.patch(
    '/profiles/:profileId/deactivate',
    adminValidation.profileIdParamValidation,
    adminController.deactivatePatientProfile
);

/**
 * Appointment management
 */
router.post(
    '/appointments',
    adminValidation.createAppointmentValidation,
    adminController.createAppointment
);

router.get(
    '/appointments',
    adminValidation.getAppointmentsValidation,
    adminController.getAppointments
);

router.get(
    '/appointments/:appointmentId',
    adminValidation.appointmentIdParamValidation,
    adminController.getAppointmentById
);

router.patch(
    '/appointments/:appointmentId',
    adminValidation.appointmentIdParamValidation,
    adminValidation.updateAppointmentValidation,
    adminController.updateAppointment
);

router.patch(
    '/appointments/:appointmentId/confirm',
    adminValidation.appointmentIdParamValidation,
    adminController.confirmAppointment
);

router.patch(
    '/appointments/:appointmentId/complete',
    adminValidation.appointmentIdParamValidation,
    adminController.completeAppointment
);

router.patch(
    '/appointments/:appointmentId/cancel',
    adminValidation.appointmentIdParamValidation,
    adminController.cancelAppointment
);

/**
 * Result file management
 * Admin views results only. Upload is doctor-only according to project rules.
 */
router.get(
    '/results',
    adminValidation.getResultsValidation,
    adminController.getResults
);

router.get(
    '/results/:resultId',
    adminValidation.resultIdParamValidation,
    adminController.getResultById
);

module.exports = router;