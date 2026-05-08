const express = require('express');
const router = express.Router();

const receptionistController = require('./receptionist.controller.js');
const validation = require('./receptionist.validation.js');

// Assuming middlewares exist and export these functions
// If they are default exports, this might need adjustment, e.g., require('../../middlewares/auth.middleware.js') directly
const authMiddleware = require('../../middlewares/auth.middleware.js');
const roleMiddleware = require('../../middlewares/role.middleware.js');

const authenticate = authMiddleware.authenticate || authMiddleware;
const authorizeRoles = roleMiddleware.authorizeRoles || roleMiddleware;

// Protect all routes
router.use(authenticate);
router.use(authorizeRoles('receptionist'));

// 1 & 2. Patient endpoints
router.post('/patients', validation.createPatientValidation, receptionistController.createPatient);
router.get('/patients', validation.getPatientsValidation, receptionistController.getPatients);
router.get('/patients/:userId', validation.userIdParamValidation, receptionistController.getPatientById);

// 2. Patient Profile endpoints
router.post('/patients/:userId/profiles', validation.createPatientProfileValidation, receptionistController.createPatientProfile);
router.patch('/profiles/:profileId', validation.updateProfileValidation, receptionistController.updateProfile);

// 3. Appointment Creation endpoint
router.post('/appointments', validation.createAppointmentValidation, receptionistController.createAppointment);

// 4. Appointment Operations endpoints
router.get('/appointments', validation.getAppointmentsValidation, receptionistController.getAppointments);
router.patch('/appointments/:id/confirm', validation.idParamValidation, receptionistController.confirmAppointment);
router.patch('/appointments/:id/reschedule', validation.rescheduleAppointmentValidation, receptionistController.rescheduleAppointment);
router.patch('/appointments/:id/cancel', validation.idParamValidation, receptionistController.cancelAppointment);

module.exports = router;
