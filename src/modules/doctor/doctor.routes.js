const express = require('express');

const router = express.Router();

const doctorController = require('./doctor.controller.js');
const doctorValidation = require('./doctor.validation.js');

const authMiddleware = require('../../middlewares/auth.middleware.js');
const roleMiddleware = require('../../middlewares/role.middleware.js');
const upload = require('../../middlewares/upload.middleware.js');

// All doctor routes require a valid JWT + doctor role
router.use(authMiddleware);
router.use(roleMiddleware('doctor'));

/**
 * GET /doctor/my-appointments
 * List all appointments assigned to the logged-in doctor.
 * Supports optional query: ?appointmentStatus=confirmed&appointmentType=in_lab&page=1&limit=10
 */
router.get('/my-appointments', doctorController.getMyAppointments);

/**
 * GET /doctor/appointments/:appointmentId
 * View a single appointment detail (must be assigned to this doctor).
 */
router.get(
    '/appointments/:appointmentId',
    doctorValidation.appointmentIdParamValidation,
    doctorController.getAppointmentDetails
);

/**
 * PATCH /doctor/appointments/:appointmentId/complete
 * Mark a confirmed appointment as completed.
 */
router.patch(
    '/appointments/:appointmentId/complete',
    doctorValidation.appointmentIdParamValidation,
    doctorController.completeAppointment
);

/**
 * POST /doctor/appointments/:appointmentId/results
 * Upload a PDF result file for a test.
 * Field name: resultFile (multipart/form-data)
 * Body: { testName: string }
 * Implements versioning — old latest result is replaced, history preserved.
 */
router.post(
    '/appointments/:appointmentId/results',
    doctorValidation.appointmentIdParamValidation,
    upload.single('resultFile'),
    doctorValidation.uploadResultValidation,
    doctorController.uploadResult
);

/**
 * GET /doctor/appointments/:appointmentId/results
 * Retrieve all result files for an appointment (newest first).
 */
router.get(
    '/appointments/:appointmentId/results',
    doctorValidation.appointmentIdParamValidation,
    doctorController.getAppointmentResults
);

module.exports = router;