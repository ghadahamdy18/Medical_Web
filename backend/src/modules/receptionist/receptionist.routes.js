const express = require('express');
const router = express.Router();

const receptionistController = require('./receptionist.controller.js');
const validation = require('./receptionist.validation.js');

const authMiddleware = require('../../middlewares/auth.middleware.js');
const roleMiddleware = require('../../middlewares/role.middleware.js');

// Both middlewares export plain functions — use them directly
router.use(authMiddleware);
router.use(roleMiddleware('receptionist'));

/**
 * Dashboard
 */
router.get('/dashboard', receptionistController.getDashboard);

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
